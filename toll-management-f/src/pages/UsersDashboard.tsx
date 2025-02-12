import React, { useEffect, useState } from "react";
import { Row, Col, Button, Container, Card } from "react-bootstrap";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import api from "../api/api";

// ----------------------------------------------------------
// Δηλώνουμε τα interfaces ρητά
// ----------------------------------------------------------
interface Pass {
  stationID: string;
  // Αν υπάρχουν κι άλλες ιδιότητες π.χ. passCharge, timestamp κ.λπ., πρόσθεσέ τις εδώ
}

interface TollStation {
  TollID: string;
  Name: string;
  OpID: string;
}

interface ChartData {
  name: string;
  y: number;
}

const UsersDashboard: React.FC = () => {
  // ----------------------------------------------------------
  // States
  // ----------------------------------------------------------
  const [passes, setPasses] = useState<Pass[]>([]);
  const [tollStations, setTollStations] = useState<TollStation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [chartType, setChartType] = useState<"column" | "pie">("column");

  // Ημερομηνίες (από/έως)
  const [startDate, setStartDate] = useState<Date | null>(new Date("2022-01-01"));
  const [endDate, setEndDate] = useState<Date | null>(new Date("2022-12-31"));

  // Για τα στατιστικά
  const [filteredPasses, setFilteredPasses] = useState<number>(0);
  const [filteredStationsWithPasses, setFilteredStationsWithPasses] = useState<number>(0);
  const [filteredTotalStations, setFilteredTotalStations] = useState<number>(0);
  const [filteredChartData, setFilteredChartData] = useState<ChartData[]>([]);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  // ----------------------------------------------------------
  // Ο χρήστης βλέπει ΜΟΝΟ τη δική του εταιρεία => userOpID
  // ----------------------------------------------------------
  const userOpID = localStorage.getItem("OpID") || "";
  // Αν το OpID είναι "null", σημαίνει admin - άρα δεν πρέπει να μπει εδώ
  useEffect(() => {
    if (userOpID === "null") {
      setError("Δεν είστε απλός χρήστης. (Admin)");
    }
  }, [userOpID]);

  // ----------------------------------------------------------
  // useEffect #1 -> Φέρνουμε toll stations (TollStation[])
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchTollStations = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("No authentication token found.");
          setLoading(false);
          return;
        }

        const headers = { headers: { "X-OBSERVATORY-AUTH": token } };
        // Δηλώνουμε ρητά ότι περιμένουμε TollStation[]
        const stationsResponse = await api.get<TollStation[]>("/admin/tollstations", headers);
        const stationsData = stationsResponse.data;

        if (!stationsData || stationsData.length === 0) {
          setError("No toll stations found.");
          setLoading(false);
          return;
        }

        setTollStations(stationsData);
        setLoading(false);
      } catch (err: any) {
        setError("Failed to fetch toll stations.");
        console.error("API error:", err);
        setLoading(false);
      }
    };

    fetchTollStations();
  }, []);

  // ----------------------------------------------------------
  // Συνάρτηση για φέρσιμο passes
  // ----------------------------------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        return;
      }

      if (!userOpID || userOpID === "null") {
        setError("Δεν έχετε δικαίωμα πρόσβασης ή δεν ορίστηκε σωστά το OpID.");
        setLoading(false);
        return;
      }

      const headers = { headers: { "X-OBSERVATORY-AUTH": token } };

      const formattedStart = startDate
        ? startDate.toISOString().split("T")[0].replace(/-/g, "")
        : "20220101";
      const formattedEnd = endDate
        ? endDate.toISOString().split("T")[0].replace(/-/g, "")
        : "20221231";

      console.log("Fetching data for user operator:", userOpID);
      // Παίρνουμε τα passes για τον συγκεκριμένο userOpID
      const passesResponse = await api.get<any>(
        `/passAnalysis2/stationOpID/${userOpID}/tagOpID/${userOpID}/date_from/${formattedStart}/date_to/${formattedEnd}`,
        headers
      );

      // Προσοχή: το response.data μπορεί να έχει διάφορη δομή, ας υποθέσουμε:
      // data: [ { passList: [...], ... } ]
      const newPasses: Pass[] = passesResponse.data?.[0]?.passList || [];
      setPasses(newPasses);
      setFilteredPasses(newPasses.length);

      // Υπολογισμός διελεύσεων ανά σταθμό
      const passesPerToll: { [stationID: string]: number } = {};
      newPasses.forEach((p: Pass) => {
        const stationID = p.stationID;
        passesPerToll[stationID] = (passesPerToll[stationID] || 0) + 1;
      });

      // Για το Highcharts
      // Object.keys() => string[]
      const updatedChartData: ChartData[] = Object.keys(passesPerToll).map((stationID: string) => ({
        name: tollStations.find((ts) => ts.TollID === stationID)?.Name || stationID,
        y: passesPerToll[stationID] || 0,
      }));

      setFilteredChartData(updatedChartData);
      setFilteredStationsWithPasses(updatedChartData.length);

      // Πόσοι σταθμοί (του ίδιου userOpID) υπάρχουν γενικά;
      const stationsForUser = tollStations.filter((ts) => ts.OpID === userOpID);
      setFilteredTotalStations(stationsForUser.length);

    } catch (err: any) {
      setError("Failed to fetch data.");
      console.error("API error:", err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // ----------------------------------------------------------
  // Αρχικό loading
  // ----------------------------------------------------------
  if (loading && initialLoad) {
    return <div className="container mt-5">Loading...</div>;
  }
  if (error) {
    return <div className="container mt-5 text-danger">{error}</div>;
  }

  // ----------------------------------------------------------
  // Ρυθμίσεις του Highcharts
  // ----------------------------------------------------------
  const chartOptions: Highcharts.Options = {
    chart: { type: chartType },
    title: { text: "Διελεύσεις ανά Σταθμό" },
    tooltip: {
      pointFormat: "{series.name}: <b>{point.y}</b>",
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y}", // ✅ Εμφάνιση του ονόματος του σταθμού αντί για "slice"
        },
      },
    },
    xAxis: { categories: filteredChartData.map((data) => data.name) },
    yAxis: { title: { text: "Διελεύσεις" } },
    series: [
      {
        name: "Διελεύσεις",
        data: filteredChartData.map((d) => ({
          name: d.name, // ✅ Χρησιμοποιούμε το όνομα του σταθμού
          y: d.y,
        })),
        type: chartType,
      },
    ],
  };
  

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <Container className="mt-5 text-center dashboard-container">
      {/* ---------- Δεν δείχνουμε operator dropdown ---------- */}
      <Row className="mt-4 justify-content-between">
        <Col md={4}>
          <h5>Ημερομηνία Έναρξης</h5>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
          />
        </Col>
        <Col md={4}>
          <h5>Ημερομηνία Λήξης</h5>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
          />
        </Col>
      </Row>

      <Button variant="success" className="mt-3 apply-filters-button" onClick={fetchData}>
        Εφαρμογή Φίλτρων
      </Button>

      <Row className="mt-4 justify-content-center">
        <Col md={4}>
          <Card className="dashboard-summary-card">
            <h5>Σύνολο Σταθμών (της εταιρείας σου)</h5>
            <h2>{filteredTotalStations}</h2>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-summary-card">
            <h5>Σταθμοί με Διελεύσεις</h5>
            <h2>{filteredStationsWithPasses}</h2>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-summary-card">
            <h5>Σύνολο Διελεύσεων</h5>
            <h2>{filteredPasses}</h2>
          </Card>
        </Col>
      </Row>

      <div className="mt-4">
        <h5>Τύπος Γραφήματος</h5>
        <Button
          variant={chartType === "column" ? "primary" : "outline-primary"}
          onClick={() => setChartType("column")}
          className="me-2"
        >
          Διάγραμμα Στηλών
        </Button>
        <Button
          variant={chartType === "pie" ? "primary" : "outline-secondary"}
          onClick={() => setChartType("pie")}
        >
          Διάγραμμα Πίτας
        </Button>
      </div>

      {/* Highcharts Visualization */}
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </Container>
  );
};

export default UsersDashboard;
