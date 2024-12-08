from kafka import KafkaConsumer
import json

# Configuration
KAFKA_BROKER = 'localhost:19092'  # Update with your broker address
TOPIC_NAME = 'query'

def consume_messages():
    # Create a Kafka consumer
    consumer = KafkaConsumer(
        TOPIC_NAME,
        bootstrap_servers=KAFKA_BROKER,
        auto_offset_reset='earliest',  # Start reading at the earliest message
        enable_auto_commit=True,      # Commit offsets automatically
        group_id='my-consumer-group', # Consumer group ID
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))  # Deserialize JSON messages
    )

    print(f"Listening for messages on topic: {TOPIC_NAME}")

    # Consume messages
    for message in consumer:
        print(f"Received message: {message.value}")

if __name__ == "__main__":
    consume_messages()
