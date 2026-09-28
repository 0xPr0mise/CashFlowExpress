export default function ClientMetricsCard({ clients, totalCreditLimit }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {/* Total Clientes */}
      <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-red-600 bg-neutral-900/60 backdrop-blur-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          Total de Clientes Registrados
        </h3>
        <p className="text-4xl font-black text-white tracking-tight">
          {clients.length}
        </p>
        <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
          Cartera activa general
        </span>
      </div>

      {/* Límite de Crédito Total Otorgado */}
      <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-emerald-500 bg-neutral-900/60 backdrop-blur-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          Límite de Crédito Total Otorgado
        </h3>
        <p className="text-4xl font-black text-emerald-400 tracking-tight">
          ${totalCreditLimit.toFixed(2)}
        </p>
        <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
          Suma máxima de riesgo crediticio
        </span>
      </div>
    </div>
  );
}
