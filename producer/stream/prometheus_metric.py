from prometheus_client import Counter, Summary, start_http_server

# Define Prometheus metrics
LATENCY = Summary('producer_latency_seconds', 'Latency in seconds from streaming start to Kafka publish')
THROUGHPUT = Counter('producer_throughput', 'Number of messages published to Kafka')

def start_prometheus_server(port=8001):
    start_http_server(port)