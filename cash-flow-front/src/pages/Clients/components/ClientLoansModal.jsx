import { useState } from "react";

// --- FUNCIÓN UTILITARIA PARA FECHAS ---
function formatDateStr(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  return dateStr;
}

// --- FUNCIÓN DINÁMICA PARA EL RECIBO DE DESEMBOLSO / PRÉSTAMO ---
function downloadLoanDisbursementAsImage(loanData, clientName, settings) {
  const currency = settings?.currency || "$";
  const rawCompanyName = settings?.companyName || "Cash Flow Express";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = "COMPROBANTE DE APROBACIÓN";
  const footerNote = settings?.receiptFooterNote || "Conserve este comprobante como constancia.";

  const safeClientName = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, "_") : "Cliente";
  const fileName = `Desembolso_${safeClientName}_${new Date().toISOString().slice(0, 10)}.png`;

  let parsedSchedule = [];
  try {
    parsedSchedule = typeof loanData.schedule === "string" ? JSON.parse(loanData.schedule) : (loanData.schedule || []);
  } catch (e) {
    parsedSchedule = [];
  }

  const installments = loanData?.installments || parsedSchedule.length || 1;
  const hasSchedule = installments > 1 && parsedSchedule.length > 0;
  
  const baseHeight = hasSchedule ? 700 : 620;
  const scheduleHeight = hasSchedule ? parsedSchedule.length * 28 : 0;
  const totalHeight = Math.max(980, baseHeight + scheduleHeight);

  const canvas = document.createElement("canvas");
  const width = 580;
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  const margin = 35;
  let currentY = margin + 20;

  ctx.fillStyle = "#000000";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";

  const companyAscii = [
    "========================================",
    `    *** ${rawCompanyName.toUpperCase()} ***    `,
    "========================================"
  ];

  companyAscii.forEach((line) => {
    ctx.fillText(line, width / 2, currentY);
    currentY += 18;
  });

  currentY += 10;

  if (companyId) {
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#404040";
    ctx.fillText(`CUIT / RUT: ${companyId}`, width / 2, currentY);
    currentY += 25;
  }

  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = "#16a34a";
  ctx.fillText(headerTitle, width / 2, currentY);
  currentY += 20;

  const drawDottedLine = (y) => {
    ctx.strokeStyle = "#a3a3a3";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(width - margin, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  drawDottedLine(currentY);
  currentY += 20;

  const drawTicketRow = (label, value, isBold = false) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#525252";
    ctx.font = "13px sans-serif";
    ctx.fillText(label, margin, currentY);

    ctx.textAlign = "right";
    ctx.fillStyle = isBold ? "#000000" : "#262626";
    ctx.font = isBold ? "bold 13px sans-serif" : "13px sans-serif";
    ctx.fillText(value, width - margin, currentY);

    currentY += 22;
  };

  const now = new Date();
  const formattedDate = now.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const formattedTime = `${now.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })} hs.`;

  drawTicketRow("FECHA DE EMISIÓN:", formattedDate);
  drawTicketRow("HORA:", formattedTime);
  drawTicketRow("CLIENTE:", clientName, true);
  drawTicketRow("ESTADO:", "APROBADO Y ENTREGADO", true);

  currentY += 10;
  drawDottedLine(currentY);
  currentY += 25;

  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("CONCEPTO", margin, currentY);
  ctx.textAlign = "right";
  ctx.fillText("IMPORTE", width - margin, currentY);
  currentY += 18;

  drawDottedLine(currentY);
  currentY += 25;

  const drawItemRow = (desc, val, isGreen = false, isRed = false) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#262626";
    ctx.font = "13px sans-serif";
    ctx.fillText(desc, margin, currentY);

    ctx.textAlign = "right";
    if (isGreen) {
      ctx.fillStyle = "#16a34a";
    } else if (isRed) {
      ctx.fillStyle = "#dc2626";
    } else {
      ctx.fillStyle = "#000000";
    }
    ctx.font = "13px sans-serif";
    ctx.fillText(val, width - margin, currentY);

    currentY += 24;
  };

  const amount = Math.round(loanData?.amount || 0);
  const interestAmt = Math.round(loanData?.interestAmount || 0);
  const total = Math.round(loanData?.totalToPay || loanData?.amount || 0);

  drawItemRow(`Capital Entregado`, `${currency} ${amount.toLocaleString("es-AR")}`, false, true);
  drawItemRow(`Plazo: ${installments} cuota(s) [${loanData?.frequency || "A_TERMINO"}]`, `-`);
  
  if (loanData?.frequency === "A_TERMINO") {
    drawItemRow(`Plazo Estimado (${loanData?.daysDiff || 0} días)`, `-`);
  }

  drawItemRow(`Interés Aplicado (${loanData?.interestRate || 0}%)`, `${currency} ${interestAmt.toLocaleString("es-AR")}`, true);

  currentY += 5;
  drawDottedLine(currentY);
  currentY += 25;

  if (hasSchedule) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("CRONOGRAMA DE VENCIMIENTOS:", margin, currentY);
    currentY += 20;

    parsedSchedule.forEach((inst) => {
      const instNum = inst.installmentNumber;
      const readableDueDate = formatDateStr(inst.dueDate);
      const instAmount = Math.round(inst.amount);
      
      ctx.textAlign = "left";
      ctx.fillStyle = "#404040";
      ctx.font = "11px sans-serif";
      ctx.fillText(`Cuota #${instNum} — Venc: ${readableDueDate}`, margin, currentY);

      ctx.textAlign = "right";
      ctx.fillStyle = "#000000";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`${currency} ${instAmount.toLocaleString("es-AR")}`, width - margin, currentY);

      currentY += 22;
    });

    currentY += 5;
    drawDottedLine(currentY);
    currentY += 25;
  }

  let finalDueDate = "";
  if (hasSchedule && parsedSchedule.length > 0) {
    const lastInst = parsedSchedule[parsedSchedule.length - 1];
    finalDueDate = lastInst?.dueDate || "";
  } else {
    finalDueDate = loanData?.dueDate || parsedSchedule?.[0]?.dueDate || "";
  }

  if (finalDueDate) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#525252";
    ctx.font = "12px sans-serif";
    ctx.fillText("FECHA VENCIMIENTO / PAGO:", margin, currentY);

    ctx.textAlign = "right";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(formatDateStr(finalDueDate), width - margin, currentY);
    currentY += 26;
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("TOTAL A DEVOLVER:", margin, currentY);

  ctx.textAlign = "right";
  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText(`${currency} ${total.toLocaleString("es-AR")}`, width - margin, currentY);

  currentY += 30;
  drawDottedLine(currentY);
  currentY += 30;

  ctx.textAlign = "center";
  ctx.fillStyle = "#737373";
  ctx.font = "12px sans-serif";
  ctx.fillText(footerNote, width / 2, currentY);
  currentY += 20;
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText("Operación registrada en sistema.", width / 2, currentY);

  const pngUrl = canvas.toDataURL("image/png");
  const downloadLink = document.createElement("a");
  downloadLink.href = pngUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// --- FUNCIÓN DINÁMICA PARA EL RECIBO DE PAGO ---
