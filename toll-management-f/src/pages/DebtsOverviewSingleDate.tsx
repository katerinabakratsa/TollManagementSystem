// src/pages/DebtsOverviewSingleDate.tsx
import React, { useEffect, useState } from "react";
import { Table, Button } from "react-bootstrap";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

// Interface for the response from the charges endpoint
interface ChargesResponse {
  tollOpID: string;
  requestTimestamp: string;
  periodFrom: string;
  periodTo: string;
  vOpList: Array<{
    visitingOpID: string;
    nPasses: number;
    passesCost: number;
  }>;
}

// Interface for the daily summary we compute
interface DailySummary {
  date: string;
  totalPasses: number;
  totalCost: number;
}

const DebtsOverviewSingleDate: React.FC = () => {
  // State to hold the computed daily summary
  const [summary, setSummary] = useState<DailySummary | null>(null);
  // State to manage loading and error messages
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  // Hook to navigate to the detail page
  const navigate = useNavigate();

  // For troubleshooting, we fix the date to "20220101" and toll operator ID to "NAO"
  const fixedDate = "20220101";
  const tollOpID = "NAO";

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Call the charges endpoint for the fixed date
        const response = await api.get<ChargesResponse>(
          `/chargesBy/tollOpID/${tollOpID}/date_from/${fixedDate}/date_to/${fixedDate}`
        );
        const data = response.data;

        // Compute total passes and total cost from the vOpList array
        let totalPasses = 0;
        let totalCost = 0;
        if (data.vOpList && Array.isArray(data.vOpList)) {
          data.vOpList.forEach((item) => {
            totalPasses += item.nPasses;
            totalCost += item.passesCost;
          });
        }
        setSummary({ date: fixedDate, totalPasses, totalCost });
      } catch (err: any) {
        console.error("Error fetching daily summary", err);
        setError("Failed to fetch daily summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [tollOpID, fixedDate]);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;
  if (!summary)
    return <div className="container mt-5">No summary available.</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Debts Overview for {fixedDate}</h1>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Date</th>
            <th>Total Passes</th>
            <th>Total Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{summary.date}</td>
            <td>{summary.totalPasses}</td>
            <td>${summary.totalCost.toFixed(2)}</td>
            <td>
              {/* Navigates to a detailed view for this date */}
              <Button
                variant="primary"
                onClick={() => navigate(`/debts/${summary.date}`)}
              >
                View Details
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default DebtsOverviewSingleDate;
