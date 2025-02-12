import React, { useContext, useEffect, useState } from "react";
import { Row, Col, Button, Container, Card, Form } from "react-bootstrap";
import { AppContext } from "../context/AppContext";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import api from "../api/api";
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
  const [operators, setOperators] = useState<string[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [chartType, setChartType] = useState<"column" | "pie">("column");
  const [startDate, setStartDate] = useState<Date | null>(new Date("2022-01-01"));
  const [endDate, setEndDate] = useState<Date | null>(new Date("2022-12-31"));
  const [filteredPasses, setFilteredPasses] = useState<number>(0);
  const [filteredStationsWithPasses, setFilteredStationsWithPasses] = useState<number>(0);
  const [filteredTotalStations, setFilteredTotalStations] = useState<number>(0);
  const [filteredChartData, setFilteredChartData] = useState<{ name: string; y: number }[]>([]);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("No authentication token found.");
          setLoading(false);
          return;
        }

        const headers = { headers: { "X-OBSERVATORY-AUTH": token } };
        const stationsResponse = await api.get("/admin/tollstations", headers);

        if (!stationsResponse.data || stationsResponse.data.length === 0) {
          setError("No toll stations found.");
          setLoading(false);
          return;
        }

        setTollStations(stationsResponse.data);

        const uniqueOperators = Array.from(new Set(stationsResponse.data.map((ts: TollStation) => ts.OpID)));
        setOperators(uniqueOperators);
        setSelectedOperator(uniqueOperators[0] || "");

        setLoading(false);
      } catch (err: any) {
        setError("Failed to fetch operators.");
        console.error("API error:", err);
        setLoading(false);
      }
    };

    fetchOperators();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        return;
      }

      const headers = { headers: { "X-OBSERVATORY-AUTH": token } };

      if (!selectedOperator) {
        setError("Please select an operator.");
        setLoading(false);
        return;
      }

      console.log("Fetching data for operator:", selectedOperator);

      const formattedStart = startDate ? startDate.toISOString().split("T")[0].replace(/-/g, "") : "20220101";
      const formattedEnd = endDate ? endDate.toISOString().split("T")[0].replace(/-/g, "") : "20221231";

      const passesResponse = await api.get(
        `/passAnalysis2/stationOpID/${selectedOperator}/tagOpID/${selectedOperator}/date_from/${formattedStart}/date_to/${formattedEnd}`,
        headers
      );

      const newPasses = passesResponse.data?.[0]?.passList || [];
      setPasses(newPasses);
      setFilteredPasses(newPasses.length);

      const passesPerToll: { [key: string]: number } = {};
      newPasses.forEach((pass) => {
        const stationID = pass.stationID;
        passesPerToll[stationID] = (passesPerToll[stationID] || 0) + 1;
      });

      const updatedChartData = Object.keys(passesPerToll).map(stationID => ({
        name: tollStations.find(ts => ts.TollID === stationID)?.Name || stationID,
        y: passesPerToll[stationID] || 0,
      }));

      setFilteredChartData(updatedChartData);
      setFilteredStationsWithPasses(updatedChartData.length);

      const stationsForSelectedOperator = tollStations.filter(ts => ts.OpID === selectedOperator);
      setFilteredTotalStations(stationsForSelectedOperator.length);

    } catch (err: any) {
      setError("Failed to fetch data.");
      console.error("API error:", err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  if (loading && initialLoad) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  const chartOptions = {
    chart: { type: chartType },
    title: { text: "" },
    xAxis: { categories: filteredChartData.map(data => data.name) },
    yAxis: { title: { text: "Crossings" } },
    series: [{ name: "Crossings", data: filteredChartData }],
  };

  return (
    <Container className="mt-5 text-center dashboard-container">
      <Row className="mt-4 justify-content-center">
        <Col md={4}>
          <h5>Choose Toll Operator</h5>
          <Form.Select value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
            {operators.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row className="mt-4 justify-content-between">
        <Col md={4}>
          <h5>Start Date</h5>
          <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="yyyy-MM-dd" />
        </Col>
        <Col md={4}>
          <h5>End Date</h5>
          <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="yyyy-MM-dd" />
        </Col>
      </Row>

      <Button variant="success" className="mt-3 apply-filters-button" onClick={fetchData}>
        Apply Filters
      </Button>

      <Row className="mt-4 justify-content-center">
        <Col md={4}>
          <Card className="dashboard-summary-card">
            <h5>Total Stations</h5>
            <h2>{filteredTotalStations}</h2> {/* Μόνο όταν πατιέται το κουμπί */}
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-summary-card">
            <h5>Stations with Crossings</h5>
            <h2>{filteredStationsWithPasses}</h2>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-summary-card">
            <h5>Total Crossings</h5>
            <h2>{filteredPasses}</h2>
          </Card>
        </Col>
      </Row>

      <div className="mt-4">
        <h5>Chart Type</h5>
        <Button variant={chartType === "column" ? "primary" : "outline-primary"} onClick={() => setChartType("column")} className="me-2">
          Column Chart
        </Button>
        <Button variant={chartType === "pie" ? "primary" : "outline-secondary"} onClick={() => setChartType("pie")}>
          Pie Chart
        </Button>
      </div>

      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </Container>
  );
};

export default Dashboard;