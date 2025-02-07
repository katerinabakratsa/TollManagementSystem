// // src/pages/DebtsPage.tsx
// import React, { useEffect, useState } from "react";
// import DebtsTable from "../components/DebtsTable";
// import { Container } from "react-bootstrap";
// import api from "../api/api";

// interface Debt {
//   creditor: string;
//   amount: number;
//   status: string;
//   date: string;
// }

// const DebtsPage: React.FC = () => {
//   const [debts, setDebts] = useState<Debt[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

//   // Fetch debts from the backend
//   useEffect(() => {
//     const fetchDebts = async () => {
//       try {
//         const response = await api.get("/debts"); // Ensure this endpoint exists
//         setDebts(response.data);
//       } catch (err: any) {
//         setError("Failed to fetch debts.");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDebts();
//   }, []);

//   if (loading) return <div className="container mt-5">Loading...</div>;
//   if (error) return <div className="container mt-5 text-danger">{error}</div>;

//   return (
//     <div className="container mt-5">
//       <h1 className="mb-4">Debts</h1>
//       <DebtsTable debts={debts} />
//     </div>
//   );
// };

// export default DebtsPage;

// DebtsDetail.tsx
import React, { useEffect, useState } from "react";
import { Table, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import api from "../api/api";

// Define the interface for each company’s detail information
interface CompanyDetail {
  visitingOpID: string;
  nPasses: number;
  passesCost: number;
}

const DebtsDetail: React.FC = () => {
  // Extract the "date" parameter from the URL using useParams hook
  const { date } = useParams<{ date: string }>();

  // State to store the detailed company data for the selected day
  const [details, setDetails] = useState<CompanyDetail[]>([]);
  // State variables to manage loading and error messages
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Define the toll operator ID (this may be dynamic in a real-world scenario)
  const tollOpID = "NAO";

  // Fetch the detailed data for the selected day when the component mounts or when the date parameter changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (!date) {
        setError("Date parameter is missing.");
        setLoading(false);
        return;
      }

      try {
        // Make the API call using the provided date as both "from_date" and "to_date"
        const response = await api.get(
          `/chargesBy/tollOpID/${tollOpID}/date_from/${date}/date_to/${date}`
        );
        const data = response.data;

        // Check if the response includes a valid vOpList array
        if (data.vOpList && Array.isArray(data.vOpList)) {
          setDetails(data.vOpList);
        } else {
          setError("No data available for this date.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch detailed data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [date]);

  // Handler for the "Pay" button that currently shows a placeholder alert.
  const handlePayment = (company: string) => {
    alert(`Payment initiated for ${company}`);
  };

  // Render a loading message while data is being fetched.
  if (loading) return <div className="container mt-5">Loading...</div>;
  // Render any error message if present.
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Debts Detail for {date}</h1>
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
          {details.map((detail, index) => (
            <tr key={index}>
              <td>{detail.visitingOpID}</td>
              <td>{detail.nPasses}</td>
              <td>${detail.passesCost.toFixed(2)}</td>
              <td>
                {/* Clicking "Pay" calls the placeholder payment function */}
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

export default DebtsDetail;
