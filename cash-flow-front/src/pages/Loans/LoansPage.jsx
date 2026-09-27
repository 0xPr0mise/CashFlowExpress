import { useState, useEffect } from "react";
import { getLoans, createLoan, deleteLoan } from "../../services/loans.service"; 
import { getClients } from "../../services/client.service";
import LoanForm from "./components/LoanForm";
import LoansTable from "./components/LoansTable";

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);

  const loadData = async () => {
    try {
      const [loansData, clientsData] = await Promise.all([getLoans(), getClients()]);
      if (Array.isArray(loansData)) setLoans(loansData);
      if (Array.isArray(clientsData)) setClients(clientsData);
    } catch (error) {
      console.error("Error al cargar datos de préstamos:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLoan = async (loanData) => {
    try {
      await createLoan(loanData);
      loadData();
    } catch (error) {
      console.error("Error al crear préstamo:", error);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (confirm("¿Estás seguro de eliminar este préstamo?")) {
      try {
        await deleteLoan(id);
        loadData();
      } catch (error) {
        console.error("Error al eliminar préstamo:", error);
      }
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "#2c3e50", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Gestión de Préstamos</h2>
      <LoanForm clients={clients} onLoanCreated={handleCreateLoan} />
      <LoansTable loans={loans} onDeleteLoan={handleDeleteLoan} />
    </div>
  );
}