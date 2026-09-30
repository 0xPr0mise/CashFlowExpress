export default function ClientMetricsCard({ clients = [] }) {
  // Sumamos el total pendiente real y dinámico de todos los clientes y sus préstamos
  const totalRemaining = clients.reduce((acc, client) => {
    const loansList = client.loans || client.clientLoans || [];

    const clientPendingSum = loansList.reduce((loanSum, loan) => {
      const status = loan.status ? String(loan.status).toUpperCase() : 'ACTIVO';
      if (status === 'PAGADO') return loanSum;

      const totalToPay = Number(loan.totalToPay ?? loan.amount ?? 0);
      const paymentsSum = Array.isArray(loan.payments)
        ? loan.payments.reduce((pAcc, p) => pAcc + Number(p.amount ?? p.monto ?? p.valor ?? p.cuota ?? 0), 0)
        : 0;

      const directPaidAmount = Number(loan.paidAmount ?? 0);
      const totalPaidSoFar = Math.max(paymentsSum, directPaidAmount);

      const netDebt = totalToPay - totalPaidSoFar;
      return loanSum + (netDebt > 0 ? netDebt : 0);
    }, 0);

    return acc + clientPendingSum;
  }, 0);

  const formatMoney = (amount) => {
    const numericValue = Number(amount) || 0;
    const rounded = Math.round(numericValue);
    return rounded.toLocaleString("es-AR");
  };

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

      {/* Remanente por Cobrar (Neto y en Tiempo Real) */}
      <div className="p-6 rounded-2xl border border-neutral-800 border-l-4 border-l-emerald-500 bg-neutral-900/60 backdrop-blur-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          Remanente Total por Cobrar
        </h3>
        <p className="text-4xl font-black text-emerald-400 tracking-tight">
          ${formatMoney(totalRemaining)}
        </p>
        <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
          Cálculo dinámico en tiempo real
        </span>
      </div>
    </div>
  );
}