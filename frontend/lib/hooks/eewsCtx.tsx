import { createContext, useCallback, useEffect, useState } from "react";
import { IStation } from "../interfaces/stations";
import { IPacketWaveform, IWaveform } from "../interfaces/waveform";
import { ISEvent, IPEvent } from "../interfaces/events";
import { AxiosClient } from "../axios";
import { clearPacketsStations, parseStations } from "../functions/parseStations";
import { useRouter } from "next/router";
import { IChannel } from "../interfaces/channels";

interface IEEWSContext {
  stations: { [index: string]: IStation }; // for control panels, and map markers
  websocketCallbacks: (message: MessageEvent<any>) => void; // set channel, set pick, and set event
  event?: ISEvent; // for map markers of earthquakes
  packetsCount: number; // number of packets
  setLoading: () => void;
  setMinutes?: (m: number) => void;
  group: string[];
  setGroup?: (s: string[]) => void;
}

export const EEWSContext = createContext<IEEWSContext>({
  stations: {},
  setLoading: () => {},
  websocketCallbacks: () => {},
  packetsCount: 50,
  group: [],
});

interface IEEWSData {
  stations: { [index: string]: IStation };
  currentMode?: string;
  event?: ISEvent;
}

export const EEWSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [eewsData, setEewsData] = useState<IEEWSData>({
    stations: {},
  });
  const [group, setGroup] = useState<string[]>([]);
  const [packetsCount, setPacketsCount] = useState(50);
  const setMultiplePEvent = (messages: any[]) => {
    let newData = { ...eewsData };
    for (const message of messages) {
      const d = message.data
      setPEvent(
        {
          p_arr: d.p_arr,
          p_arr_time: d.p_arr_time + "+00",
          s_arr: d.s_arr,
          s_arr_time: d.s_arr_time + "+00",
          station_code: d.station_code,
          type: d.type,
        },
        newData
      );
    }
    setEewsData(newData);
  };
  const setPEvent = (data: IPEvent, newData: IEEWSData) => {
    const { p_arr, p_arr_time, station_code, s_arr } = data;
    console.log("setPEvent")
    console.log(data)
    if (p_arr && s_arr) {
      const copyStations = { ...eewsData.stations };
      copyStations[station_code].channels.forEach((chan) => {
        chan["waveform"]["pick"] = {
          arrival: new Date(p_arr_time).getTime(),
          arrivalDetected: new Date().getTime(),
        };
      });
      console.log("channel pick: ", copyStations[station_code]);
      setEewsData({ ...eewsData, stations: copyStations });
    }
  };

  const setMultipleWaveform = (traces: any[]) => {
    let newData = { ...eewsData };
    for (const t of traces) {
      const d = t.data
      if (d.type == "start") {
        newData["stations"] = clearPacketsStations(newData.stations);
        continue
      }
      if(d.type == "stop") {
        continue
      }
      setChannelsWaveform(d, newData);
    }
    setEewsData(newData);
  };

  const setChannelsWaveform = (data: IPacketWaveform, newData: IEEWSData) => {
    const { channel, station } = data;
    try {
      const currentStations = newData["stations"][station];
      currentStations["status"] = "ACTIVE";
      const currentChannels = currentStations.channels.find((chan) => chan.code == channel);
      let chan_data = currentChannels!.waveform.data;
      chan_data.push({ ...data, recvAt: new Date().getTime() });
      currentChannels!["waveform"]["data"] = chan_data;
    } catch (error) {
      console.error(data);
      console.error(error);
    }
  };

  const setLoading = () => {
    console.log("Loading...");
  };

  const setParams = (message: any) => {
    if (!message) return;
    const data = message.data
    console.log("Setting parameters...");
    console.log(data)
    setEewsData({
      ...eewsData,
      event: {
        detectedAt: new Date(),
        depth: data.depth,
        latitude: data.latitude,
        longitude: data.longitude,
        magnitude: data.magnitude,
        station_codes: data.station_codes,
        time: data.time,
        type: data.type,
      },
    });
  };

  useEffect(() => {
    async function fetchStations() {
      const res = await AxiosClient.get("/api/stations");
      const stations = parseStations(res);
      setEewsData((old) => ({ ...old, stations: stations }));
      setGroup(["", ...Object.keys(stations).sort((a, b) => (a > b ? 1 : -1))]);
    }
    fetchStations();
  }, []);

  const setMinutes = (m: number) => {
    console.log("setMinutes: ", m*10)
    setPacketsCount(m * 10);
  };

  return (
    <EEWSContext.Provider
      value={{
        stations: eewsData.stations,
        event: eewsData.event,
        packetsCount: packetsCount,
        group: group,
        setGroup: (grs) => {
          const ng = [...group].filter((x) => !!x && !grs.includes(x)).sort((a, b) => (a > b ? 1 : -1));
          setGroup([...grs, "", ...ng]);
        },
        setLoading: setLoading,
        setMinutes: setMinutes,
        websocketCallbacks: (message: MessageEvent<any>) => {
          const res = JSON.parse(message.data) as any[];
          if (!Array.isArray(res)) {
            return;
          }
          const parsed = [];
          for (let i = 0; i < res.length; i++) {
            parsed.push({
              topic: res[i].topic,
              data: JSON.parse(res[i].value),
            });
          }
          console.log("From websocket: " + parsed.length);
          setMultipleWaveform(parsed.filter((p) => p.topic == "p_arrival"));
          setMultiplePEvent(parsed.filter((p) => p.topic != "p_arrival" && p.data.type == "ps"));
          setParams(parsed.filter((p) => p.topic != "p_arrival" && p.data.type == "params")[0]);
        },
      }}
    >
      {children}
    </EEWSContext.Provider>
  );
};
