from typing import Optional, Any

from producer.stream.prometheus_metric import EXECUTION_TIME, THROUGHPUT
from producer.stream.client import StreamClient
from producer.stream.const import StreamMode
from producer.stream.producer import KafkaProducer
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

    def run(self):
        if not len(self.conn.streams):
            raise Exception(
                "No streams specified. Use select_stream() to select a stream"
            )
        self.__streaming_started = True
        # Start the collection loop
        print("Starting collection on:", datetime.now(UTC))
        while True:
            start_time = time.time()
            data = self.conn.collect()
            arrive_time = datetime.now(UTC)

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
                self.on_data_arrive(trace, arrive_time)
                THROUGHPUT.inc()

            EXECUTION_TIME.observe(time.time() - start_time)

    def start_streaming(self, start_time: Optional[Any]= None, end_time: Optional[Any]= None):
        self.producer.start_trace()
        print("-" * 20, "Streaming miniseed from seedlink server", "-" * 20)
        if not self.__streaming_started:
            self.run()

    def stop_streaming(self):
        self.producer.stop_trace()
        self.close()
        print("-" * 20, "Stopping miniseed", "-" * 20)

    def on_data_arrive(self, trace: Trace, arrive_time: datetime):
        msg = self._map_values(trace, arrive_time)
        self.producer.produce_message(json.dumps(msg), msg["station"], StreamMode.LIVE)

