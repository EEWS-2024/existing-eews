import time
from datetime import datetime, UTC
import json
import os
from confluent_kafka import Producer
from dotenv import load_dotenv

load_dotenv()

TOPIC_PRODUCER = os.getenv("TOPIC_PRODUCER", "p_arrival")


class KafkaProducer:
    def __init__(self, bootstrap_servers):
        self.producer = Producer({"bootstrap.servers": bootstrap_servers})

    def produce(
        self,
        station,
        channel,
        data,
        start_time,
        end_time,
        eews_producer_time=None,
        arrive_time=datetime.now(UTC),
    ):
        if eews_producer_time is None:
            eews_producer_time = [
                arrive_time.isoformat(),
                datetime.now(UTC).isoformat(),
            ]
        data = {
            "station": station,
            "channel": channel,
            "starttime": start_time.isoformat(),
            "endtime": end_time.isoformat(),
            "data": data,
            "len": len(data),
            "eews_producer_time": eews_producer_time,
            "eews_queue_time": [arrive_time.isoformat(), datetime.now(UTC).isoformat()],
            "type": "trace",
            "published_at": time.time(),
        }

        print("Producing ", station, channel, len(data))
        self.producer.produce(TOPIC_PRODUCER, key=station, value=json.dumps(data))

    def start_trace(self, partition):
        self.producer.produce(
            topic=TOPIC_PRODUCER,
            key="start",
            value=json.dumps({"type": "start"}),
            partition=int(partition),
        )
        self.producer.flush()

    def stop_trace(self, partition):
        self.producer.produce(
            topic=TOPIC_PRODUCER,
            key="stop",
            value=json.dumps({"type": "stop"}),
            partition=int(partition),
        )
        self.producer.flush()
