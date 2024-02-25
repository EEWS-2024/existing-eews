import { useEEWS } from "@/lib/hooks/useEEWS";
import { useState } from "react";
import { ControlStations } from "./Station";
import { ControlMode } from "./Mode";
import { ControlPickEvent } from "./PickEvent";
import { ControlStatistics } from "./Statistics";

type PanelTab = "PLAYER" | "STATIONS" | "ARRIVAL" | "STATISTICS";

export const ControlPanel = () => {
  const { stations } = useEEWS();
  const [currentTab, setTab] = useState<PanelTab>("PLAYER");
  return (
    <div className="w-full text-sm overflow-y-hidden h-full">
      <div className="grid grid-cols-4 gap-0 w-full">
        {["PLAYER", "STATIONS", "ARRIVAL", "STATISTICS"].map((tab, idx) => (
          <div
            key={tab + idx}
            onClick={() => setTab(tab as any)}
            className={`cursor-pointer text-base px-2 text-center text-white font-semibold py-1 ${currentTab == tab ? "bg-indigo-950" : "bg-indigo-800"} hover:bg-indigo-900`}
          >
            {tab.toLowerCase()}
          </div>
        ))}
      </div>
      <div className="p-4 flex flex-col overflow-auto max-h-full pb-10 border-4">
        {currentTab == "STATIONS" && <ControlStations />}
        {currentTab == "PLAYER" && <ControlMode />}
        {currentTab == "ARRIVAL" && <ControlPickEvent/>}
        {currentTab == "STATISTICS" && <ControlStatistics/>}
      </div>
    </div>
  );
};
