// src/pages/DebtsOverview.tsx
import React, { useEffect, useState } from "react";
import { Table, Button } from "react-bootstrap";
import api from "../api/api"; // Axios instance configured in api.ts
import { useNavigate } from "react-router-dom";

// Interface for each daily summary
interface DailySummary {
  date: string;
  totalPasses: number;
  totalCost: number;
}

// Interface for the available dates response from the backend
interface AvailableDates {
  first_date: string;
  last_date: string;
}

const DebtsOverview: React.FC = () => {
  // State to hold the daily summaries (one row per date)
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  // State to manage loading and error messages
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Hook to navigate to the detail page
  const navigate = useNavigate();

  // For demonstration purposes, we define a toll operator ID.
  // In a real application, you would get this from the authentication context.
  const tollOpID = "NAO";

  /**
   * Helper function to generate an array of date strings in 'YYYYMMDD'
   * format from a start date to an end date (inclusive).
   *
   * @param start - The starting date string in 'YYYYMMDD' format.
   * @param end - The ending date string in 'YYYYMMDD' format.
   * @returns An array of date strings.
   */
  const generateDateArray = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startYear = parseInt(start.substring(0, 4));
    const startMonth = parseInt(start.substring(4, 6)) - 1; // JavaScript months are 0-indexed
    const startDay = parseInt(start.substring(6, 8));

    const endYear = parseInt(end.substring(0, 4));
    const endMonth = parseInt(end.substring(4, 6)) - 1;
    const endDay = parseInt(end.substring(6, 8));

    let currentDate = new Date(startYear, startMonth, startDay);
    const endDate = new Date(endYear, endMonth, endDay);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
      const day = ("0" + currentDate.getDate()).slice(-2);
      dates.push(`${year}${month}${day}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  useEffect(() => {
    const fetchDatesAndSummaries = async () => {
      try {
        // First, fetch the available dates from the backend
        const datesResponse = await api.get("/availableDates");
        const availableDates: AvailableDates = datesResponse.data;
        const { first_date, last_date } = availableDates;

        // Generate an array of dates between the first and last available dates
        const datesArray = generateDateArray(first_date, last_date);

        // For each date, fetch the daily summary from the chargesBy endpoint.
        // We use Promise.all to run all requests concurrently.
        const summaryPromises = datesArray.map(async (date) => {
          const response = await api.get(
            `/chargesBy/tollOpID/${tollOpID}/date_from/${date}/date_to/${date}`
          );
          const data = response.data;

          // Compute the total passes and cost for the date by summing over the vOpList array
          let totalPasses = 0;
          let totalCost = 0;
          if (data.vOpList && Array.isArray(data.vOpList)) {
            data.vOpList.forEach(
              (item: { nPasses: number; passesCost: number }) => {
                totalPasses += item.nPasses;
                totalCost += item.passesCost;
              }
            );
          }
          return { date, totalPasses, totalCost };
        });

        // Wait for all the summary promises to resolve
        const summariesData = await Promise.all(summaryPromises);
        setSummaries(summariesData);
      } catch (err: any) {
        console.error("Error fetching available dates or daily summaries", err);
        setError("Failed to fetch available dates or daily summaries.");
      } finally {
        setLoading(false);
      }
    };

    fetchDatesAndSummaries();
  }, [tollOpID]);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Debts Overview</h1>
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
          {summaries.map((summary, index) => (
            <tr key={index}>
              <td>{summary.date}</td>
              <td>{summary.totalPasses}</td>
              <td>${summary.totalCost.toFixed(2)}</td>
              <td>
                {/* Navigates to the detail view for that specific date */}
                <Button
                  variant="primary"
                  onClick={() => navigate(`/debts/${summary.date}`)}
                >
                  View Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DebtsOverview;
