// // src/pages/CompanySpecificDebt.tsx
// import React, { useEffect, useState } from "react";
// import { Table, Button } from "react-bootstrap";
// import { useParams } from "react-router-dom";
// import api from "../api/api";

// // Interface for each debt detail
// interface DebtDetail {
//   otherCompany: string; // The company to which the selected company owes money
//   totalPasses: number;
//   totalCost: number;
// }

// const CompanySpecificDebt: React.FC = () => {
//   const { date, company } = useParams<{ date: string; company: string }>();
//   const [debtDetails, setDebtDetails] = useState<DebtDetail[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

//   useEffect(() => {
//     const fetchDebtDetails = async () => {
//       try {
//         if (!date || !company) {
//           setError("Missing date or company parameter.");
//           return;
//         }
//         // Assume an API endpoint that returns detailed debt data for a given date and company.
//         // Adjust the endpoint as necessary.
//         const response = await api.get(
//           `/admin/debts/date/${date}/company/${encodeURIComponent(
//             company
//           )}/details`
//         );
//         // The API should return an array of objects with keys: otherCompany, totalPasses, totalCost.
//         setDebtDetails(response.data);
//       } catch (err: any) {
//         console.error("Error fetching company-specific debts", err);
//         setError("Failed to fetch detailed debts for the selected company.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDebtDetails();
//   }, [date, company]);

//   // Placeholder payment function. In a real application, you might integrate a payment API.
//   const handlePayment = (otherCompany: string) => {
//     alert(`Payment initiated for debt owed to ${otherCompany}`);
//   };

//   if (loading) return <div className="container mt-5">Loading...</div>;
//   if (error) return <div className="container mt-5 text-danger">{error}</div>;

//   return (
//     <div className="container mt-5">
//       <h1 className="mb-4">
//         Debts for {company} on {date}
//       </h1>
//       <Table striped bordered hover responsive>
//         <thead>
//           <tr>
//             <th>Other Company</th>
//             <th>Total Passes</th>
//             <th>Total Cost</th>
//             <th>Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {debtDetails.map((debt, index) => (
//             <tr key={index}>
//               <td>{debt.otherCompany}</td>
//               <td>{debt.totalPasses}</td>
//               <td>${debt.totalCost.toFixed(2)}</td>
//               <td>
//                 <Button
//                   variant="success"
//                   onClick={() => handlePayment(debt.otherCompany)}
//                 >
//                   Pay Debt
//                 </Button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </Table>
//     </div>
//   );
// };

// export default CompanySpecificDebt;
// src/pages/CompanySpecificDebt.tsx
import React, { useEffect, useState } from "react";
import { Table, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import api from "../api/api";

// Interface for each detailed debt record
interface DebtDetail {
  otherCompany: string; // The company that the selected company owes money to
  nPasses: number;
  passesCost: number;
}

const CompanySpecificDebt: React.FC = () => {
  const { date, company } = useParams<{ date: string; company: string }>();
  const [debtDetails, setDebtDetails] = useState<DebtDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchDebtDetails = async () => {
      try {
        if (!date || !company) {
          setError("Missing date or company parameter.");
          return;
        }
        // NEW: Call the endpoint that returns detailed breakdown for the selected company
        const response = await api.get(
          `/api/admin/debts/date/${date}/company/${encodeURIComponent(
            company
          )}/details`
        );
        // Expecting an array of objects like:
        // [ { otherCompany: "CompanyB", nPasses: 5, passesCost: 50.0 }, {...}, ... ]
        setDebtDetails(response.data);
      } catch (err: any) {
        console.error("Error fetching company-specific debts", err);
        setError("Failed to fetch detailed debts for the selected company.");
      } finally {
        setLoading(false);
      }
    };

    fetchDebtDetails();
  }, [date, company]);

  // Placeholder function to handle payment action.
  const handlePayment = (otherCompany: string) => {
    alert(`Payment initiated for debt from ${company} to ${otherCompany}`);
    // In a real application, you would call a payment API and update the history.
  };

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1 className="mb-4">
        Detailed Debts for {company} on {date}
      </h1>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Company</th>
            <th>Total Passes</th>
            <th>Total Cost</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {debtDetails.map((detail, index) => (
            <tr key={index}>
              <td>{detail.otherCompany}</td>
              <td>{detail.nPasses}</td>
              <td>${detail.passesCost.toFixed(2)}</td>
              <td>
                <Button
                  variant="success"
                  onClick={() => handlePayment(detail.otherCompany)}
                >
                  Pay Debt
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default CompanySpecificDebt;
