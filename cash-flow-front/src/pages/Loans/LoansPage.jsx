import { useState, useEffect, useMemo } from "react";
import { getLoans, createLoan, deleteLoan, updateLoan } from "../../services/loans.service";
import { getClients } from "../../services/client.service";
import { getSettings } from "../../services/settings.service";
import LoanForm from "./components/LoanForm";
import LoansTable from "./components/LoansTable";
import UpcomingExpirationsModal from "../../components/loans/UpcomingExpirationsModal";

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [defaultInterest, setDefaultInterest] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [filterStatus, setFilterStatus] = useState("ACTIVO");
  const [loading, setLoading] = useState(false);
  
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isExpirationsModalOpen, setIsExpirationsModalOpen] = useState(false);
  const [refinanceInitialData, setRefinanceInitialData] = useState(null);

  // Estado para capturar y mantener el ID del préstamo anterior al refinanciar
  const [currentOldLoanId, setCurrentOldLoanId] = useState(null);

  // Función auxiliar de formateo de dinero (enteros con puntos en millares, sin decimales)
  const formatMoney = (amount) => {
    const rounded = Math.round(amount || 0);
    return rounded.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const loadData = async () => {
    try {
      const [loansData, clientsData, settingsData] = await Promise.all([
        getLoans(),
        getClients(),
        getSettings().catch(() => null),
      ]);

      if (Array.isArray(loansData)) {
        const normalizedLoans = loansData.map((loan) => ({
          ...loan,
          dueDate: loan.dueDate || loan.due_date,
          totalToPay: loan.status === "REFINANCIADO" ? 0 : (loan.totalToPay || loan.total_to_pay || loan.amount),
          pendingAmount: loan.status === "REFINANCIADO" || loan.status === "PAGADO" ? 0 : (loan.pendingAmount !== undefined ? loan.pendingAmount : (loan.pending_amount !== undefined ? loan.pending_amount : 0)),
          schedule: loan.status === "REFINANCIADO" ? [] : (loan.schedule || loan.installmentsList || loan.installments_list || []),
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
      console.error("Error al cargar datos:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLoan = async (loanData) => {
    setLoading(true);
    try {
      const cleanLoanData = {
        clientId: loanData.clientId,
        amount: Number(loanData.amount),
        installments: parseInt(loanData.installments, 10),
        frequency: loanData.frequency,
        interestRate: Number(loanData.interestRate),
        dueDate: loanData.dueDate,
        totalToPay: Number(loanData.totalToPay),
        days: Number(loanData.days),
        schedule: loanData.schedule,
        paymentMethod: loanData.paymentMethod,
        
        // Banderas inyectadas para evitar que se genere egreso en caja si es refinanciación
        isRefinancing: Boolean(currentOldLoanId || loanData.oldLoanId),
        oldLoanId: currentOldLoanId || loanData.oldLoanId || null,
      };

      await createLoan(cleanLoanData);
      
      // Limpieza de estados de refinanciación
      setRefinanceInitialData(null); 
      setCurrentOldLoanId(null);
      setIsLoanModalOpen(false);
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

  const handleRefinanceLoan = async (refinancePayload) => {
    try {
      setLoading(true);
      const oldLoanId = refinancePayload.oldLoanId;

      // Guardamos el ID en el estado para enviarlo al crear el nuevo préstamo
      setCurrentOldLoanId(oldLoanId);

      // (Opcional) Si quieres actualizar el estado del viejo de inmediato en la API o dejar que el backend lo haga al crear el nuevo:
      if (oldLoanId) {
        await updateLoan(oldLoanId, {
          status: "REFINANCIADO",
          totalToPay: 0,
          schedule: [],
        });
      }

      setRefinanceInitialData({
        clientId: refinancePayload.clientId,
        amount: String(refinancePayload.amount),
        interestRate: refinancePayload.interestRate ? String(refinancePayload.interestRate) : String(defaultInterest),
        oldLoanId: oldLoanId,
      });

      setIsLoanModalOpen(true);
      await loadData();
    } catch (error) {
      console.error("Error al procesar la refinanciación:", error);
      alert("No se pudo completar la refinanciación en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const urgentCount = useMemo(() => {
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    loans.forEach((loan) => {
      if (loan.status === "REFINANCIADO" || loan.status === "PAGADO") return;
      let schedule = [];
      try {
        schedule = typeof loan.schedule === "string" ? JSON.parse(loan.schedule) : (loan.schedule || []);
      } catch (e) {
        schedule = [];
      }

      schedule.forEach((inst) => {
        if (inst.status !== "PAGADO" && inst.dueDate) {
          const cleanDate = inst.dueDate.split("T")[0];
          const [year, month, day] = cleanDate.split("-");
          const dueDate = new Date(year, month - 1, day);
          const diffTime = dueDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysLeft <= 2) {
            count++;
          }
        }
      });
    });
    return count;
  }, [loans]);

  const totalLoanedAmount = loans.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const activeLoansCount = loans.filter((l) => l.status === "ACTIVO" || !l.status).length;
  const totalPortfolioValue = loans.reduce((acc, curr) => acc + (curr.status === "REFINANCIADO" ? 0 : (curr.totalToPay || curr.amount || 0)), 0);

  const filteredLoans = loans.filter((loan) => {
    const clientName = loan.client?.name || loan.clientName || "";
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.id && String(loan.id).includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterStatus === "TODOS") return true;
    if (filterStatus === "ACTIVO") return loan.status === "ACTIVO" || !loan.status;
    if (filterStatus === "PAGADO") return loan.status === "PAGADO";
    
    if (filterStatus === "PROXIMO_VENCER") {
      if (loan.status === "PAGADO" || loan.status === "REFINANCIADO") return false;
      let schedule = [];
      try {
        schedule = typeof loan.schedule === "string" ? JSON.parse(loan.schedule) : (loan.schedule || []);
      } catch (e) {
        schedule = [];
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const todayObj = new Date(todayStr);

      const hasUpcoming = schedule.some((inst) => {
        if (inst.status === "PAGADO" || !inst.dueDate) return false;
        const rawDate = inst.dueDate.split("T")[0];
        const dueDateObj = new Date(rawDate);
        const diffDays = Math.ceil((dueDateObj - todayObj) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });

      return hasUpcoming;
    }

    return true;
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExpirationsModalOpen(true)}
                className="relative p-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-300 hover:text-white transition-colors cursor-pointer shadow-lg flex items-center justify-center"
                title="Ver panel de vencimientos urgentes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>

                {urgentCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {urgentCount}
                  </span>
                )}
              </button>
            </div>
            
            <button
              onClick={() => {
                setRefinanceInitialData(null);
                setCurrentOldLoanId(null);
                setIsLoanModalOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Otorgar Préstamo
            </button>
          </div>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-red-600 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Capital Colocado Total
            </h3>
            <p className="text-3xl font-black text-white tracking-tight">
              ${formatMoney(totalLoanedAmount)}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-emerald-500 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Créditos Activos / Vigentes
            </h3>
            <p className="text-3xl font-black text-emerald-400 tracking-tight">
              {activeLoansCount}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-neutral-500 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Cartera Total Proyectada
            </h3>
            <p className="text-3xl font-black text-neutral-200 tracking-tight">
              ${formatMoney(totalPortfolioValue)}
            </p>
          </div>
        </div>

        <LoanForm
          isOpen={isLoanModalOpen}
          onClose={() => {
            setIsLoanModalOpen(false);
            setRefinanceInitialData(null);
            setCurrentOldLoanId(null);
          }}
          clients={clients}
          onLoanCreated={handleCreateLoan}
          defaultInterestRate={defaultInterest}
          loading={loading}
          initialData={refinanceInitialData}
        />

        <UpcomingExpirationsModal
          isOpen={isExpirationsModalOpen}
          onClose={() => setIsExpirationsModalOpen(false)}
          loans={loans}
        />

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-bold text-white">
              Préstamos Registrados
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="w-full sm:w-56">
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
                  onClick={() => setFilterStatus("ACTIVO")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterStatus === "ACTIVO"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setFilterStatus("PROXIMO_VENCER")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterStatus === "PROXIMO_VENCER"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-950/50"
                      : "text-amber-400 hover:text-white"
                  }`}
                  title="Filtrar préstamos próximos a vencer o vencidos"
                >
                  🔔 Próximos
                </button>
                <button
                  onClick={() => setFilterStatus("TODOS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterStatus === "TODOS"
                      ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus("PAGADO")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              onRefinanceLoan={handleRefinanceLoan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}