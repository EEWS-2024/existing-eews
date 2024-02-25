import { Inter } from 'next/font/google';
import { MapGL } from '@/components/map';
import { Navbar } from '@/components/Navbar';
import { StationCharts } from '@/components/Charts';
import { useEffect, useState } from 'react';
import { useEEWS } from '@/lib/hooks/useEEWS';
import { ControlPanel } from '@/components/Panel';
import { createWSConnection } from '@/lib/connection';
import { Toaster } from 'react-hot-toast';
import { EEWSProvider } from '@/lib/hooks/eewsCtx';

const inter = Inter({ subsets: ['latin'] });

export default function HomePage() {
  return (
    <EEWSProvider>
      <Home />
    </EEWSProvider>
  );
}

function Home() {
  const [connection, setConnection] = useState<WebSocket>();
  const { stations, packetsCount, websocketCallbacks } = useEEWS();
  useEffect(() => {
    if (!connection && Object.entries(stations).length > 0 && !!packetsCount) {
      console.log(stations);
      const websocket = createWSConnection('/ws', websocketCallbacks);
      setConnection(websocket);
    }
    const onUnload = () => {
      console.log('disconnecting');
      connection?.close();
    };
    window.onbeforeunload = function (e) {
      return onUnload();
    };
  }, [connection, packetsCount, stations, websocketCallbacks]);

  return (
    <main
      className={`flex min-h-screen w-full flex-col items-start ${inter.className}`}
    >
      <Navbar />
      <div id="main-section" className="w-full">
        <Toaster />
        <div
          id="map-control"
          className="w-full flex sticky top-0 z-20 border-2 border-indigo-950"
        >
          <div id="map" className=" w-3/4 h-[45vh]">
            <MapGL />
          </div>
          <div id="station-control" className="bg-indigo-100  h-[45vh] w-1/4">
            <ControlPanel />
          </div>
        </div>
        <div className="w-full min-h-[40vh] bg-indigo-100">
          <StationCharts />
        </div>
      </div>
      <footer className="bg-indigo-950 w-full h-32">EEWS Pacil 2020</footer>
    </main>
  );
}
