import { IPacketBase } from "./waveform";

export interface ISEvent extends IPacketBase {
  time: string;
  depth: number;
  magnitude: number;
  latitude: number;
  longitude: number;
  station_codes: string[];
  detectedAt: Date
}
export interface IPEvent extends IPacketBase{
  station_code: string;
  p_arr: boolean;
  // channel: string;
  p_arr_time: string;
  s_arr: boolean;
  s_arr_time: string
  // process_time: number;
}
