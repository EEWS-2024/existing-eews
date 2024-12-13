from prometheus_client import Counter, Histogram, start_http_server

# Define Prometheus metrics
EXECUTION_TIME = Histogram('queue_execution_time', 'Execution time in seconds from streaming start to Kafka publish')
THROUGHPUT = Counter('queue_throughput', 'Number of messages published to Kafka')
LATENCY = Histogram('queue_latency', 'Latency in seconds from data arrival to Kafka publish')

def start_prometheus_server(port=8002):
    start_http_server(port)