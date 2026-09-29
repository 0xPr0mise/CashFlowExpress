import { useState, useEffect } from "react";
import { getLoans, createLoan, deleteLoan } from "../../services/loans.service";
import { getClients } from "../../services/client.service";
import { getSettings } from "../../services/settings.service";
import LoanForm from "./components/LoanForm";
import LoansTable from "./components/LoansTable";

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [defaultInterest, setDefaultInterest] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [loading, setLoading] = useState(false);
  
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [loansData, clientsData, settingsData] = await Promise.all([
        getLoans(),
        getClients(),
        getSettings().catch(() => null),
      ]);

      if (Array.isArray(loansData)) {
        // Normalizamos los datos por si el backend usa snake_case o camelCase
        const normalizedLoans = loansData.map((loan) => ({
          ...loan,
          dueDate: loan.dueDate || loan.due_date,
          totalToPay: loan.totalToPay || loan.total_to_pay || loan.amount,
          pendingAmount: loan.pendingAmount !== undefined ? loan.pendingAmount : (loan.pending_amount !== undefined ? loan.pending_amount : 0),
          schedule: loan.schedule || loan.installmentsList || loan.installments_list || [],
        }));
        setLoans(normalizedLoans);
      }

      if (Array.isArray(clientsData)) setClients(clientsData);

      if (settingsData) {
        const settingsArray = Array.isArray(settingsData) ? settingsData : [settingsData];
        const interestSetting = settingsArray.find(
          (s) => s.key === "interestRate" || s.key === "tasa_interes" || s.key === "defaultInterestRate"
        );
        if (interestSetting && interestSetting.value !== undefined) {
          setDefaultInterest(Number(interestSetting.value));
        }
      }
    } catch (error) {
      console.error("Error al cargar datos de préstamos, clientes o configuraciones:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLoan = async (loanData) => {
    setLoading(true);
    try {
      await createLoan(loanData);
      await loadData();
    } catch (error) {
      console.error("Error al crear préstamo:", error);
      alert("Error al registrar el préstamo en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (confirm("¿Estás seguro de eliminar este préstamo?")) {
      try {
        await deleteLoan(id);
        await loadData();
      } catch (error) {
        console.error("Error al eliminar préstamo:", error);
        alert("Error al eliminar el préstamo");
      }
    }
  };

  const totalLoanedAmount = loans.reduce(
    (acc, curr) => acc + (curr.amount || 0),
    0,
  );

  const activeLoansCount = loans.filter(
    (l) => l.status === "ACTIVO" || !l.status,
  ).length;

  const totalPortfolioValue = loans.reduce(
    (acc, curr) => acc + (curr.totalToPay || curr.amount || 0),
    0,
  );

  const filteredLoans = loans.filter((loan) => {
    const matchesStatus =
      filterStatus === "TODOS" || loan.status === filterStatus;

    const clientName = loan.client?.name || loan.clientName || "";
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.id && String(loan.id).includes(searchTerm));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="border-b border-neutral-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
              Gestión de Préstamos & Cartera Crediticia
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Control de emisiones, plazos, tasas de interés y seguimiento de cobros.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-xs text-neutral-400 hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Módulo Activo
            </div>
            
            <button
              onClick={() => setIsLoanModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Otorgar Préstamo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-red-600 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Capital Colocado Total
            </h3>
            <p className="text-3xl font-black text-white tracking-tight">
              ${totalLoanedAmount.toFixed(2)}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
              Suma base prestada
            </span>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-emerald-500 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Créditos Activos / Vigentes
            </h3>
            <p className="text-3xl font-black text-emerald-400 tracking-tight">
              {activeLoansCount}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
              De {loans.length} créditos totales
            </span>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-neutral-500 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Cartera Total Proyectada
            </h3>
            <p className="text-3xl font-black text-neutral-200 tracking-tight">
              ${totalPortfolioValue.toFixed(2)}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
              Capital + intereses globales
            </span>
          </div>
        </div>

        <LoanForm
          isOpen={isLoanModalOpen}
          onClose={() => setIsLoanModalOpen(false)}
          clients={clients}
          onLoanCreated={handleCreateLoan}
          defaultInterestRate={defaultInterest}
          loading={loading}
        />

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-bold text-white">
              Préstamos Registrados
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-neutral-900/80 p-1 border border-neutral-800 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setFilterStatus("TODOS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === "TODOS"
                      ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus("ACTIVO")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === "ACTIVO"
                      ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setFilterStatus("PAGADO")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === "PAGADO"
                      ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Pagados
                </button>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
            <LoansTable
              loans={filteredLoans}
              onLoanUpdated={loadData}
              onDeleteLoan={handleDeleteLoan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}