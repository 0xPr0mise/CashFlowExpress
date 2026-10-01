// Función utilitaria para formatear cadenas de fecha estilo "YYYY-MM-DD" a "DD/MM/AAAA"
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

// Función utilitaria para generar y descargar el ticket de desembolso en formato imagen mediante Canvas 2D
export function downloadLoanDisbursementAsImage(loanData, settings) {
  const currency = settings?.currency || "$";
  const rawCompanyName = settings?.companyName || "Cash Flow Express V.2";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = "COMPROBANTE DE APROBACIÓN";
  const footerNote = settings?.receiptFooterNote || "Conserve este comprobante como constancia.";

  const clientName = loanData?.client?.name 
    ? loanData.client.name.replace(/[^a-zA-Z0-9]/g, "_") 
    : "Cliente";
  const fileName = `Desembolso_${clientName}_${new Date().toISOString().slice(0, 10)}.png`;

  // Determinamos altura dinámica del canvas en base a si hay cuotas múltiples o no
  const installments = loanData?.installments || 1;
  const hasSchedule = installments > 1 && loanData?.schedule && loanData.schedule.length > 0;
  
  // Altura base + espacio adicional por cada cuota si existe cronograma
  const baseHeight = hasSchedule ? 700 : 620;
  const scheduleHeight = hasSchedule ? loanData.schedule.length * 28 : 0;
  const totalHeight = Math.max(980, baseHeight + scheduleHeight);

  // 1. Configuramos dimensiones tipo ticket vertical / factura estrecha
  const canvas = document.createElement("canvas");
  const width = 580;
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  // Fondo blanco general del ticket
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  const margin = 35;
  let currentY = margin + 20;

  // --- CABECERA: ESTILO ASCII CON BARRAS EN ESCALA DE GRISES / MONOCROMÁTICO ---
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

  // Título del comprobante (Monocromático en negro)
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = "#000000";
  ctx.fillText(headerTitle, width / 2, currentY);
  currentY += 20;

  // Línea de puntos / separación estilo ticket
  const drawDottedLine = (y) => {
    ctx.strokeStyle = "#737373";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(width - margin, y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
  };

  drawDottedLine(currentY);
  currentY += 20;

  // --- DATOS GENERALES ---
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
  drawTicketRow("CLIENTE:", loanData?.client?.name || "Consumidor Final", true);
  drawTicketRow("ESTADO:", "APROBADO Y ENTREGADO", true);

  currentY += 10;
  drawDottedLine(currentY);
  currentY += 25;

  // --- DETALLE DE ÍTEMS / CONCEPTOS ---
  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("CONCEPTO", margin, currentY);
  ctx.textAlign = "right";
  ctx.fillText("IMPORTE", width - margin, currentY);
  currentY += 18;

  drawDottedLine(currentY);
  currentY += 25;

  const drawItemRow = (desc, val) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#262626";
    ctx.font = "13px sans-serif";
    ctx.fillText(desc, margin, currentY);

    ctx.textAlign = "right";
    ctx.fillStyle = "#000000";
    ctx.font = "13px sans-serif";
    ctx.fillText(val, width - margin, currentY);

    currentY += 24;
  };

  const amount = Math.round(loanData?.amount || 0);
  const interestAmt = Math.round(loanData?.interestAmount || 0);
  const total = Math.round(loanData?.totalToPay || 0);

  drawItemRow(`Capital Entregado`, `${currency} ${amount.toLocaleString("es-AR")}`);
  drawItemRow(`Plazo: ${installments} cuota(s) [${loanData?.frequency || "A_TERMINO"}]`, `-`);
  
  if (loanData?.frequency === "A_TERMINO") {
    drawItemRow(`Plazo Estimado (${loanData?.daysDiff || 0} días)`, `-`);
  }

  drawItemRow(`Interés Aplicado (${loanData?.interestRate || 0}%)`, `${currency} ${interestAmt.toLocaleString("es-AR")}`);

  currentY += 5;
  drawDottedLine(currentY);
  currentY += 25;

  // --- CRONOGRAMA DE CUOTAS (Si aplica) ---
  if (hasSchedule) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("CRONOGRAMA DE VENCIMIENTOS:", margin, currentY);
    currentY += 20;

    loanData.schedule.forEach((inst) => {
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

  // --- FECHA DE PAGO / VENCIMIENTO Y TOTALES FINALES (ORDEN INVERTIDO) ---
  
  // 1. Primero la Fecha de Vencimiento / Pago
  let finalDueDate = "";
  if (hasSchedule && loanData.schedule.length > 0) {
    const lastInst = loanData.schedule[loanData.schedule.length - 1];
    finalDueDate = lastInst?.dueDate || "";
  } else {
    finalDueDate = loanData?.dueDate || loanData?.schedule?.[0]?.dueDate || "";
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

  // 2. Total a Devolver abajo de todo (en negro monocromático)
  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("TOTAL A DEVOLVER:", margin, currentY);

  ctx.textAlign = "right";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText(`${currency} ${total.toLocaleString("es-AR")}`, width - margin, currentY);

  currentY += 30;
  drawDottedLine(currentY);
  currentY += 30;

  // --- PIE DEL TICKET ---
  ctx.textAlign = "center";
  ctx.fillStyle = "#737373";
  ctx.font = "12px sans-serif";
  ctx.fillText(footerNote, width / 2, currentY);
  currentY += 20;
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText("Operación registrada en sistema.", width / 2, currentY);

  // 2. Descarga automática inmediata del Canvas como PNG
  const pngUrl = canvas.toDataURL("image/png");
  const downloadLink = document.createElement("a");
  downloadLink.href = pngUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Componente visual que expone el botón de descarga del comprobante de desembolso (con botón verde original)
export default function LoanDisbursementReceipt({ loanData, settings }) {
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => downloadLoanDisbursementAsImage(loanData, settings)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
        </svg>
        Descargar Comprobante de Entrega (PNG)
      </button>
    </div>
  );
}