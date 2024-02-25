import { IChannel } from "./channels";

export interface IStation {
    code: string;
    lat: number | string;
    long: number | string;
    name: string;
    elevation: number | string;
    channels: IChannel[]
    status: "ACTIVE" | "ENABLED" | "DISABLED"
}