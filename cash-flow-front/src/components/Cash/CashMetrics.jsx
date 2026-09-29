export default function CashMetrics({ balanceData }) {
  // Función auxiliar puramente estética para formatear enteros en millares
  const formatMoney = (amount) => {
    const rounded = Math.round(amount || 0);
    return rounded.toLocaleString("es-AR");
  };

  return (
    <div className="w-full">
      <div
        className={`p-6 rounded-2xl border backdrop-blur-sm transition-all bg-neutral-900/60 ${
          balanceData.balance >= 0
            ? "border-neutral-800 border-l-4 border-l-emerald-500"
            : "border-red-900/60 border-l-4 border-l-red-600"
        }`}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          Dinero Disponible en Caja (Balance Neto)
        </h3>
        <p
          className={`text-4xl font-black tracking-tight ${
            balanceData.balance >= 0 ? "text-emerald-400" : "text-red-500"
          }`}
        >
          ${formatMoney(balanceData.balance)}
        </p>
        <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2.5 py-1 rounded-lg border border-neutral-800">
          {balanceData.totalMovements} transacciones registradas en total
        </span>
      </div>
    </div>
  );
}