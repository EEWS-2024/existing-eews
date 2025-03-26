import os
from app.container import KafkaContainer
from dotenv import load_dotenv

from app.prometheus_metric import start_prometheus_server

load_dotenv()

BOOTSTRAP_SERVERS = os.getenv("BOOTSTRAP_SERVERS", "172.20.0.77:9093")
TOPIC_CONSUMER = os.getenv("BOOTSTRAP_SERVERS", "p_arrival")
REDIS_HOST = os.getenv("REDIS_HOST", "172.20.0.80")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
MONGO_DB = os.getenv("MONGO_DB", "eews")
MONGO_HOST = os.getenv("MONGO_HOST", "172.20.0.88")
MONGO_PORT = os.getenv("MONGO_PORT", "27017")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "parameters")
PROMETHEUS_ADDR = os.getenv("PROMETHEUS_ADDR", "0.0.0.0")
PROMETHEUS_PORT = os.getenv("PROMETHEUS_PORT", "8012")

if __name__ == "__main__":
    start_prometheus_server()
    container = KafkaContainer()
    container.config.from_dict(
        {
            "bootstrap_servers": BOOTSTRAP_SERVERS,
            "kafka_config": {
                "bootstrap.servers": BOOTSTRAP_SERVERS,
                "group.id": "picker",
                "auto.offset.reset": "latest",
            },
            "redis": {
                "host": REDIS_HOST,
                "port": int(REDIS_PORT),
            },
            "mongo": {
                "db_name": MONGO_DB,
                "host": MONGO_HOST,
                "port": int(MONGO_PORT),
                "collection": MONGO_COLLECTION,
            },
        },
        True,
    )
    
    data_processor = container.data_processor()
    print("=" * 20 + f"Consuming Data From {TOPIC_CONSUMER} Topic" + "=" * 20)
    data_processor.consume(TOPIC_CONSUMER)
