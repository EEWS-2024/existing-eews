import os
from app.container import KafkaContainer
from dotenv import load_dotenv

from app.prometheus_metric import start_prometheus_server

load_dotenv()

BOOTSTRAP_SERVERS = os.getenv("BOOTSTRAP_SERVERS", "old-eews-kafka:9092")
TOPIC_CONSUMER = os.getenv("TOPIC_CONSUMER", "query")


if __name__ == "__main__":
    try:
        start_prometheus_server()
        container = KafkaContainer()
        container.config.from_dict(
            {
                'bootstrap_servers': BOOTSTRAP_SERVERS,
                'kafka_config': {
                    'bootstrap.servers': BOOTSTRAP_SERVERS,
                    'group.id': 'queue',
                    'auto.offset.reset': 'latest',
                }
            }, True)
        data_processor = container.data_processor()
        print("=" * 20 + f"Consuming Data From {TOPIC_CONSUMER} Topic" + "=" * 20)
        data_processor.consume(TOPIC_CONSUMER)
    except Exception as e:
        print(f"An error occurred: {e}")
