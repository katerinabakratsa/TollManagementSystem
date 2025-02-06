// src/pages/MapPage.tsx
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";

interface TollStation {
  TollID: string;
  Name: string;
  Operator: string;
  Latitude: number;
  Longitude: number;
  Status: string;
}

const DefaultIcon = L.icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapPage: React.FC = () => {
  const { isAuthenticated } = useContext(AppContext);
  const [tollStations, setTollStations] = useState<TollStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const defaultCenter: L.LatLngExpression = [37.9838, 23.7275]; // Example Coordinates

  useEffect(() => {
    const fetchTollStations = async () => {
      try {
        const response = await api.get("/admin/tollstations");
        setTollStations(response.data);
      } catch (err: any) {
        setError("Failed to fetch toll stations.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTollStations();
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Toll Stations Map</h1>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          attribution='<a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {tollStations.map((station) => (
          <Marker
            key={station.TollID}
            position={[station.Latitude, station.Longitude]}
          >
            <Popup>
              <strong>{station.Name}</strong>
              <br />
              Operator: {station.Operator}
              <br />
              Status: {station.Status}
              <br />
              Latitude: {station.Latitude}
              <br />
              Longitude: {station.Longitude}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapPage;
