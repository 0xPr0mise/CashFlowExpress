import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { getLoans, createLoan, deleteLoan, updateLoan } from "../../services/loans.service";
import { getClients } from "../../services/client.service";
import { getSettings } from "../../services/settings.service";
import LoanForm from "./components/LoanForm";
import LoansTable from "./components/LoansTable";
import UpcomingExpirationsModal from "../../components/loans/UpcomingExpirationsModal";
import LoanSuccessModal from "./components/LoanSuccessModal";
import LoanDetailModal from "../../components/loans/LoanDetailModal";

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [defaultInterest, setDefaultInterest] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [filterStatus, setFilterStatus] = useState("ACTIVO");
  const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isExpirationsModalOpen, setIsExpirationsModalOpen] = useState(false);
  
  const [successLoanData, setSuccessLoanData] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [refinanceInitialData, setRefinanceInitialData] = useState(null);
  const [currentOldLoanId, setCurrentOldLoanId] = useState(null);

  // Estado para controlar el préstamo seleccionado para el historial / detalle
  const [selectedLoanForHistory, setSelectedLoanForHistory] = useState(null);

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
        const normalizedLoans = loansData.map((loan) => {
          const totalToPay = loan.status === "REFINANCIADO" 
            ? 0 
            : (Number(loan.totalToPay || loan.total_to_pay || loan.amount) || 0);

          const totalPaidSoFar = Array.isArray(loan.payments)
            ? loan.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
            : 0;

          const calculatedPending = loan.status === "REFINANCIADO" || loan.status === "PAGADO" || loan.status === "INCOBRABLE"
            ? 0 
            : Math.max(0, totalToPay - totalPaidSoFar);

          return {
            ...loan,
            dueDate: loan.dueDate || loan.due_date,
            totalToPay,
            pendingAmount: calculatedPending,
            schedule: (loan.status === "REFINANCIADO" || loan.status === "INCOBRABLE") ? [] : (loan.schedule || loan.installmentsList || loan.installments_list || []),
          };
        });
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
        isRefinancing: Boolean(currentOldLoanId || loanData.oldLoanId),
        oldLoanId: currentOldLoanId || loanData.oldLoanId || null,
      };

      const newCreatedLoan = await createLoan(cleanLoanData);

      setIsLoanModalOpen(false);
      setRefinanceInitialData(null); 
      setCurrentOldLoanId(null);

      await loadData();

      setSuccessLoanData(newCreatedLoan);
      setIsSuccessModalOpen(true);

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
      setCurrentOldLoanId(oldLoanId);

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

  const hasUpcomingExpirations = (loan) => {
    if (loan.status === "REFINANCIADO" || loan.status === "PAGADO" || loan.status === "INCOBRABLE") return false;
    let schedule = [];
    try {
      schedule = typeof loan.schedule === "string" ? JSON.parse(loan.schedule) : (loan.schedule || []);
    } catch (e) {
      schedule = [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedule.some((inst) => {
      if (inst.status !== "PAGADO" && inst.dueDate) {
        const cleanDate = inst.dueDate.split("T")[0];
        const [year, month, day] = cleanDate.split("-");
        const dueDate = new Date(year, month - 1, day);
        const diffTime = dueDate - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return daysLeft <= 7;
      }
      return false;
    });
  };

  const urgentCount = useMemo(() => {
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    loans.forEach((loan) => {
      if (loan.status === "REFINANCIADO" || loan.status === "PAGADO" || loan.status === "INCOBRABLE") return;
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

          if (daysLeft <= 7) {
            count++;
          }
        }
      });
    });
    return count;
  }, [loans]);

  // --- CÁLCULOS DE KPIS ---
  const activeLoansCount = loans.filter((l) => l.status === "ACTIVO" || !l.status).length;
  const totalLoanedAmount = loans.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  const totalPendingAmount = loans.reduce((acc, curr) => {
    if (curr.status === "REFINANCIADO" || curr.status === "PAGADO" || curr.status === "INCOBRABLE") return acc;
    return acc + (curr.pendingAmount || 0);
  }, 0);

  const totalOverdueCapital = useMemo(() => {
    let overdueSum = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    loans.forEach((loan) => {
      if (loan.status === "REFINANCIADO" || loan.status === "PAGADO" || loan.status === "INCOBRABLE") return;
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
          
          if (dueDate < today) {
            overdueSum += (inst.amount || inst.pendingAmount || 0);
          }
        }
      });
    });

    return overdueSum;
  }, [loans]);

  const filteredLoans = loans.filter((loan) => {
    const clientName = loan.client?.name || loan.clientName || "";
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loan.id && String(loan.id).includes(searchTerm));

    if (!matchesSearch) return false;

    if (showOnlyUpcoming) {
      return hasUpcomingExpirations(loan);
    }

    const loanStatus = (loan.status || "ACTIVO").toUpperCase();
    if (filterStatus === "TODOS") return true;
    if (filterStatus === "ACTIVO") return loanStatus === "ACTIVO";
    if (filterStatus === "REFINANCIADO") return loanStatus === "REFINANCIADO";
    if (filterStatus === "PAGADO") return loanStatus === "PAGADO";

    return true;
  });

  const handleExportExcel = () => {
    if (filteredLoans.length === 0) {
      alert("No hay datos para exportar con los filtros actuales.");
      return;
    }

    const dataToExport = filteredLoans.map((loan) => ({
      "ID Préstamo": loan.id || "",
      "Cliente": loan.client?.name || loan.clientName || "Sin cliente",
      "Capital Prestado": loan.amount || 0,
      "Total a Pagar": loan.totalToPay || loan.amount || 0,
      "Saldo Pendiente": loan.pendingAmount || 0,
      "Estado": loan.status || "ACTIVO",
      "Fecha de Emisión": loan.createdAt ? loan.createdAt.split("T")[0] : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Préstamos");

    const filterLabel = showOnlyUpcoming ? "Proximos_Vencimientos" : filterStatus;
    const fileName = `Prestamos_${filterLabel}_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const getSelectStyle = (status) => {
    if (showOnlyUpcoming) return "border-neutral-700 text-neutral-500 bg-neutral-900 opacity-50 cursor-not-allowed";
    switch (status) {
      case "ACTIVO":
        return "border-amber-500/50 text-amber-400 bg-amber-950/20 focus:border-amber-500";
      case "REFINANCIADO":
        return "border-purple-500/50 text-purple-400 bg-purple-950/20 focus:border-purple-500";
      case "PAGADO":
        return "border-emerald-500/50 text-emerald-400 bg-emerald-950/20 focus:border-emerald-500";
      default:
        return "border-neutral-700 text-white bg-neutral-900 focus:border-neutral-500";
    }
  };

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

        {/* --- TARJETAS DE RESUMEN (KPIs) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="p-5 rounded-2xl border border-neutral-800 border-l-4 border-l-amber-500 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Créditos Activos / Vigentes
            </h3>
            <p className="text-2xl font-black text-amber-400 tracking-tight">
              {activeLoansCount}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 border-l-4 border-l-purple-500 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Capital Colocado Total
            </h3>
            <p className="text-2xl font-black text-purple-400 tracking-tight">
              ${formatMoney(totalLoanedAmount)}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 border-l-4 border-l-blue-500 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Saldo Pendiente Total
            </h3>
            <p className="text-2xl font-black text-blue-400 tracking-tight">
              ${formatMoney(totalPendingAmount)}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 border-l-4 border-l-rose-600 bg-neutral-900/60 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Capital Vencido
            </h3>
            <p className="text-2xl font-black text-rose-500 tracking-tight">
              ${formatMoney(totalOverdueCapital)}
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
          loans={loans} // 👈 Pasamos la lista de préstamos para que el formulario valide antecedentes incobrables
          onLoanCreated={handleCreateLoan}
          defaultInterestRate={defaultInterest}
          loading={loading}
          initialData={refinanceInitialData}
        />

        <LoanSuccessModal
          isOpen={isSuccessModalOpen}
          successLoanData={successLoanData}
          onClose={() => setIsSuccessModalOpen(false)}
        />

        <UpcomingExpirationsModal
          isOpen={isExpirationsModalOpen}
          onClose={() => setIsExpirationsModalOpen(false)}
          loans={loans}
        />

        {/* Modal de Historial / Detalle */}
        {selectedLoanForHistory && (
          <LoanDetailModal
            isOpen={!!selectedLoanForHistory}
            loan={selectedLoanForHistory}
            onClose={() => setSelectedLoanForHistory(null)}
          />
        )}

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800/80 backdrop-blur-sm">
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  Préstamos Registrados
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {filteredLoans.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowOnlyUpcoming(!showOnlyUpcoming)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer border ${
                  showOnlyUpcoming
                    ? "bg-rose-600 text-white border-rose-500 shadow-rose-950/50"
                    : "bg-neutral-900 hover:bg-neutral-800 text-rose-400 border-neutral-700 hover:border-neutral-600"
                }`}
                title="Filtrar préstamos con vencimientos en los próximos 7 días"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Próx. Vencimientos (7 días)</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/50 hover:border-emerald-500"
                title="Descargar vista actual en formato XLSX"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>Exportar Excel</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="w-full sm:w-48 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-500 shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterStatus}
                  disabled={showOnlyUpcoming}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full sm:w-auto border text-xs rounded-xl px-3.5 py-2 outline-none transition-all cursor-pointer font-bold shadow-md ${getSelectStyle(filterStatus)}`}
                >
                  <option value="ACTIVO" className="bg-neutral-900 text-amber-400">🟡 Activos</option>
                  <option value="REFINANCIADO" className="bg-neutral-900 text-purple-400">🟣 Refinanciados</option>
                  <option value="PAGADO" className="bg-neutral-900 text-emerald-400">🟢 Pagados</option>
                  <option value="TODOS" className="bg-neutral-900 text-white">⚪ Todos</option>
                </select>
              </div>

            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
            <LoansTable
              loans={filteredLoans}
              onLoanUpdated={loadData}
              onDeleteLoan={handleDeleteLoan}
              onRefinanceLoan={handleRefinanceLoan}
              onSelectLoanForHistory={(loan) => setSelectedLoanForHistory(loan)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}