from stream.client import StreamClient, StreamMode
from stream.producer import KafkaProducer
from obspy.clients.seedlink import EasySeedLinkClient
from obspy import Trace
import json
from datetime import datetime
import time
from obspy.clients.seedlink.slpacket import SLPacket
from stream.const import StreamMode
from utils.redis_client import RedisSingleton


class SeedlinkClient(StreamClient, EasySeedLinkClient):
    def __init__(self, producer: KafkaProducer, server_url: str):
        self.latency_metrics = []
        self.throughput_metrics = []
        self.server_url = server_url
        StreamClient.__init__(self, mode=StreamMode.LIVE, producer=producer)
        EasySeedLinkClient.__init__(self, server_url=self.server_url)
        self.__streaming_started = False
        print("Starting new seedlink client")
        for station in self.stations:
            self.select_stream(net="GE", station=station, selector="BH?")
        print("Starting connection to seedlink server ", self.server_hostname)

    def run(self):
        if not len(self.conn.streams):
            raise Exception(
                "No streams specified. Use select_stream() to select a stream"
            )
        self.__streaming_started = True
        # Start the collection loop
        print("Starting collection on:", datetime.utcnow())
        while True:
            start_time = time.time()
            arrive_time = datetime.utcnow()
            data = self.conn.collect()
            latency = time.time() - start_time
            self.latency_metrics.append(latency)
            print(f"Data collection latency: {latency} seconds")
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
                self.on_data(trace, arrive_time=arrive_time)

    def startStreaming(self):
        self.producer.startTrace()
        print("-" * 20, "Streaming miniseed from seedlink server", "-" * 20)
        if not self.__streaming_started:
            self.run()

    def stopStreaming(self):
        self.producer.stopTrace()
        self.close()
        avg_latency, avg_throughput = self.calculate_metrics()
        print(f"Average Latency: {avg_latency} seconds")
        print(f"Average Throughput: {avg_throughput} data points/second")
        print("-" * 20, "Stopping miniseed", "-" * 20)

    def on_data(self, trace: Trace, arrive_time):
        start_time = time.time()
        arrive_time = datetime.utcnow()
        msg = self._extract_values(trace, arrive_time)
        self.producer.produce_message(json.dumps(msg), msg["station"], StreamMode.LIVE)
        processing_time = time.time() - start_time
        self.throughput_metrics.append(len(trace.data) / processing_time)
    
    def calculate_metrics(self):
        avg_latency = sum(self.latency_metrics) / len(self.latency_metrics) if self.latency_metrics else 0
        avg_throughput = sum(self.throughput_metrics) / len(self.throughput_metrics) if self.throughput_metrics else 0
        return avg_latency, avg_throughput

