import { useEEWS } from "@/lib/hooks/useEEWS";
import { IChannel } from "@/lib/interfaces/channels";
import { IStation } from "@/lib/interfaces/stations";
import React from "react";

export const ControlPickEvent = () => {
  return (
    <div className="w-full flex flex-col gap-y-4">
      <div className="flex flex-col justify-between w-full rounded bg-slate-100 p-2">
        <h4 className="font-semibold text-base">Pick (P Arrival)</h4>
        <ControlPickTable />
      </div>
      <div className="flex flex-col justify-between w-full rounded bg-slate-100 p-2">
        <h4 className="font-semibold text-base">Event (Earthquake)</h4>
        <ControlEvent />
      </div>
    </div>
  );
};
const ControlEvent = () => {
  const { event } = useEEWS();
  return (
    <table className="table-fixed relative border-collapse w-full">
      <tr>
        <td>Tanggal</td>
        <td>: {event ? new Date(event.time).toLocaleDateString() : "-"}</td>
      </tr>
      <tr>
        <td>Time</td>
        <td>: {event ? new Date(event.time).toLocaleTimeString() : "-"}</td>
      </tr>
      <tr>
        <td>Magnitudo</td>
        <td>: {event ? event.magnitude : "-"}</td>
      </tr>
      <tr>
        <td>Lat</td>
        <td>: {event ? event.latitude : "-"}</td>
      </tr>
      <tr>
        <td>Long</td>
        <td>: {event ? event.longitude : "-"}</td>
      </tr>
      <tr>
        <td>Depth</td>
        <td>: {event ? event.depth : "-"}</td>
      </tr>
      <tr>
        <td>Detected At</td>
        <td>: {event ? new Date(event.detectedAt).toLocaleString() : "-"}</td>
      </tr>
    </table>
  );
};
const ControlPickTable = () => {
  const { stations } = useEEWS();
  let channels: IChannel[] = [];
  Object.keys(stations).forEach((key) => {
    const hasPick = stations[key].channels.filter((chan) => chan.waveform.pick?.arrival);
    if (hasPick.length > 0) {
      channels = channels.concat(hasPick);
    }
  });
  return (
    <table className="control-table table-auto relative border-collapse border-black border w-full">
      <thead className="sticky top-0 left-0">
        <tr className="bg-white">
          <th>Station</th>
          <th>Channels</th>
          <th>Pick</th>
          <th>Detected</th>
        </tr>
      </thead>
      <tbody>
        {channels.length == 0 && (
          <tr>
            <td colSpan={4} className="text-center">
              No data
            </td>
          </tr>
        )}
        {channels.length > 0 && (
          <>
            {channels.map((channel, idx) => (
              <ControlPick key={`control-pick-${channel.stationCode}-${channel.code}-${idx}`} channel={channel} />
            ))}
          </>
        )}
      </tbody>
    </table>
  );
};

const ControlPick: React.FC<{ channel: IChannel }> = ({ channel }) => {
  return (
    <>
      {channel.waveform.pick?.arrival && (
        <tr>
          <td>{channel.stationCode}</td>
          <td>{channel.code}</td>
          <td>{new Date(channel.waveform.pick.arrival).toLocaleString()}</td>
          <td>{new Date(channel.waveform.pick.arrivalDetected).toLocaleString()}</td>
        </tr>
      )}
    </>
  );
};