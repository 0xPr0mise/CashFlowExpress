import { useState, useEffect } from "react";

export default function LoanForm({ 
  isOpen, 
  onClose, 
  clients, 
  onLoanCreated, 
  defaultInterestRate = 20 
}) {
  const [form, setForm] = useState({
    clientId: "",
    amount: "",
    interestRate: String(defaultInterestRate),
    installments: "1", // Por defecto en 1 cuota para que inicie en A Término
    frequency: "A_TERMINO",
    dueDate: "",
  });

  // Actualizar la tasa de interés si cambia la obtenida de la DB
  useEffect(() => {
    if (defaultInterestRate !== undefined) {
      setForm((prev) => ({ ...prev, interestRate: String(defaultInterestRate) }));
    }
  }, [defaultInterestRate]);

  // Manejo estricto de la frecuencia según la cantidad de cuotas
  useEffect(() => {
    const installmentsNum = parseInt(form.installments) || 1;
    
    if (installmentsNum === 1) {
      setForm((prev) => ({ ...prev, frequency: "A_TERMINO" }));
    } else {
      if (form.frequency === "A_TERMINO") {
        setForm((prev) => ({ ...prev, frequency: "MENSUAL" }));
      }
    }
  }, [form.installments]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Evitar valores negativos en campos numéricos
    if ((name === "amount" || name === "interestRate" || name === "installments") && value < 0) {
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientId || !form.amount || !form.dueDate) {
      alert("Selecciona un cliente, define el monto y la fecha de vencimiento.");
      return;
    }

    const amount = parseFloat(form.amount);
    const interestRate = parseFloat(form.interestRate);
    const installments = parseInt(form.installments);
    
    // Cálculo del total a pagar basado en el monto y la tasa de interés
    const totalToPay = amount + amount * (interestRate / 100);

    onLoanCreated({
      clientId: form.clientId,
      amount,
      installments,
      frequency: form.frequency,
      interestRate,
      dueDate: form.dueDate,
      totalToPay,
    });

    setForm({
      clientId: "",
      amount: "",
      interestRate: String(defaultInterestRate),
      installments: "1",
      frequency: "A_TERMINO",
      dueDate: "",
    });
    
    onClose();
  };

  const installmentsNum = parseInt(form.installments) || 1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Otorgar Nuevo Préstamo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Cliente *
              </label>
              <select
                name="clientId"
                value={form.clientId}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
              >
                <option value="" className="text-neutral-500">
                  Seleccione un Cliente
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.dni ? `(DNI: ${c.dni})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Monto ($) *
              </label>
              <input
                type="number"
                name="amount"
                min="0"
                step="any"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Interés (%)
              </label>
              <input
                type="number"
                name="interestRate"
                min="0"
                step="any"
                value={form.interestRate}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Cuotas
              </label>
              <input
                type="number"
                name="installments"
                min="1"
                value={form.installments}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Frecuencia
              </label>
              <select
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
              >
                <option value="DIARIO" disabled={installmentsNum === 1}>
                  Diario
                </option>
                <option value="SEMANAL" disabled={installmentsNum === 1}>
                  Semanal
                </option>
                <option value="QUINCENAL" disabled={installmentsNum === 1}>
                  Quincenal
                </option>
                <option value="MENSUAL" disabled={installmentsNum === 1}>
                  Mensual
                </option>
                <option value="A_TERMINO" disabled={installmentsNum > 1}>
                  A Término
                </option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer scheme-dark"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer"
            >
              Registrar Préstamo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}