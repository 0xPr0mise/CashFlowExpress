// Función utilitaria para generar y descargar el ticket en formato factura mediante Canvas 2D
export function downloadBudgetAsImage(loanData, settings) {
  const currency = settings?.currency || "$";
  const rawCompanyName = settings?.companyName || "Cash Flow Express V.2";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = "PRESUPUESTO";
  const footerNote = settings?.receiptFooterNote || "Gracias por su preferencia.";

  const clientName = loanData?.client?.name 
    ? loanData.client.name.replace(/[^a-zA-Z0-9]/g, "_") 
    : "Cliente";
  const fileName = `Ticket_${clientName}_${new Date().toISOString().slice(0, 10)}.png`;

  // Determinamos altura dinámica del canvas en base a si hay cuotas múltiples o no
  const installments = loanData?.installments || 1;
  const hasSchedule = installments > 1 && loanData?.schedule && loanData.schedule.length > 0;

  // Altura base + espacio adicional por cada cuota si existe cronograma
  const baseHeight = hasSchedule ? 720 : 640;
  const scheduleHeight = hasSchedule ? loanData.schedule.length * 28 : 0;
  const totalHeight = Math.max(1000, baseHeight + scheduleHeight);

  // 1. Configuramos dimensiones tipo ticket vertical / factura estrecha (600px para evitar cortes)
  const canvas = document.createElement("canvas");
  const width = 600;
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  // Fondo blanco general del ticket
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  const margin = 35;
  let currentY = margin + 15;

  // --- CABECERA: ARTE ASCII EN NEGRITA PARA EL LOGO (Con asteriscos continuos y color negro) ---
  ctx.fillStyle = "#000000";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";

  const companyAscii = [
    "****************************************************",
    `*      *** ** ${rawCompanyName.toUpperCase()} ** ***      *`,
    "****************************************************"
  ];

  companyAscii.forEach((line) => {
    ctx.fillText(line, width / 2, currentY);
    currentY += 20;
  });

  currentY += 8;

  if (companyId) {
    ctx.font = "12px monospace";
    ctx.fillStyle = "#000000";
    ctx.fillText(`CUIT / RUT: ${companyId}`, width / 2, currentY);
    currentY += 22;
  }

  // Título del comprobante en negro total
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#000000";
  ctx.fillText(headerTitle, width / 2, currentY);
  currentY += 22;

  // Función estricta para asegurar línea continua pura de color negro
  const drawSolidLine = (y) => {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]); // Asegura que no haya segmentos discontinuos
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(width - margin, y);
    ctx.stroke();
  };

  drawSolidLine(currentY);
  currentY += 20;

  // --- DATOS GENERALES (Estilo factura) ---
  const drawTicketRow = (label, value, isBold = false) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#000000";
    ctx.font = "13px sans-serif";
    ctx.fillText(label, margin, currentY);

    ctx.textAlign = "right";
    ctx.fillStyle = "#000000";
    ctx.font = isBold ? "bold 13px sans-serif" : "13px sans-serif";
    ctx.fillText(value, width - margin, currentY);

    currentY += 22;
  };

  // Formateadores estrictos para Fecha (DD/MM/AAAA) y Hora (24hs + "hs.")
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

  drawTicketRow("FECHA:", formattedDate);
  drawTicketRow("HORA:", formattedTime);
  drawTicketRow("CLIENTE:", loanData?.client?.name || "Consumidor Final", true);
  drawTicketRow("VALIDEZ:", "Sólo por el día de la fecha");

  currentY += 10;
  drawSolidLine(currentY);
  currentY += 25;

  // --- DETALLE DE ÍTEMS / CONCEPTOS ---
  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("DESCRIPCIÓN", margin, currentY);
  ctx.textAlign = "right";
  ctx.fillText("SUBTOTAL", width - margin, currentY);
  currentY += 18;

  drawSolidLine(currentY);
  currentY += 25;

  const drawItemRow = (desc, val) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#000000";
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

  drawItemRow(`Capital Solicitado`, `${currency} ${amount.toLocaleString("es-AR")}`);
  drawItemRow(`Plazo: ${installments} cuota(s) [${loanData?.frequency || "Única"}]`, `-`);

  if (loanData?.frequency === "A_TERMINO" || loanData?.frequency === "UNICA" || installments === 1) {
    const days = loanData?.daysDiff || loanData?.termDays || 0;
    if (days > 0) {
      drawItemRow(`Plazo Estimado (${days} días)`, `-`);
    }
  }

  drawItemRow(`Interés Aplicado (${loanData?.interestRate || 0}%)`, `${currency} ${interestAmt.toLocaleString("es-AR")}`);

  currentY += 5;
  drawSolidLine(currentY);
  currentY += 25;

  // --- TOTALES FINALES ---
  ctx.textAlign = "left";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("TOTAL A PAGAR:", margin, currentY);

  ctx.textAlign = "right";
  ctx.fillStyle = "#000000";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(`${currency} ${total.toLocaleString("es-AR")}`, width - margin, currentY);

  currentY += 15;
  drawSolidLine(currentY);
  currentY += 20;

  // --- VENCIMIENTOS / CRONOGRAMA (UBICADO INMEDIATAMENTE ABAJO DEL TOTAL) ---
  if (hasSchedule) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("CRONOGRAMA DE VENCIMIENTOS:", margin, currentY);
    currentY += 20;

    loanData.schedule.forEach((inst) => {
      const instNum = inst.installmentNumber;

      let readableDueDate = inst.dueDate;
      if (inst.dueDate && inst.dueDate.includes("-")) {
        const [yyyy, mm, dd] = inst.dueDate.split("-");
        readableDueDate = `${dd}/${mm}/${yyyy}`;
      }

      const instAmount = Math.round(inst.amount);

      ctx.textAlign = "left";
      ctx.fillStyle = "#000000";
      ctx.font = "11px sans-serif";
      ctx.fillText(`Cuota #${instNum} — Venc: ${readableDueDate}`, margin, currentY);

      ctx.textAlign = "right";
      ctx.fillStyle = "#000000";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`${currency} ${instAmount.toLocaleString("es-AR")}`, width - margin, currentY);

      currentY += 22;
    });

    currentY += 5;
    drawSolidLine(currentY);
    currentY += 25;
  } else {
    // Extracción inteligente de la fecha de vencimiento única (prioriza firstDueDate, dueDate o el primer elemento del schedule si existiera)
    let rawDueDate = loanData?.firstDueDate || loanData?.dueDate || (loanData?.schedule?.[0]?.dueDate);
    let formattedDueDate = "No especificada";

    if (rawDueDate) {
      if (typeof rawDueDate === "string" && rawDueDate.includes("-")) {
        // Formato YYYY-MM-DD
        const parts = rawDueDate.split("T")[0].split("-");
        if (parts.length === 3) {
          formattedDueDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
          formattedDueDate = rawDueDate;
        }
      } else {
        formattedDueDate = rawDueDate;
      }
    } else {
      // Si no hay fecha explícita pero hay días de plazo, la calculamos a partir de hoy
      const days = loanData?.daysDiff || loanData?.termDays || 0;
      if (days > 0) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + Number(days));
        formattedDueDate = futureDate.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      }
    }
    
    ctx.textAlign = "left";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("FECHA DE VENCIMIENTO:", margin, currentY);
    
    ctx.textAlign = "right";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(formattedDueDate, width - margin, currentY);

    currentY += 25;
    drawSolidLine(currentY);
    currentY += 25;
  }

  // --- PIE DEL TICKET ---
  ctx.textAlign = "center";
  ctx.fillStyle = "#000000";
  ctx.font = "12px sans-serif";
  ctx.fillText(footerNote, width / 2, currentY);
  currentY += 20;
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

// Componente visual que expone únicamente el botón de llamada a la acción (CTA) con diseño verde
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