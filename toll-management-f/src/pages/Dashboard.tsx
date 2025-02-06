// src/pages/Dashboard.tsx

import React, { useContext, useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import StatisticCard from "../components/StatisticCard";
import { AppContext } from "../context/AppContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../api/api";
import LiveData from "../components/LiveData"; // Import LiveData

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Pass {
  tollID: string;
  // Add other fields as needed
}

interface TollStation {
  TollID: string;
  Name: string;
}

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useContext(AppContext);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [tollStations, setTollStations] = useState<TollStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch passes and toll stations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch passes
        const passesResponse = await api.get("/passes");
        setPasses(passesResponse.data);

        // Fetch toll stations
        const stationsResponse = await api.get("/admin/tollstations");
        setTollStations(stationsResponse.data);
      } catch (err: any) {
        setError("Failed to fetch data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  // Calculate total toll stations and total passes
  const totalTollStations = tollStations.length;
  const totalPasses = passes.length;

  // Calculate passes per toll station
  const passesPerToll: { [key: string]: number } = {};
  passes.forEach((pass) => {
    passesPerToll[pass.tollID] = (passesPerToll[pass.tollID] || 0) + 1;
  });

  // Prepare data for the bar chart
  const chartData = {
    labels: tollStations.map((ts) => ts.Name),
    datasets: [
      {
        label: "# of Passes",
        data: tollStations.map((ts) => passesPerToll[ts.TollID] || 0),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Dashboard</h1>
      <LiveData /> {/* Integrate LiveData */}
      <Row className="mt-4">
        <Col md={6}>
          <StatisticCard
            title="Total Toll Stations"
            value={totalTollStations}
          />
        </Col>
        <Col md={6}>
          <StatisticCard title="Total Passes" value={totalPasses} />
        </Col>
      </Row>
      <div className="mt-4">
        <h3>Passes per Toll Station</h3>
        <Bar data={chartData} />
      </div>
    </div>
  );
};

export default Dashboard;
