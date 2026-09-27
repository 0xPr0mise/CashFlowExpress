import { useState } from "react";

export default function LoanForm({ clients, onLoanCreated }) {
  const [form, setForm] = useState({
    clientId: "",
    amount: "",
    interestRate: "20",
    installments: "10",
    frequency: "MENSUAL",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientId || !form.amount) {
      alert("Selecciona un cliente y define el monto.");
      return;
    }

    const amount = parseFloat(form.amount);
    const interestRate = parseFloat(form.interestRate);
    const installments = parseInt(form.installments);
    const totalToPay = amount + amount * (interestRate / 100);

    onLoanCreated({
      clientId: form.clientId,
      amount,
      installments,
      frequency: form.frequency,
      totalToPay,
    });

    setForm({
      clientId: "",
      amount: "",
      interestRate: "20",
      installments: "10",
      frequency: "MENSUAL",
    });
  };

  return (
    <div>
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        Otorgar Nuevo Préstamo
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Cliente *
            </label>
            <select
              name="clientId"
              value={form.clientId}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
            >
              <option value="" className="text-neutral-500">
                Seleccione un Cliente
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (DNI: {c.dni || "N/A"})
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
              placeholder="0.00"
              value={form.amount}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Interés (%)
            </label>
            <input
              type="number"
              name="interestRate"
              placeholder="20"
              value={form.interestRate}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Cuotas
            </label>
            <input
              type="number"
              name="installments"
              placeholder="10"
              value={form.installments}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
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
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
            >
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer"
          >
            Registrar Préstamo
          </button>
        </div>
      </form>
    </div>
  );
}
