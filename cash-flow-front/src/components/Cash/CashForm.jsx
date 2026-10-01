import { useState } from "react";
import ReactDOM from "react-dom";

export default function CashForm({ form, setForm, onSubmit, loading }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  // Función para formatear el número con separadores de miles (ej: 1.500.000)
  const formatNumberInput = (value) => {
    if (!value) return "";
    const cleanValue = value.toString().replace(/\D/g, "");
    if (!cleanValue) return "";
    return Number(cleanValue).toLocaleString("es-AR");
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setForm({ ...form, amount: rawValue });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(e);
    handleClose();
  };

  return (
    <>
      {/* Botón principal para abrir el modal */}
      <button
        type="button"
        onClick={handleOpen}
        className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-4.5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-red-950/50 cursor-pointer flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Nuevo Movimiento
      </button>

      {/* Modal flotante con Portal */}
      {isOpen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
              
              {/* Cabecera del Modal */}
              <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-600/50 flex items-center justify-center text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Registrar Movimiento Extraordinario</h3>
                    <p className="text-xs text-neutral-400">Aportes, gastos operativos o retiros de socios.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-neutral-400 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                      Tipo de Operación
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const defaultCat = newType === "INGRESO" ? "INGRESO_EXTRA" : "GASTO_OPERATIVO";
                        setForm({ ...form, type: newType, category: defaultCat });
                      }}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
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
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                    >
                      {form.type === "INGRESO" ? (
                        <>
                          <option value="APORTE_CAPITAL">Aporte de Capital</option>
                          <option value="CONCILIACION_CAJA">Conciliación de Caja</option>
                          <option value="INGRESO_EXTRA">Ingreso Extraordinario</option>
                        </>
                      ) : (
                        <>
                          <option value="GASTO_OPERATIVO">Gasto Operativo / Oficina</option>
                          <option value="RETIRO_SOCIO">Retiro de Socio</option>
                          <option value="EGRESO_EXTRA">Gasto Extraordinario</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                      Método de Pago / Canal
                    </label>
                    <select
                      value={form.paymentMethod || "EFECTIVO"}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                      Monto en Enteros ($)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatNumberInput(form.amount)}
                      onChange={handleAmountChange}
                      required
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Descripción / Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="Detalle opcional..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                  />
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3 pt-4 border-t border-neutral-800 mt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-1/2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Registrando..." : "Guardar Movimiento"}
                  </button>
                </div>
              </form>

            </div>
          </div>,
          document.body
        )}
    </>
  );
}