function downloadExistingPaymentReceipt(payment, loan, clientName, settings) {
  const currency = settings?.currency || "$";
  const rawCompanyName = settings?.companyName || "Cash Flow Express";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = "COMPROBANTE DE PAGO";
  const footerNote = settings?.receiptFooterNote || "Conserve este comprobante como constancia.";

  const safeClientName = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, "_") : "Cliente";
  const installmentNum = payment.installmentNumber || payment.targetInstallmentNumber || payment.cuota || 1;
  const fileName = `Pago_Cuota_${installmentNum}_${safeClientName}_${new Date(payment.createdAt || Date.now()).toISOString().slice(0, 10)}.png`;

  const canvas = document.createElement("canvas");
  const width = 580;
  const totalHeight = 720;
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  const margin = 35;
  let currentY = margin + 20;

  ctx.fillStyle = "#000000";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";

  const companyAscii = [
    "========================================",
    `    *** ${rawCompanyName.toUpperCase()} ***    `,
    "========================================"
  ];

  companyAscii.forEach((line) => {
    ctx.fillText(line, width / 2, currentY);
    currentY += 18;
  });

  currentY += 10;

  if (companyId) {
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#404040";
    ctx.fillText(`CUIT / RUT: ${companyId}`, width / 2, currentY);
    currentY += 25;
  }

  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = "#16a34a";
  ctx.fillText(headerTitle, width / 2, currentY);
  currentY += 20;

  const drawDottedLine = (y) => {
    ctx.strokeStyle = "#a3a3a3";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(width - margin, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  drawDottedLine(currentY);
  currentY += 20;

  const drawTicketRow = (label, value, isBold = false) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#525252";
    ctx.font = "13px sans-serif";
    ctx.fillText(label, margin, currentY);

    ctx.textAlign = "right";
    ctx.fillStyle = isBold ? "#000000" : "#262626";
    ctx.font = isBold ? "bold 13px sans-serif" : "13px sans-serif";
    ctx.fillText(value, width - margin, currentY);

    currentY += 22;
  };

  const paymentDateObj = new Date(payment.createdAt || payment.date || Date.now());
  const formattedDate = paymentDateObj.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const formattedTime = `${paymentDateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })} hs.`;

  drawTicketRow("FECHA DE PAGO:", formattedDate);
  drawTicketRow("HORA:", formattedTime);
  drawTicketRow("CLIENTE:", clientName, true);
  drawTicketRow("MÉTODO DE PAGO:", payment.paymentMethod || "EFECTIVO", true);

  currentY += 10;
  drawDottedLine(currentY);
  currentY += 25;

  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("CONCEPTO", margin, currentY);
  ctx.textAlign = "right";
  ctx.fillText("IMPORTE", width - margin, currentY);
  currentY += 18;

  drawDottedLine(currentY);
  currentY += 25;

  const drawItemRow = (desc, val, isGreen = false) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#262626";
    ctx.font = "13px sans-serif";
    ctx.fillText(desc, margin, currentY);

    ctx.textAlign = "right";
    ctx.fillStyle = isGreen ? "#16a34a" : "#000000";
    ctx.font = "13px sans-serif";
    ctx.fillText(val, width - margin, currentY);

    currentY += 24;
  };

  const amountPaid = Math.round(Number(payment.amount ?? payment.monto ?? payment.valor ?? 0));
  drawItemRow(`Abono Cuota #${installmentNum}`, `${currency} ${amountPaid.toLocaleString("es-AR")}`, true);
  
  if (payment.note) {
    drawItemRow(`Nota: ${payment.note}`, `-`);
  }

  currentY += 10;
  drawDottedLine(currentY);
  currentY += 25;

  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("TOTAL ABONADO:", margin, currentY);

  ctx.textAlign = "right";
  ctx.fillStyle = "#16a34a";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(`${currency} ${amountPaid.toLocaleString("es-AR")}`, width - margin, currentY);

  currentY += 45;
  drawDottedLine(currentY);
  currentY += 35;

  ctx.textAlign = "center";
  ctx.fillStyle = "#737373";
  ctx.font = "12px sans-serif";
  ctx.fillText(footerNote, width / 2, currentY);
  currentY += 20;
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText("Operación registrada en sistema.", width / 2, currentY);

  const pngUrl = canvas.toDataURL("image/png");
  const downloadLink = document.createElement("a");
  downloadLink.href = pngUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// --- COMPONENTE PRINCIPAL DEL MODAL ---
