import { useEEWS } from "@/lib/hooks/useEEWS";
import { FeatureCollection } from "geojson";
import { Source, Layer, Marker } from "react-map-gl";
import React from "react";
import { useRef, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";

export const EventMarker: React.FC = () => {
  const { event } = useEEWS();
  const markerRef = useRef<mapboxgl.Marker>(null);

  const togglePopup = useCallback(() => {
    markerRef.current?.togglePopup();
  }, []);
  const popup = useMemo(() => {
    if (!event) return;
    return new mapboxgl.Popup().setHTML(
      `
      <table>
        <tr>
            <td>Tanggal</td>
            <td>: ${new Date(event.time).toLocaleDateString()}</td>
        </tr>
        <tr>
            <td>Time</td>
            <td>: ${new Date(event.time).toLocaleTimeString()}</td>
        </tr>
        <tr>
            <td>Magnitudo</td>
            <td>: ${event.magnitude}</td>
        </tr>
        <tr>
            <td>Lat</td>
            <td>: ${event.latitude}</td>
        </tr>
        <tr>
            <td>Long</td>
            <td>: ${event.longitude}</td>
        </tr>
        <tr>
            <td>Depth</td>
            <td>: ${event.depth}</td>
        </tr>
      </table>`
    );
  }, [event]);
  if (!event) return <div></div>;

  return (
    <div>
      <Marker
        anchor="center"
        scale={0.7}
        ref={markerRef}
        popup={popup}
        onClick={togglePopup}
        latitude={Number(event.latitude)}
        longitude={Number(event.longitude)}
      >
        <div className="rounded-full bg-red-500 p-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="white"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        </div>
      </Marker>
      <Source
        id="dot-point"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [event.longitude, event.latitude], // icon position [lng, lat]
              },
              properties: {},
            },
          ],
        }}
      >
        <Layer
          id="layer-with-pulsing-dot"
          type="symbol"
          source="dot-point"
          layout={{
            "icon-image": "pulsing-dot",
          }}
        />
      </Source>
    </div>
  );
};
