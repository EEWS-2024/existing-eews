import { ChannelChart } from "./channel";
import RenderIfVisible from "react-render-if-visible";
import { useEEWS } from "@/lib/hooks/useEEWS";
import { IChannel } from "@/lib/interfaces/channels";

export const StationCharts = () => {
  const { stations, group } = useEEWS();
  return (
    <div className="max-h-screen w-full p-4 overflow-auto">
      {group.filter(f=>!!f).map((k, idx) => {
        return (
          <div key={`${k}-station-${idx}`}>
            {stations[k].channels.map((chan, idx) => (
              <RenderIfVisible key={chan.code + chan.stationCode + idx} defaultHeight={100} visibleOffset={50}>
                <ChannelChart channel={chan} />
              </RenderIfVisible>
            ))}
            <div id={k} />
          </div>
        );
      })}
    </div>
  );
};
