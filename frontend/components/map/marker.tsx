import { IStation } from "@/lib/interfaces/stations";
import React from "react";
import { Marker } from "react-map-gl";
import { useRef, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";

const COLOR_MAP = {
  ACTIVE: "rgb(0,255,0)",
  ENABLED: "rgb(50, 50, 255)",
  DISABLED: "rgb(255,0,0)",
};

export const Station: React.FC<IStation> = (props) => {
  const { code, elevation, lat, long, name, channels, status } = props;
  const markerRef = useRef<mapboxgl.Marker>(null);

  const popup = useMemo(() => {
    return new mapboxgl.Popup().setHTML(
      `
      <table>
        <tr>
          <td>Status</td>
          <td>: ${status}</td>
        </tr>
        <tr>
          <td>Kode</td>
          <td>: ${code}</td>
        </tr>
        <tr>
          <td>Nama</td>
          <td>: ${name}</td>
        </tr>
        <tr>
          <td>Lat</td>
          <td>: ${lat}</td>
        </tr>
        <tr>
          <td>Long</td>
          <td>: ${long}</td>
        </tr>
        <tr>
          <td>Elevation</td>
          <td>: ${elevation}</td>
        </tr>
        <tr>
          <td>Channel</td>
          <td>: ${channels!.map((c) => c.code).join(", ")}</td>
        </tr>
      </table>
      <div>`
    );
  }, [status]);

  const togglePopup = useCallback(() => {
    markerRef.current?.togglePopup();
  }, []);

  return (
    <Marker
      anchor="bottom"
      scale={0.7}
      ref={markerRef}
      popup={popup}
      onClick={togglePopup}
      latitude={Number(lat)}
      longitude={Number(long)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={COLOR_MAP[status]} className="w-8 h-8">
        <path
          fillRule="evenodd"
          d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      </svg>
    </Marker>
  );
};
