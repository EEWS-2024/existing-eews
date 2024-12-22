import json
import pickle
import time
from datetime import datetime, timedelta, UTC
from typing import List, Dict, Any
import copy

import psutil
from confluent_kafka import Consumer
from .missing_data_handler import MissingDataHandler
from .producer import KafkaProducer
from .prometheus_metric import EXECUTION_TIME, LATENCY, THROUGHPUT


class KafkaDataProcessor:
    def __init__(
        self, consumer: Consumer, producer: KafkaProducer, data_handler: MissingDataHandler
    ):
        self.consumer = consumer
        self.data_handler = data_handler
        self.producer = producer
        self.partitions = []

        self.experiment_attempt = 0
        self.experiment_execution_times = []
        self.experiment_processed_data = []
        self.experiment_latencies = []
        self.cpu_usages = []  # Add this line
        self.memory_usages = []  # Add this line

    def save_experiment(self):
        experiment_execution_time = self.experiment_execution_times[1:] if self.experiment_attempt == 0 else self.experiment_execution_times

        stats_data = {
            "execution_times": experiment_execution_time,
            "processed_data": self.experiment_processed_data,
            "latencies": self.experiment_latencies,
            "cpu_usages": self.cpu_usages,  # Add this line
            "memory_usages": self.memory_usages  # Add this line
        }
        with open(f"./out/experiment_stats_{self.experiment_attempt}.json", "w") as f:
            json.dump(stats_data, f, indent=4)

        self.experiment_execution_times = []
        self.experiment_processed_data = []
        self.experiment_latencies =[]
        self.cpu_usages = []  # Add this line
        self.memory_usages = []  # Add this line

    def consume(self, topic: str):
        self.consumer.subscribe([topic])
        i = 1
        show_nf = True

        service_start_time = time.time()
        experiment_data_count = 0
        while True:
            experiment_start_time = time.time()

            msg = self.consumer.poll(10)
            self.partitions = self.consumer.assignment()

            if msg is None:
                if show_nf:
                    print("No message received :(")
                show_nf = False
                continue
            if msg.error():
                print(f"Error: {msg.error()}")
                continue

            show_nf = True
            value = pickle.loads(msg.value())
            value = json.loads(value)

            logvalue = copy.copy(value)
            logvalue["data"] = None
            if value["type"] == "start":
                print(i)
                self._start()
            if value["type"] == "stop":
                print(i)
                i = 1
                self._flush(sampling_rate=20)
            if value["type"] == "trace":
                i += 1
                self.experiment_latencies.append(time.time() - value['published_at'])
                self.__process_received_data(value, arrive_time=datetime.now(UTC))
                experiment_data_count += len(value["data"])
                if time.time() - experiment_start_time >= 1:
                    self.experiment_processed_data.append(experiment_data_count)
                    experiment_data_count = 0

                end_time = time.time()
                self.experiment_execution_times.append(end_time - experiment_start_time)
                self.cpu_usages.append(psutil.cpu_percent())  # Add this line
                self.memory_usages.append(psutil.virtual_memory().percent)

            if time.time() - service_start_time >= 900.0:
                self.save_experiment()
                self.experiment_attempt += 1
                service_start_time = time.time()

    def __process_received_data(self, value: Dict[str, Any], arrive_time: datetime):
        station = value["station"]
        channel = value["channel"]
        eews_producer_time = value["eews_producer_time"]
        data = value["data"]
        start_time = datetime.fromisoformat(value["starttime"])
        sampling_rate = value["sampling_rate"]


        self.data_handler.handle_missing_data(
            station, channel, start_time, sampling_rate
        )
        self.__store_data(
            station,
            channel,
            data,
            start_time,
            sampling_rate,
            eews_producer_time=eews_producer_time,
            arrive_time=arrive_time,
            process_start_time=value["process_start_time"],
        )

    def __store_data(
        self,
        station: str,
        channel: str,
        data: List[int],
        start_time: datetime,
        sampling_rate: float,
        eews_producer_time,
        arrive_time: datetime,
        process_start_time: float,
    ):

        current_time = start_time
        if (
            station in self.data_handler.last_processed_time
            and channel in self.data_handler.last_processed_time[station]
        ):
            current_time = self.data_handler.last_processed_time[station][channel]

        self.data_handler.data_pool[station][channel].extend(data)

        while len(self.data_handler.data_pool[station][channel]) >= 128:
            data_to_send = self.data_handler.data_pool[station][channel][:128]
            self.data_handler.data_pool[station][channel] = self.data_handler.data_pool[
                station
            ][channel][128:]
            time_to_add = timedelta(seconds=128 / sampling_rate)
            self.__send_data_to_queue(
                station,
                channel,
                data_to_send,
                current_time,
                current_time + time_to_add,
                eews_producer_time=eews_producer_time,
                arrive_time=arrive_time,
                process_start_time=process_start_time
            )
            current_time = current_time + time_to_add

    def __send_data_to_queue(
        self,
        station: str,
        channel: str,
        data: List[int],
        start_time: datetime,
        end_time: datetime,
        eews_producer_time,
        arrive_time: datetime,
        process_start_time: float
    ):
        self.data_handler.update_last_processed_time(station, channel, end_time)
        self.producer.produce(
            station,
            channel,
            data,
            start_time,
            end_time,
            eews_producer_time=eews_producer_time,
            arrive_time=arrive_time,
            process_start_time=process_start_time
        )

    def _start(self):
        for i in self.partitions:
            self.producer.start_trace(i.partition)
        self.data_handler.reset_state()

    def _flush(self, sampling_rate):
        for station, stationDict in self.data_handler.data_pool.items():
            for channel, data_to_send in stationDict.items():
                end_time = self.data_handler.last_processed_time[station][channel]
                time_to_decrease = timedelta(seconds=len(data_to_send) / sampling_rate)
                start_time = end_time - time_to_decrease
                if station == "BKB" and channel == "BHE":
                    print("Flused ", station, channel, start_time, end_time)
                self.producer.produce(
                    station, channel, data_to_send, start_time, end_time
                )
        print("=" * 20, "END", "=" * 20)
        for i in self.partitions:
            self.producer.stop_trace(i.partition)
