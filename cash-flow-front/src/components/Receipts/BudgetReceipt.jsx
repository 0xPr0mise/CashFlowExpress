// Función utilitaria para generar y descargar el ticket en formato factura mediante Canvas 2D
export function downloadBudgetAsImage(loanData, settings) {
  const currency = settings?.currency || "$";
  const rawCompanyName = settings?.companyName || "Cash Flow Express";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = "TICKET / PRESUPUESTO";
  const footerNote = settings?.receiptFooterNote || "Gracias por su preferencia.";

  const clientName = loanData?.client?.name 
    ? loanData.client.name.replace(/[^a-zA-Z0-9]/g, "_") 
    : "Cliente";
  const fileName = `Ticket_${clientName}_${new Date().toISOString().slice(0, 10)}.png`;

  // 1. Configuramos dimensiones tipo ticket vertical / factura estrecha
  const canvas = document.createElement("canvas");
  const width = 580;
  const height = 960;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Fondo blanco general del ticket
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const margin = 35;
  let currentY = margin + 20;

  // --- CABECERA: NOMBRE DE LA EMPRESA EN ASCII ART ---
  ctx.fillStyle = "#000000";
  // Usamos fuente monoespaciada para que el ASCII art mantenga su forma perfectamente
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";

  // Generamos un bloque ASCII simple y limpio basado en el nombre de la empresa
  const companyAscii = [
    "========================================",
    `   *** ${rawCompanyName.toUpperCase()} ***   `,
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

  // Título del comprobante
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#2563eb";
  ctx.fillText(headerTitle, width / 2, currentY);
  currentY += 20;

  // Línea de puntos / separación estilo ticket
  const drawDottedLine = (y) => {
    ctx.strokeStyle = "#a3a3a3";
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

  // --- DATOS GENERALES (Estilo factura) ---
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

  drawTicketRow("FECHA:", new Date().toLocaleDateString());
  drawTicketRow("HORA:", new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  drawTicketRow("CLIENTE:", loanData?.client?.name || "Consumidor Final", true);
  drawTicketRow("VALIDEZ:", "Sólo por el día de la fecha");

  currentY += 10;
  drawDottedLine(currentY);
  currentY += 25;

  // --- DETALLE DE ÍTEMS / CONCEPTOS ---
  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("DESCRIPCIÓN", margin, currentY);
  ctx.textAlign = "right";
  ctx.fillText("SUBTOTAL", width - margin, currentY);
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

  const amount = loanData?.amount || 0;
  const interestAmt = loanData?.interestAmount || 0;
  const total = loanData?.totalToPay || 0;

  drawItemRow(`Capital Solicitado`, `${currency} ${amount.toFixed(2)}`);
  drawItemRow(`Plazo: ${loanData?.installments || 1} cuota(s) [${loanData?.frequency || "A_TERMINO"}]`, `-`);
  
  if (loanData?.frequency === "A_TERMINO") {
    drawItemRow(`Plazo Estimado (${loanData?.daysDiff || 0} días)`, `-`);
  }

  drawItemRow(`Tasa Aplicada (${loanData?.interestRate || 0}%)`, `${currency} ${interestAmt.toFixed(2)}`, true);

  currentY += 5;
  drawDottedLine(currentY);
  currentY += 25;

  // --- TOTALES FINALES ---
  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("TOTAL A PAGAR:", margin, currentY);

  ctx.textAlign = "right";
  ctx.fillStyle = "#1d4ed8";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(`${currency} ${total.toFixed(2)}`, width - margin, currentY);

  currentY += 45;
  drawDottedLine(currentY);
  currentY += 30;

  // --- PIE DEL TICKET ---
  ctx.textAlign = "center";
  ctx.fillStyle = "#737373";
  ctx.font = "12px sans-serif";
  ctx.fillText(footerNote, width / 2, currentY);
  currentY += 20;
  ctx.fillStyle = "#a3a3a3";
  currentY += 16;
  ctx.fillText("Simulación informativa.", width / 2, currentY);

  // 2. Descarga automática inmediata del Canvas como PNG
  const pngUrl = canvas.toDataURL("image/png");
  const downloadLink = document.createElement("a");
  downloadLink.href = pngUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Componente visual que expone únicamente el botón de llamada a la acción (CTA)
export default function BudgetReceipt({ loanData, settings }) {
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => downloadBudgetAsImage(loanData, settings)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
        </svg>
        Descargar Ticket / Presupuesto (PNG)
      </button>
    </div>
  );
}