import { IStation } from "../interfaces/stations";
export const clearPacketsStations = (stations: { [index: string]: IStation }) => {
  const copyStations = { ...stations };
  for (const [key, station] of Object.entries(stations)) {
    copyStations[key]["status"] = station.status == "DISABLED" ? "DISABLED" : "ENABLED";
    copyStations[key]["channels"] = station.channels.map((channel) => ({
      ...channel,
      waveform: {
        pick: null,
        data: [],
      },
    }));
  }
  return copyStations;
};
export const parseStations = (res: any) => {
  const _stations: IStation[] = (res.data as any[]).map((st) => ({
    code: st.code,
    name: st.name,
    elevation: Number(st.elevation),
    long: Number(st.long),
    lat: Number(st.lat),
    status: st.enabled ? "ENABLED" : "DISABLED",
    channels: st.channels.map((chan: any) => ({
      ...chan,
      stationCode: st.code,
      waveform: {
        data: [],
        arrival: null,
      },
    })),
  }));
  const _stationsObj = _stations.reduce((acc, curr) => ((acc[curr.code] = curr), acc), {} as any);
  return _stationsObj;
};
