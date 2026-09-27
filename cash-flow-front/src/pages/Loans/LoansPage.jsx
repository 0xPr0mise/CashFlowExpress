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
      const [loansData, clientsData] = await Promise.all([
        getLoans(),
        getClients(),
      ]);
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
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            Gestión de Préstamos
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Control de emisiones crediticias, plazos, montos y seguimiento de
            carteras.
          </p>
        </div>

        {/* Contenedor del Formulario */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <LoanForm clients={clients} onLoanCreated={handleCreateLoan} />
        </div>

        {/* Contenedor de la Tabla */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">
            Préstamos Registrados
          </h3>
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <LoansTable
              loans={loans}
              onLoanUpdated={loadData}
              onDeleteLoan={handleDeleteLoan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
