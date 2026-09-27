import { useState, useEffect } from "react";
import {
  getCashMovements,
  getCashBalance,
  createCashMovement,
} from "../../services/cash.service";

export default function CashPage() {
  const [movements, setMovements] = useState([]);
  const [balanceData, setBalanceData] = useState({
    balance: 0,
    totalMovements: 0,
  });

  const [form, setForm] = useState({
    type: "INGRESO",
    category: "COBRO_CUOTA",
    amount: "",
    description: "",
  });

  const [filter, setFilter] = useState("TODOS"); // 'TODOS', 'INGRESO', 'EGRESO'
  const [loading, setLoading] = useState(false);

  const loadCashData = async () => {
    try {
      const [movsData, balData] = await Promise.all([
        getCashMovements(),
        getCashBalance(),
      ]);
      setMovements(movsData);
      setBalanceData(balData);
    } catch (error) {
      console.error("Error al cargar datos de caja:", error);
    }
  };

  useEffect(() => {
    loadCashData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCashMovement({
        ...form,
        amount: parseFloat(form.amount),
      });
      setForm({
        type: "INGRESO",
        category: "COBRO_CUOTA",
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

  // Cálculos dinámicos basados en los movimientos cargados
  const totalIncomes = movements
    .filter((m) => m.type === "INGRESO")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = movements
    .filter((m) => m.type === "EGRESO")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Filtrado de movimientos para la tabla
  const filteredMovements = movements.filter((mov) => {
    if (filter === "TODOS") return true;
    return mov.type === filter;
  });

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
              Gestión de Caja y Flujo Financiero
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Control absoluto de entradas, salidas y liquidez disponible en
              tiempo real.
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Caja Activa
          </div>
        </div>

        {/* Tarjetas de Métricas de Caja (Grid Superior) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Balance Actual */}
          <div
            className={`p-6 rounded-2xl border backdrop-blur-sm transition-all bg-neutral-900/60 ${
              balanceData.balance >= 0
                ? "border-neutral-800 border-l-4 border-l-emerald-500"
                : "border-red-900/60 border-l-4 border-l-red-600"
            }`}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Balance Neto Disponible
            </h3>
            <p
              className={`text-4xl font-black tracking-tight ${balanceData.balance >= 0 ? "text-emerald-400" : "text-red-500"}`}
            >
              ${balanceData.balance.toFixed(2)}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
              {balanceData.totalMovements} transacciones totales
            </span>
          </div>

          {/* Ingresos Totales Históricos */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-red-600 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Ingresos Totales Acumulados
            </h3>
            <p className="text-3xl font-black text-red-500 tracking-tight">
              +${totalIncomes.toFixed(2)}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
              Cobros y aportes de capital
            </span>
          </div>

          {/* Egresos Totales Históricos */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-neutral-500 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Egresos / Retiros Totales
            </h3>
            <p className="text-3xl font-black text-neutral-300 tracking-tight">
              -${totalExpenses.toFixed(2)}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
              Préstamos emitidos y gastos
            </span>
          </div>
        </div>

        {/* Formulario de Registro de Movimiento */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            Registrar Nuevo Movimiento de Caja
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Tipo de Operación
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
              >
                <option value="INGRESO">Ingreso (+)</option>
                <option value="EGRESO">Egreso (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
              >
                {form.type === "INGRESO" ? (
                  <>
                    <option value="COBRO_CUOTA">Cobro de Cuota</option>
                    <option value="APORTE_CAPITAL">Aporte de Capital</option>
                    <option value="INGRESO_EXTRA">Ingreso Extra / Otro</option>
                  </>
                ) : (
                  <>
                    <option value="PRESTAMO_OTORGADO">Préstamo Otorgado</option>
                    <option value="GASTO_OPERATIVO">
                      Gasto Operativo / Oficina
                    </option>
                    <option value="RETIRO_SOCIO">Retiro de Socio</option>
                    <option value="EGRESO_EXTRA">Egreso Extra / Otro</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Monto ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Descripción / Referencia
              </label>
              <input
                type="text"
                placeholder="Detalle opcional..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Guardar Movimiento"}
              </button>
            </div>
          </form>
        </div>

        {/* Historial de Movimientos y Filtros */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-bold text-white">
              Historial de Transacciones
            </h3>

            {/* Pestañas de Filtrado */}
            <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 border border-neutral-800 rounded-xl">
              <button
                onClick={() => setFilter("TODOS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "TODOS"
                    ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter("INGRESO")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "INGRESO"
                    ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Ingresos
              </button>
              <button
                onClick={() => setFilter("EGRESO")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === "EGRESO"
                    ? "bg-red-600 text-white shadow-md shadow-red-950/50"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Egresos
              </button>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-400 bg-black/40">
                    <th className="p-4">Fecha y Hora</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Descripción</th>
                    <th className="p-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-sm">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-12 text-neutral-500"
                      >
                        No hay movimientos registrados para este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => (
                      <tr
                        key={mov.id}
                        className="hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-4 text-neutral-400 text-xs">
                          {new Date(mov.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                              mov.type === "INGRESO"
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                                : "bg-red-950/40 text-red-400 border-red-900/40"
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-white">
                          {mov.category}
                        </td>
                        <td className="p-4 text-neutral-400">
                          {mov.description || "-"}
                        </td>
                        <td
                          className={`p-4 text-right font-black tracking-tight ${
                            mov.type === "INGRESO"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {mov.type === "INGRESO" ? "+" : "-"}$
                          {mov.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
