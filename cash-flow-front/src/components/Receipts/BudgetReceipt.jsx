export default function BudgetReceipt({ budget, client, settings }) {
  const currency = settings?.currency || "$";
  const companyName = settings?.companyName || "Cash Flow Express";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = "PRESUPUESTO / COTIZACIÓN";
  const footerNote =
    settings?.receiptFooterNote || "Gracias por confiar en nosotros.";

  return (
    <div className="bg-white text-black p-8 rounded-xl max-w-md mx-auto font-sans shadow-2xl border border-neutral-300 space-y-6">
      {/* Cabecera */}
      <div className="text-center border-b pb-4">
        <h1 className="text-xl font-black tracking-tight">{companyName}</h1>
        {companyId && (
          <p className="text-xs text-neutral-600">CUIT / RUT: {companyId}</p>
        )}
        <div className="mt-3 inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {headerTitle}
        </div>
      </div>

      {/* Datos del Cliente */}
      <div className="space-y-2 text-xs text-neutral-800">
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">
            Fecha de Emisión:
          </span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">
            Cliente Solicitante:
          </span>
          <span className="font-bold">{client?.name || "Cliente General"}</span>
        </div>
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">
            Validez de Oferta:
          </span>
          <span>7 días hábiles</span>
        </div>
      </div>

      {/* Detalles del Presupuesto */}
      <div className="bg-neutral-100 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-xs text-neutral-600">
          <span>Monto Solicitado:</span>
          <span className="font-semibold">
            {currency} {budget?.amount?.toFixed(2) || "1,000.00"}
          </span>
        </div>
        <div className="flex justify-between text-xs text-neutral-600">
          <span>Plazo Estimado:</span>
          <span>{budget?.termDays || 30} días</span>
        </div>
        <div className="flex justify-between text-xs text-neutral-600">
          <span>Tasa Estimada:</span>
          <span>{budget?.interestRate || 20}%</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-blue-700 border-t pt-2">
          <span>Total Proyectado a Pagar:</span>
          <span>
            {currency} {budget?.totalToPay?.toFixed(2) || "1,200.00"}
          </span>
        </div>
      </div>

      {/* Pie y Nota */}
      <div className="text-center text-[10px] text-neutral-400 pt-4 border-t">
        {footerNote} <br />
        Este documento es una simulación informativa y no constituye un
        compromiso de desembolso definitivo.
      </div>
    </div>
  );
}
