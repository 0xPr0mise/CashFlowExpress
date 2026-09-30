import { useState, useEffect } from "react";
import {
  getCashMovements,
  getCashBalance,
  createCashMovement,
} from "../../services/cash.service";
import CashForm from "../../components/Cash/CashForm";
import CashTable from "../../components/Cash/CashTable";
import CashMetrics from "../../components/Cash/CashMetrics"; // <--- Importamos las métricas por canales

export default function CashPage() {
  const [movements, setMovements] = useState([]);
  const [balances, setBalances] = useState({}); // <--- Cambiado a objeto para recibir los canales
  const [totalMovements, setTotalMovements] = useState(0);

  const [form, setForm] = useState({
    type: "INGRESO",
    category: "INGRESO_EXTRA",
    paymentMethod: "EFECTIVO", // <--- Incluimos canal por defecto
    amount: "",
    description: "",
  });

  const [filter, setFilter] = useState("TODOS");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCashData = async () => {
    try {
      const [movsData, balData] = await Promise.all([
        getCashMovements(),
        getCashBalance(),
      ]);
      setMovements(Array.isArray(movsData) ? movsData : []);
      setBalances(balData || {});
      setTotalMovements(Array.isArray(movsData) ? movsData.length : 0);
    } catch (error) {
      console.error("Error al cargar datos de caja:", error);
    }
  };

  useEffect(() => {
    loadCashData();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadCashData();
    setRefreshing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Limpiamos los separadores de miles para enviar un valor entero absoluto puro a la DB
      const cleanAmount = parseInt(form.amount.toString().replace(/\./g, ""), 10) || 0;

      await createCashMovement({
        ...form,
        amount: cleanAmount,
        paymentMethod: form.paymentMethod || "EFECTIVO",
      });

      setForm({
        type: "INGRESO",
        category: "INGRESO_EXTRA",
        paymentMethod: "EFECTIVO",
        amount: "",
        description: "",
      });
      await loadCashData();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      alert("Error al registrar el movimiento en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 md:p-6 flex flex-col font-sans">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1 flex flex-col">
        
        {/* Panel Superior Único e Integrado */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 md:p-5 rounded-2xl backdrop-blur-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 flex-shrink-0 shadow-xl">
          
          {/* Bloque Izquierdo: Título y Descripción */}
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
              Gestión de Caja y Canales
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Control en tiempo real de efectivo, transferencias y transacciones.
            </p>
          </div>
          
          {/* Bloque Derecho: Acciones y Estado */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-neutral-700/50"
            >
              <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {refreshing ? "Sincronizando..." : "Sincronizar"}
            </button>

            {/* Modal de Registro Operativo */}
            <CashForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={loading} />

            <div className="bg-black/60 border border-neutral-800 px-3 py-2.5 rounded-xl text-xs text-neutral-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Activa
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas / Balances Consolidado y por Canal */}
        <CashMetrics balances={balances} totalMovements={totalMovements} />

        {/* Tabla Ocupando Todo el Resto de la Pantalla Libre */}
        <div className="flex-1 flex flex-col pt-1">
          <CashTable movements={movements} filter={filter} setFilter={setFilter} />
        </div>

      </div>
    </div>
  );
}