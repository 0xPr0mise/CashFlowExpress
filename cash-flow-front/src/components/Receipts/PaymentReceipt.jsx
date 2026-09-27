export default function PaymentReceipt({ payment, loan, client, settings }) {
  const currency = settings?.currency || "$";
  const companyName = settings?.companyName || "Cash Flow Express";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = "COMPROBANTE DE PAGO PARCIAL";
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
        <div className="mt-3 inline-block bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {headerTitle}
        </div>
      </div>

      {/* Datos del Cliente y Préstamo */}
      <div className="space-y-2 text-xs text-neutral-800">
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">Fecha de Pago:</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">Cliente:</span>
          <span className="font-bold">{client?.name || "Juan Pérez"}</span>
        </div>
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">
            Referencia de Crédito:
          </span>
          <span>Préstamo #{loan?.id || "0042"}</span>
        </div>
      </div>

      {/* Importe Abonado */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg space-y-2 text-center">
        <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-800">
          Monto Abonado
        </span>
        <span className="text-2xl font-black text-emerald-700">
          {currency} {payment?.amount?.toFixed(2) || "250.00"}
        </span>
        <div className="flex justify-between text-xs text-neutral-600 border-t border-emerald-200/60 pt-2 mt-2">
          <span>Saldo Restante Estimado:</span>
          <span className="font-bold text-neutral-800">
            {currency} {payment?.remainingBalance?.toFixed(2) || "950.00"}
          </span>
        </div>
      </div>

      {/* Firmas y Pie */}
      <div className="pt-4 grid grid-cols-2 gap-4 text-center text-xs text-neutral-500">
        <div className="border-t border-neutral-400 pt-1">Recibí Conforme</div>
        <div className="border-t border-neutral-400 pt-1">Entregué</div>
      </div>

      <div className="text-center text-[10px] text-neutral-400 pt-2 border-t">
        {footerNote}
      </div>
    </div>
  );
}
