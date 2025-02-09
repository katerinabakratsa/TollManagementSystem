import React, { useContext, useEffect, useState } from "react";
import { Row, Col, Button, Container, Card } from "react-bootstrap";
import StatisticCard from "../components/StatisticCard";
import { AppContext } from "../context/AppContext";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import api from "../api/api";
import LiveData from "../components/LiveData";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Pass {
  stationID: string;
}

interface TollStation {
  TollID: string;
  Name: string;
  OpID: string;
}

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useContext(AppContext);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [tollStations, setTollStations] = useState<TollStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [chartType, setChartType] = useState<"column" | "pie">("column");
  const [startDate, setStartDate] = useState<Date | null>(new Date("2022-01-01"));
  const [endDate, setEndDate] = useState<Date | null>(new Date("2022-12-31"));

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      const headers = { headers: { "X-OBSERVATORY-AUTH": token } };

      const stationsResponse = await api.get("/admin/tollstations", headers);
      setTollStations(stationsResponse.data || []);

      if (!stationsResponse.data || stationsResponse.data.length === 0) {
        setError("No toll stations found.");
        return;
      }

      const firstOpID = stationsResponse.data[0]?.OpID;
      if (!firstOpID) {
        setError("No valid OpID found.");
        return;
      }

      console.log("Using OpID:", firstOpID);

      const formattedStart = startDate ? startDate.toISOString().split("T")[0].replace(/-/g, "") : "20220101";
      const formattedEnd = endDate ? endDate.toISOString().split("T")[0].replace(/-/g, "") : "20221231";

      const passesResponse = await api.get(
        `/passAnalysis/stationOpID/${firstOpID}/tagOpID/${firstOpID}/date_from/${formattedStart}/date_to/${formattedEnd}`,
        headers
      );

      setPasses(passesResponse.data?.[0]?.passList || []);
    } catch (err: any) {
      setError("Failed to fetch data.");
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  const passesPerToll: { [key: string]: number } = {};
  if (passes && Array.isArray(passes)) {
    passes.forEach((pass) => {
      const stationID = pass.stationID;
      passesPerToll[stationID] = (passesPerToll[stationID] || 0) + 1;
    });
  }

  const chartData = tollStations.map((ts) => ({
    name: ts.Name,
    y: passesPerToll[ts.TollID] || 0,
  }));

  const chartOptions = {
    chart: { type: chartType },
    title: { text: "Ανάλυση Δεδομένων Διελεύσεων" },
    xAxis: { categories: tollStations.map((ts) => ts.Name) },
    series: [{ name: "Διελεύσεις", data: chartData }],
  };

  return (
    <Container className="mt-5 text-center dashboard-container">
      <h1 className="dashboard-title">Ανάλυση Δεδομένων</h1>

      <Row className="mt-4">
        <Col md={6}>
          <Card className="dashboard-card">
            <h5>Σύνολο Σταθμών</h5>
            <h2>{tollStations.length}</h2>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="dashboard-card">
            <h5>Σύνολο Διελεύσεων</h5>
            <h2>{passes.length || 0}</h2>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4 justify-content-center">
        <Col md={4}>
          <Card className="dashboard-card">
            <h5>Ημερομηνία Έναρξης</h5>
            <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="yyyy-MM-dd" />
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-card">
            <h5>Ημερομηνία Λήξης</h5>
            <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="yyyy-MM-dd" />
          </Card>
        </Col>
      </Row>

      <Button variant="success" className="mt-3 apply-filters-button" onClick={fetchData}>
        Εφαρμογή Φίλτρων
      </Button>

      <div className="mt-4">
        <h5>Τύπος Γραφήματος</h5>
        <Button variant="primary" onClick={() => setChartType("column")} className="me-2">Διάγραμμα Στηλών</Button>
        <Button variant="secondary" onClick={() => setChartType("pie")}>Διάγραμμα Πίτας</Button>
      </div>

      <Card className="dashboard-chart-card mt-4">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </Card>
    </Container>
  );
};

export default Dashboard;
