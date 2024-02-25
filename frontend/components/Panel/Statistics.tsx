import { toMetricsFormat } from "@/lib/functions/toiso";
import { useEEWS } from "@/lib/hooks/useEEWS";
import { IStation } from "@/lib/interfaces/stations";
import React from "react";

export const ControlStatistics = () => {
  return (
    <div className="w-full">
      <div className="w-full overflow-y-auto">
        <ControlLastPacket />
      </div>
    </div>
  );
};
const ControlLastPacket = () => {
  const { stations } = useEEWS();
  return (
    <div className="w-full overflow-y-auto">
      <h4 className="font-bold">Last Packet</h4>
      <table className="control-table table-auto text-[8px] relative border-collapse border-black border w-full">
        <thead className="sticky top-0 left-0">
          <tr className="bg-white">
            <th>Stn</th>
            <th>Ch</th>
            <th>Recv At</th>
            <th>Metrics</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(stations) && Object.keys(stations)
            .sort((a, b) => (a > b ? 1 : -1))
            .map((key, idx) =>{
              return (<ControlChannelLastPacket key={`control-channel-last-packet-${key}-${idx}`} {...stations[key]} />)
            })}
        </tbody>
      </table>
    </div>
  );
};
// METRICS: Waveform, Producer, Queue
const ControlChannelLastPacket = (station: IStation) => {
  const chanWithPacket = station.channels.filter((chan) => chan.waveform.data && chan.waveform.data.length > 0).length;
  return (
    <React.Fragment key={`control-station-${station.code}-row-group`}>
      {station.channels.map((chan, idx) => {
        if (chan.waveform.data.length == 0) return <tr key={`control-station-channel-${chan}-${idx}`} ></tr>;
        const lastPacket = chan.waveform.data[chan.waveform.data.length - 1];
        return (
          <React.Fragment key={`control-station-channel-${station.code}-${chan.code}-${idx}-row-group`}>
            <tr key={`control-station-channel-${station.code}-${chan.code}-${idx}-1`}>
              {idx == 0 && <td rowSpan={chanWithPacket * 3}>{station.code}</td>}
              <td rowSpan={3}>{chan.code}</td>
              <td rowSpan={3}>{toMetricsFormat(new Date(lastPacket.recvAt))}</td>
              <td>Waveform</td>
              <td>{toMetricsFormat(new Date(lastPacket.starttime))}</td>
              <td>{toMetricsFormat(new Date(lastPacket.endtime))}</td>
            </tr>
            <tr key={`control-station-channel-${station.code}-${chan.code}-${idx}-2`}>
              <td>Producer</td>
              <td>{toMetricsFormat(new Date(lastPacket.eews_producer_time[0] + "Z"))}</td>
              <td>{toMetricsFormat(new Date(lastPacket.eews_producer_time[1] + "Z"))}</td>
            </tr>
            <tr key={`control-station-channel-${station.code}-${chan.code}-${idx}-3`}>
              <td>Queue</td>
              <td>{toMetricsFormat(new Date(lastPacket.eews_queue_time[0] + "Z"))}</td>
              <td>{toMetricsFormat(new Date(lastPacket.eews_queue_time[1] + "Z"))}</td>
            </tr>
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};
