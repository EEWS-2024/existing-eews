import { IWaveform } from "./waveform";

export interface IChannel {
  stationCode: string;
  code: string;
  enabled?: boolean;
  depth: number;
  azimuth: number;
  dip: number;
  sample_rate: number;
  waveform: IWaveform
}
