import { useState, useEffect } from "react";
import { getLoans, createLoan, deleteLoan } from "../../services/loans.service";
import { getClients } from "../../services/client.service";
import LoanForm from "./components/LoanForm";
import LoansTable from "./components/LoansTable";

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS"); // 'TODOS', 'ACTIVO', 'PAGADO', 'ATRASADO'
  const [loading, setLoading] = useState(false);

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

  // Cálculos de métricas (KPIs)
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

  // Filtrado de préstamos por estado y buscador
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
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
              Gestión de Préstamos & Cartera Crediticia
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Control de emisiones, plazos, tasas de interés y seguimiento de
              cobros.
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Módulo Activo
          </div>
        </div>

        {/* Tarjetas de Métricas (KPIs de Crédito) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Monto Total Colocado */}
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

          {/* Préstamos Activos */}
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

          {/* Cartera Total a Cobrar (Con intereses estimados) */}
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

        {/* Contenedor del Formulario de Préstamo */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <LoanForm
            clients={clients}
            onLoanCreated={handleCreateLoan}
            loading={loading}
          />
        </div>

        {/* Contenedor de la Tabla con Buscador y Filtros */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-bold text-white">
              Préstamos Registrados
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Buscador Rápido */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-500"
                />
              </div>

              {/* Filtros de Estado */}
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
