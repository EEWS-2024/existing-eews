import { WS_URL } from "../credentials";

export const createWSConnection = (
  str: string,
  cb: (message: MessageEvent<any>) => void
) => {
  console.log(WS_URL);

  const socket = new WebSocket(`${WS_URL}${str}`);
  console.log("CREATEWSConnection");
  socket.onopen = () => {
    console.log("Connect");
  };
  socket.onmessage = cb;
  socket.onclose = (close) => {
    console.log(close.reason);
    console.log(close);
  };
  return socket;
};
