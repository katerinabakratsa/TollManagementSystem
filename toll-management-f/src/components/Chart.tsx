import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Button, Container, Row, Col } from "react-bootstrap";
import api from "../api/api";

const Chart: React.FC = () => {
    const [chartType, setChartType] = useState<"bar" | "pie">("bar");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [chartData, setChartData] = useState<{ name: string; y: number }[]>([]);

    useEffect(() => {
        fetchChartData();
    }, [startDate, endDate]);

    const fetchChartData = async () => {
        try {
            const response = await api.get(`/passes?start=${startDate}&end=${endDate}`);
            const processedData = response.data.map((item: any) => ({
                name: item.stationName,
                y: item.passCount,
            }));
            setChartData(processedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const chartOptions = {
        chart: { type: chartType },
        title: { text: "Συνολικές Διελεύσεις" },
        xAxis: { categories: chartData.map((d) => d.name) },
        series: [{ name: "Διελεύσεις", data: chartData }],
    };

    return (
        <Container className="mt-4 text-center">
            <h2>Ανάλυση Δεδομένων</h2>
            <Row className="mb-3">
                <Col>
                    <label>Ημερομηνία Έναρξης:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Col>
                <Col>
                    <label>Ημερομηνία Λήξης:</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Col>
            </Row>
            <Row className="mb-3">
                <Col>
                    <Button variant="primary" onClick={() => setChartType("bar")}>Διάγραμμα Στηλών</Button>
                    <Button variant="secondary" className="ms-2" onClick={() => setChartType("pie")}>Διάγραμμα Πίτας</Button>
                </Col>
            </Row>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </Container>
    );
};

export default Chart;
