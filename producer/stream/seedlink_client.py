from time import process_time
from typing import Optional, Any

import psutil

from .prometheus_metric import EXECUTION_TIME, THROUGHPUT
from .client import StreamClient
from .const import StreamMode
from .producer import KafkaProducer
from obspy.clients.seedlink import EasySeedLinkClient
from obspy import Trace
import json
from datetime import datetime, UTC
import time
from obspy.clients.seedlink.slpacket import SLPacket


class SeedLinkClient(StreamClient, EasySeedLinkClient):
    def __init__(self, producer: KafkaProducer, server_url: str):
        self.server_url = server_url
        StreamClient.__init__(self, mode=StreamMode.LIVE, producer=producer)
        EasySeedLinkClient.__init__(self, server_url=self.server_url)
        self.__streaming_started = False
        print("Starting new seedlink client")
        for station in self.stations:
            self.select_stream(net="GE", station=station, selector="BH?")
        print("Starting connection to seedlink server ", self.server_hostname)
        self.experiment_attempt = 0
        self.experiment_execution_times = []
        self.experiment_processed_data = []
        self.experiment_cpu_usages = []  # Add this line
        self.experiment_memory_usages = []  # Add this line

    def run(self):
        if not len(self.conn.streams):
            raise Exception(
                "No streams specified. Use select_stream() to select a stream"
            )
        self.__streaming_started = True
        # Start the collection loop
        print("Starting collection on:", datetime.now(UTC))
        service_start_time = time.time()
        experiment_data_count = 0
        while True:
            experiment_start_time = time.time()
            data = self.conn.collect()
            arrive_time = datetime.now(UTC)
            process_start_time = time.time()

            if data == SLPacket.SLTERMINATE:
                self.on_terminate()
                break
            elif data == SLPacket.SLERROR:
                self.on_seedlink_error()
                continue

            assert isinstance(data, SLPacket)
            packet_type = data.get_type()
            if packet_type not in (SLPacket.TYPE_SLINF, SLPacket.TYPE_SLINFT):
                trace = data.get_trace()
                if trace.stats.channel in ["BHZ", "BHN", "BHE"]:
                    self.on_data_arrive(trace, arrive_time, process_start_time)
                    experiment_data_count += len(trace.data.tolist())
                    if time.time() - experiment_start_time >= 1:
                        self.experiment_processed_data.append(experiment_data_count)
                        experiment_data_count = 0

                THROUGHPUT.inc()

            end_time = time.time()
            self.experiment_execution_times.append(end_time - experiment_start_time)
            self.experiment_cpu_usages.append(psutil.cpu_percent())  # Add this line
            self.experiment_memory_usages.append(psutil.virtual_memory().percent)  # Add this line
            if end_time - service_start_time >= 900.0:
                self.save_experiment()
                self.experiment_attempt += 1
                service_start_time = time.time()
                if self.experiment_attempt == 5:
                    self.stop_streaming()
                    break


    def start_streaming(self, start_time: Optional[Any]= None, end_time: Optional[Any]= None):
        self.producer.start_trace()
        print("-" * 20, "Streaming miniseed from seedlink server", "-" * 20)
        if not self.__streaming_started:
            self.run()

    def stop_streaming(self):
        self.producer.stop_trace()
        self.close()
        print("-" * 20, "Stopping miniseed", "-" * 20)

    def on_data_arrive(self, trace: Trace, arrive_time: datetime, process_start_time: float):
        msg = self._map_values(trace, arrive_time, process_start_time)
        self.producer.produce_message(json.dumps(msg), msg["station"], StreamMode.LIVE)

    def save_experiment(self):
        experiment_execution_time = self.experiment_execution_times[1:] if self.experiment_attempt == 0 else self.experiment_execution_times

        stats_data = {
            "execution_times": experiment_execution_time,
            "processed_data": self.experiment_processed_data,
            "experiment_cpu_usages": self.experiment_cpu_usages,  # Add this line
            "experiment_memory_usages": self.experiment_memory_usages  # Add this line
        }
        with open(f"./out/experiment_stats_{self.experiment_attempt}.json", "w") as f:
            json.dump(stats_data, f, indent=4)

        self.experiment_execution_times = []
        self.experiment_processed_data = []
        self.experiment_cpu_usages = []  # Add this line
        self.experiment_memory_usages = []  # Add this line

