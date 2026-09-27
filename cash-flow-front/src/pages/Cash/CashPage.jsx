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
    category: "EXTRA",
    amount: "",
    description: "",
  });

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
    try {
      await createCashMovement({
        ...form,
        amount: parseFloat(form.amount),
      });
      setForm({
        type: "INGRESO",
        category: "EXTRA",
        amount: "",
        description: "",
      });
      loadCashData();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      alert("Error al registrar el movimiento");
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            Gestión de Caja & Flujo
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Panel de control financiero, control de efectivo y registros
            operativos.
          </p>
        </div>

        {/* Tarjeta de Balance */}
        <div
          className={`p-6 rounded-2xl border ${
            balanceData.balance >= 0
              ? "bg-neutral-900/80 border-red-900/40 shadow-lg shadow-red-950/20"
              : "bg-red-950/20 border-red-600/50 shadow-lg shadow-red-900/30"
          } backdrop-blur-sm transition-all`}
        >
          <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-400">
            Balance Actual en Caja
          </h3>
          <p
            className={`text-4xl md:text-5xl font-black mt-2 tracking-tight ${
              balanceData.balance >= 0 ? "text-white" : "text-red-500"
            }`}
          >
            ${balanceData.balance.toFixed(2)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-red-400 font-semibold border border-neutral-700">
              {balanceData.totalMovements} Movimientos registrados
            </span>
          </div>
        </div>

        {/* Formulario de Registro Manual */}
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
            Registrar Movimiento Manual
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Tipo
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Categoría
              </label>
              <input
                type="text"
                placeholder="Ej. Oficina, Retiro..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
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
                Descripción
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

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Guardar Movimiento
              </button>
            </div>
          </form>
        </div>

        {/* Historial de Movimientos */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">
            Historial de Movimientos
          </h3>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-400 bg-black/40">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Descripción</th>
                    <th className="p-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-sm">
                  {movements.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-10 text-neutral-500"
                      >
                        No hay movimientos registrados en la caja.
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov) => (
                      <tr
                        key={mov.id}
                        className="hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-4 text-neutral-400 text-xs">
                          {new Date(mov.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              mov.type === "INGRESO"
                                ? "bg-red-950/30 text-red-400 border-red-900/50"
                                : "bg-neutral-900 text-neutral-300 border-neutral-700"
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-white">
                          {mov.category}
                        </td>
                        <td className="p-4 text-neutral-400">
                          {mov.description || "-"}
                        </td>
                        <td
                          className={`p-4 text-right font-bold tracking-tight ${
                            mov.type === "INGRESO"
                              ? "text-red-500"
                              : "text-neutral-300"
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
