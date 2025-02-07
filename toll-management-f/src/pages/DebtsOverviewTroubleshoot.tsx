// src/pages/DebtsOverviewTroubleshoot.tsx
import React, { useEffect, useState } from "react";
import { Table, Button } from "react-bootstrap";
import api from "../api/api"; // Axios instance configured in api.ts

// Interface for each company's detail in the response
interface CompanyDetail {
  visitingOpID: string;
  nPasses: number;
  passesCost: number;
}

// Interface for the full response from the charges endpoint
interface ChargesResponse {
  tollOpID: string;
  requestTimestamp: string;
  periodFrom: string;
  periodTo: string;
  vOpList: CompanyDetail[];
}

const DebtsOverviewTroubleshoot: React.FC = () => {
  // State to store the charges response
  const [data, setData] = useState<ChargesResponse | null>(null);
  // Loading and error state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // For troubleshooting, we fix the date to "20220101"
  const fixedDate = "20220101";
  // Fixed toll operator ID (in production, this may come from authentication)
  const tollOpID = "NAO";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Call the charges endpoint for the fixed date
        const response = await api.get<ChargesResponse>(
          `/chargesBy/tollOpID/${tollOpID}/date_from/${fixedDate}/date_to/${fixedDate}`
        );
        setData(response.data);
      } catch (err: any) {
        console.error("Error fetching charges data:", err);
        setError("Failed to fetch charges data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tollOpID, fixedDate]);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;
  if (!data) return <div className="container mt-5">No data available.</div>;

  // Handler for the Pay button (placeholder)
  const handlePayment = (company: string) => {
    alert(`Payment initiated for ${company}`);
  };

  return (
    <div className="container mt-5">
      <h1>Debts Overview for {fixedDate}</h1>
      <p>
        Toll Operator ID: {data.tollOpID} <br />
        Request Timestamp: {data.requestTimestamp} <br />
        Period: {data.periodFrom} to {data.periodTo}
      </p>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Company</th>
            <th>Number of Passes</th>
            <th>Total Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.vOpList.map((detail, index) => (
            <tr key={index}>
              <td>{detail.visitingOpID}</td>
              <td>{detail.nPasses}</td>
              <td>${detail.passesCost.toFixed(2)}</td>
              <td>
                <Button
                  variant="success"
                  onClick={() => handlePayment(detail.visitingOpID)}
                >
                  Pay
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DebtsOverviewTroubleshoot;
