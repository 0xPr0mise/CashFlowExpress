export default function LoanDisbursementReceipt({ loan, client, settings }) {
  const currency = settings?.currency || "$";
  const companyName = settings?.companyName || "Cash Flow Express";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = settings?.receiptHeaderTitle || "COMPROBANTE DE PRÉSTAMO";
  const footerNote =
    settings?.receiptFooterNote || "Gracias por confiar en nosotros.";

  return (
    <div className="bg-white text-black p-8 rounded-xl max-w-md mx-auto font-sans shadow-2xl border border-neutral-300 space-y-6">
      {/* Cabecera del Recibo */}
      <div className="text-center border-b pb-4">
        <h1 className="text-xl font-black tracking-tight">{companyName}</h1>
        {companyId && (
          <p className="text-xs text-neutral-600">CUIT / RUT: {companyId}</p>
        )}
        <div className="mt-3 inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {headerTitle}
        </div>
      </div>

      {/* Datos del Cliente y Operación */}
      <div className="space-y-2 text-xs text-neutral-800">
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">Fecha:</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">Cliente:</span>
          <span className="font-bold">{client?.name || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-dashed pb-1">
          <span className="font-semibold text-neutral-500">
            Teléfono / DNI:
          </span>
          <span>
            {client?.phone || "-"} / {client?.dni || "-"}
          </span>
        </div>
      </div>

      {/* Importes */}
      <div className="bg-neutral-100 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-neutral-600">Monto Entregado:</span>
          <span className="font-black text-base">
            {currency} {loan?.amount?.toFixed(2) || "0.00"}
          </span>
        </div>
        <div className="flex justify-between text-xs text-neutral-600">
          <span>Plazo / Interés:</span>
          <span>
            {loan?.termDays || 30} días / {loan?.interestRate || 20}%
          </span>
        </div>
        <div className="flex justify-between text-xs font-bold text-emerald-700 border-t pt-2">
          <span>Total a Devolver:</span>
          <span>
            {currency} {loan?.totalToPay?.toFixed(2) || "0.00"}
          </span>
        </div>
      </div>

      {/* Firmas y Pie */}
      <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs text-neutral-500">
        <div className="border-t border-neutral-400 pt-1">Firma Empresa</div>
        <div className="border-t border-neutral-400 pt-1">Firma Cliente</div>
      </div>

      <div className="text-center text-[10px] text-neutral-400 pt-2 border-t">
        {footerNote}
      </div>
    </div>
  );
}
