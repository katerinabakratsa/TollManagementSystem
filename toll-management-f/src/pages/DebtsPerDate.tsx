// // src/pages/DebtsPerDate.tsx
// import React, { useEffect, useState } from "react";
// import { Table, Button } from "react-bootstrap";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../api/api";

// // Interface for each company debt summary on a specific date
// interface CompanyDebtSummary {
//   visitingOpID: string;
//   nPasses: number;
//   passesCost: number;
// }

// const DebtsPerDate: React.FC = () => {
//   const { date } = useParams<{ date?: string }>(); // Ensure date is optional
//   const [companyDebts, setCompanyDebts] = useState<CompanyDebtSummary[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");
//   const navigate = useNavigate();

//   const tollOpID = "NAO"; // Example toll operator ID

//   useEffect(() => {
//     const fetchCompanyDebts = async () => {
//       try {
//         if (!date) {
//           setError("Date parameter is missing.");
//           return;
//         }

//         const headers = new Headers();
//         headers.append(
//           "X-OBSERVATORY-AUTH",
//           localStorage.getItem("authToken") || ""
//         );
//         headers.append("Content-Type", "application/json");

//         const response = await fetch(
//           `https://localhost:9115/api/chargesBy/tollOpID/${tollOpID}/date_from/${date}/date_to/${date}`,
//           {
//             method: "GET",
//             headers: headers,
//             credentials: "include",
//           }
//         );

//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("📌 Backend Response:", data);

//         if (!data || !data.vOpList || !Array.isArray(data.vOpList)) {
//           throw new Error("Invalid data format received from the server.");
//         }

//         setCompanyDebts(data.vOpList);
//       } catch (err: any) {
//         console.error("Error fetching company debts", err);
//         setError("Failed to fetch company debts for the selected date.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCompanyDebts();
//   }, [date, tollOpID]);

//   if (loading) return <div className="container mt-5">Loading...</div>;
//   if (error) return <div className="container mt-5 text-danger">{error}</div>;

//   return (
//     <div className="container mt-5">
//       <h1 className="mb-4">Debts on {date}</h1>
//       <Table striped bordered hover responsive>
//         <thead>
//           <tr>
//             <th>Company</th>
//             <th>Total Passes</th>
//             <th>Total Cost</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {companyDebts.map((debt, index) => (
//             <tr key={index}>
//               <td>{debt.visitingOpID}</td>
//               <td>{debt.nPasses}</td>
//               <td>${debt.passesCost.toFixed(2)}</td>
//               <td>
//                 <Button
//                   variant="primary"
//                   onClick={() =>
//                     navigate(
//                       `/debts/date/${date}/company/${encodeURIComponent(
//                         debt.visitingOpID
//                       )}`
//                     )
//                   }
//                 >
//                   View Debts
//                 </Button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </Table>
//     </div>
//   );
// };

// export default DebtsPerDate;
// src/pages/DebtsPerDate.tsx
import React, { useEffect, useState } from "react";
import { Table, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

// Interface for each company’s aggregated debt summary on a given date
interface CompanyDebtSummary {
  company: string; // the company’s name (as in p.tagHomeID)
  nPasses: number;
  passesCost: number;
}

const DebtsPerDate: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const [companyDebts, setCompanyDebts] = useState<CompanyDebtSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyDebts = async () => {
      try {
        if (!date) {
          setError("Date parameter is missing.");
          return;
        }
        // NEW: Call the new endpoint that aggregates data for ALL companies on that date.
        const tollOpID = "NAO"; // or fetch dynamically if needed
        const response = await api.get(
          `/chargesBy/${tollOpID}/${date}/${date}`
        );

        // Expecting the response to be an array of objects like:
        // [ { company: "CompanyA", nPasses: 10, passesCost: 100.0 }, {...}, ... ]
        setCompanyDebts(response.data);
      } catch (err: any) {
        console.error("Error fetching company debts", err);
        setError("Failed to fetch company debts for the selected date.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDebts();
  }, [date]);

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Debts for {date}</h1>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Company</th>
            <th>Total Passes</th>
            <th>Total Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companyDebts.map((debt, index) => (
            <tr key={index}>
              <td>{debt.company}</td>
              <td>{debt.nPasses}</td>
              <td>${debt.passesCost.toFixed(2)}</td>
              <td>
                {/* Navigate to the company-specific detailed screen */}
                <Button
                  variant="primary"
                  onClick={() =>
                    navigate(
                      `/debts/date/${date}/company/${encodeURIComponent(
                        debt.company
                      )}`
                    )
                  }
                >
                  View Debts
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default DebtsPerDate;