export default function ClientLoansModal({ isOpen, onClose, selectedClient, settings }) {
  const [filterStatus, setFilterStatus] = useState("TODOS");

  if (!isOpen || !selectedClient) return null;

  const loansList = selectedClient.loans || selectedClient.clientLoans || [];

  const formatMoney = (amount) => {
    const numericValue = Number(amount) || 0;
    const rounded = Math.round(numericValue);
    return rounded.toLocaleString("es-AR");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no registrada";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " hs.";
    } catch {
      return dateString;
    }
  };

  const totalClientPending = loansList.reduce((sum, loan) => {
    const status = loan.status ? String(loan.status).toUpperCase() : 'ACTIVO';
    if (status === 'PAGADO') return sum;

    const totalToPay = Number(loan.totalToPay ?? loan.amount ?? 0);
    const paymentsSum = Array.isArray(loan.payments)
      ? loan.payments.reduce((acc, p) => acc + Number(p.amount ?? p.monto ?? p.valor ?? p.cuota ?? 0), 0)
      : 0;

    const directPaidAmount = Number(loan.paidAmount ?? 0);
    const totalPaidSoFar = Math.max(paymentsSum, directPaidAmount);

    const netDebt = totalToPay - totalPaidSoFar;
    return sum + (netDebt > 0 ? netDebt : 0);
  }, 0);

  const filteredLoans = loansList.filter((loan) => {
    const status = loan.status ? String(loan.status).toUpperCase() : 'ACTIVO';
    if (filterStatus === "TODOS") return true;
    return status === filterStatus;
  });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 z-[9999] animate-in fade-in duration-200">
      {/* Contenedor principal adaptable: ancho completo abajo en mobile, tarjeta centrada en pantallas medianas */}
      <div className="bg-neutral-900 border-t sm:border border-neutral-800/90 rounded-t-2xl sm:rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-black/30 flex-shrink-0">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Detalle de Cartera y Recibos
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5 truncate max-w-[260px] sm:max-w-none">
              {selectedClient.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Resumen Rápido y Filtro (Apilado en móvil, en línea en sm+) */}
        <div className="px-4 sm:px-6 py-3 bg-neutral-950/70 border-b border-neutral-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs flex-shrink-0">
          <span className="text-neutral-400 flex items-center justify-between sm:justify-start gap-2">
            Total Pendiente:{" "}
            <strong className="text-amber-400 font-black text-sm sm:text-base">
              ${formatMoney(totalClientPending)}
            </strong>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-neutral-400 text-[11px] uppercase font-semibold flex-shrink-0">Filtrar:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-neutral-900 border border-neutral-700/60 rounded-lg px-3 py-2 sm:py-1.5 text-white text-xs focus:outline-none focus:border-red-600 transition-colors cursor-pointer font-medium w-full sm:w-auto"
            >
              <option value="TODOS">Todos ({loansList.length})</option>
              <option value="ACTIVO">Activos</option>
              <option value="MOROSO">Morosos</option>
              <option value="REFINANCIADO">Refinanciados</option>
              <option value="PAGADO">Pagados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Listado con Scroll Armonioso */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-neutral-950 [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center mx-auto text-lg text-neutral-400">
                🔍
              </div>
              <p className="text-neutral-300 text-sm font-semibold">
                No se encontraron préstamos con este filtro
              </p>
              <p className="text-neutral-500 text-xs">
                Intenta cambiar el estado seleccionado en el filtro superior.
              </p>
            </div>
          ) : (
            filteredLoans.map((loan) => {
              const status = loan.status ? String(loan.status).toUpperCase() : 'ACTIVO';
              const totalToPay = Number(loan.totalToPay ?? loan.amount ?? 0);
              
              const paymentsList = Array.isArray(loan.payments) ? loan.payments : [];

              const paymentsSum = paymentsList.reduce(
                (acc, p) => acc + Number(p.amount ?? p.monto ?? p.valor ?? p.cuota ?? 0), 
                0
              );

              const directPaidAmount = Number(loan.paidAmount ?? 0);
              const totalPaidSoFar = Math.max(paymentsSum, directPaidAmount);

              const netDebt = totalToPay - totalPaidSoFar;
              const pending = netDebt > 0 ? netDebt : 0;

              return (
                <div
                  key={loan.id}
                  className="bg-neutral-800/40 border border-neutral-800 hover:border-neutral-700/80 p-3.5 sm:p-4 rounded-xl transition-all space-y-3 shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-md border border-neutral-700/50">
                      ID: #{loan.id.slice(-6)}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      status === 'PAGADO' 
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/40' 
                        : status === 'CANCELADO'
                        ? 'bg-red-950/50 text-red-400 border-red-900/40'
                        : status === 'MOROSO' || status === 'REFINANCIADO'
                        ? 'bg-purple-950/50 text-purple-400 border-purple-900/40'
                        : 'bg-amber-950/50 text-amber-400 border-amber-900/40'
                    }`}>
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/60 text-xs">
                    <div>
                      <span className="text-neutral-500 block mb-0.5">
                        Monto Total / A Pagar
                      </span>
                      <span className="font-bold text-neutral-200 text-sm">
                        ${formatMoney(totalToPay)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block mb-0.5">
                        Saldo Pendiente
                      </span>
                      <span className="font-black text-amber-400 text-sm">
                        ${formatMoney(pending)}
                      </span>
                    </div>
                  </div>

                  {/* Botón para descargar el recibo de Préstamo con settings dinámicos */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => downloadLoanDisbursementAsImage(loan, selectedClient.name, settings)}
                      className="w-full bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 hover:border-emerald-700/60 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      title="Descargar comprobante de aprobación y entrega de este préstamo"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                      </svg>
                      <span>Descargar Recibo de Préstamo (Entrega)</span>
                    </button>
                  </div>

                  {/* Sección de Historial de Recibos de Pagos */}
                  <div className="pt-3 border-t border-neutral-800/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                      Historial de Pagos ({paymentsList.length})
                    </span>

                    {paymentsList.length === 0 ? (
                      <p className="text-neutral-500 text-xs italic bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-800/40">
                        No hay pagos registrados para este préstamo todavía.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-neutral-950 [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {paymentsList.map((payment, idx) => {
                          const paymentAmount = Number(payment.amount ?? payment.monto ?? payment.valor ?? payment.cuota ?? 0);
                          const paymentDate = payment.createdAt || payment.date || payment.fecha;
                          const installmentNum = payment.installmentNumber || payment.targetInstallmentNumber || payment.cuota || (idx + 1);

                          return (
                            <div 
                              key={payment.id || idx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900/60 border border-neutral-800/60 p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs gap-2"
                            >
                              <div className="space-y-0.5">
                                <span className="text-neutral-200 font-medium block">
                                  Cuota #{installmentNum} — <span className="text-emerald-400 font-bold">${formatMoney(paymentAmount)}</span>
                                </span>
                                <span className="text-[10px] text-neutral-500 block">
                                  {formatDate(paymentDate)} <span className="uppercase font-semibold">({payment.paymentMethod || "EFECTIVO"})</span>
                                </span>
                              </div>

                              {/* Botón para descargar recibo de pago individual */}
                              <button
                                type="button"
                                onClick={() => downloadExistingPaymentReceipt(payment, loan, selectedClient.name, settings)}
                                className="bg-neutral-800 hover:bg-emerald-950 text-neutral-300 hover:text-emerald-400 border border-neutral-700 hover:border-emerald-800 px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs sm:text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                title="Descargar comprobante de este pago"
                              >
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                                </svg>
                                <span>Descargar Recibo</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-3 sm:p-4 border-t border-neutral-800 bg-black/20 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 sm:py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-lg active:scale-98">

            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
}