import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";
import { payLoan } from "../../services/loans.service";

// Función utilitaria para generar y descargar el ticket de pago en PNG
function downloadPaymentReceiptAsImage(paymentData, settings) {
  const currency = settings?.currency || "$";
  const rawCompanyName = settings?.companyName || "Cash Flow Express";
  const companyId = settings?.receiptCompanyId || "";
  const headerTitle = "COMPROBANTE DE PAGO";
  const footerNote = settings?.receiptFooterNote || "Conserve este comprobante como constancia.";

  const clientName = paymentData?.client?.name 
    ? paymentData.client.name.replace(/[^a-zA-Z0-9]/g, "_") 
    : "Cliente";
  const fileName = `Pago_Cuota_${paymentData?.installmentNumber}_${clientName}_${new Date().toISOString().slice(0, 10)}.png`;

  const canvas = document.createElement("canvas");
  const width = 580;
  const totalHeight = 720;
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  // Fondo blanco general del ticket
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  const margin = 35;
  let currentY = margin + 20;

  // --- CABECERA ---
  ctx.fillStyle = "#000000";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";

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

  drawTicketRow("FECHA DE PAGO:", formattedDate);
  drawTicketRow("HORA:", formattedTime);
  drawTicketRow("CLIENTE:", paymentData?.client?.name || "Consumidor Final", true);
  drawTicketRow("MÉTODO DE PAGO:", paymentData?.paymentMethod || "EFECTIVO", true);

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

  const amountPaid = Math.round(paymentData?.amountPaid || 0);
  drawItemRow(`Abono Cuota #${paymentData?.installmentNumber || 1}`, `${currency} ${amountPaid.toLocaleString("es-AR")}`, true);
  
  if (paymentData?.note) {
    drawItemRow(`Nota: ${paymentData.note}`, `-`);
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

export default function PaymentModal({ loan, onClose, onPaymentSuccess }) {
  const [schedule, setSchedule] = useState(() => {
    try {
      return typeof loan.schedule === "string" ? JSON.parse(loan.schedule) : (loan.schedule || []);
    } catch (e) {
      return [];
    }
  });

  const [successPaymentData, setSuccessPaymentData] = useState(null);
  const [updatedLoanRef, setUpdatedLoanRef] = useState(null);

  // Función auxiliar para formatear fechas de AAAA-MM-DD a DD/MM/AAAA
  const formatDateToLocal = (dateString) => {
    if (!dateString) return "";
    const cleanDate = dateString.split("T")[0];
    const [year, month, day] = cleanDate.split("-");
    if (!year || !month || !day) return cleanDate;
    return `${day}/${month}/${year}`;
  };

  const pendingInstallments = schedule.filter((inst) => inst.status !== "PAGADO");
  const defaultInstallment = pendingInstallments[0] || schedule[0];

  const [selectedInstallmentNum, setSelectedInstallmentNum] = useState(
    defaultInstallment ? defaultInstallment.installmentNumber : ""
  );
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedInstallmentNum) {
      const inst = schedule.find((i) => i.installmentNumber === Number(selectedInstallmentNum));
      if (inst) {
        const total = inst.amount || 0;
        const paid = inst.paidAmount || 0;
        setAmount(Math.max(0, total - paid).toFixed(2));
      }
    }
  }, [selectedInstallmentNum, schedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Monto inválido",
        text: "Por favor, ingrese un monto válido.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await payLoan(loan.id, { 
        amount: parsedAmount, 
        paymentMethod, 
        note,
        targetInstallmentNumber: Number(selectedInstallmentNum)
      });

      let updatedLoan = response?.loan || loan;

      if (response && response.loan && response.loan.schedule) {
        const updatedSchedule = typeof response.loan.schedule === "string" 
          ? JSON.parse(response.loan.schedule) 
          : response.loan.schedule;
        setSchedule(updatedSchedule);
        updatedLoan = response.loan;
      }

      setUpdatedLoanRef(updatedLoan);
      
      // Lanzamos la pantalla de éxito interna del componente
      setSuccessPaymentData({
        loan: updatedLoan,
        client: loan.client,
        installmentNumber: selectedInstallmentNum,
        amountPaid: parsedAmount,
        paymentMethod,
        note,
        date: new Date().toISOString()
      });

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al registrar el pago en el servidor.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    if (onPaymentSuccess && updatedLoanRef) {
      onPaymentSuccess(updatedLoanRef);
    }
    setSuccessPaymentData(null);
    onClose();
  };

  return ReactDOM.createPortal(
    <>
      {/* MODAL PRINCIPAL DE PAGO */}
      {!successPaymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Cabecera Fija */}
            <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950/50 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Registrar Pago</h3>
                <p className="text-xs text-neutral-400">Cliente: {loan.client?.name || "N/A"}</p>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario con Scroll Interno Seguro y Botones Fijos Abajo */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                
                {/* Historial / Estado detallado de Cuotas */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 max-h-36 overflow-y-auto text-xs space-y-2">
                  <span className="text-neutral-400 font-semibold uppercase tracking-wider block mb-1">Estado de Cuotas:</span>
                  {schedule.length === 0 ? (
                    <p className="text-neutral-500">No hay cronograma detallado.</p>
                  ) : (
                    schedule.map((inst, idx) => {
                      const total = inst.amount || 0;
                      const paid = inst.paidAmount || 0;
                      return (
                        <div key={idx} className="flex justify-between items-center text-neutral-300 border-b border-neutral-900 pb-1.5">
                          <div>
                            <span className="font-bold text-white">Cuota #{inst.installmentNumber}</span>
                            <span className="text-neutral-500 block text-[10px]">Vto: {formatDateToLocal(inst.dueDate)}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                              inst.status === 'PAGADO' ? 'bg-emerald-950 text-emerald-400' :
                              inst.status === 'PARCIAL' ? 'bg-amber-950 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {inst.status || 'PENDIENTE'}
                            </span>
                            <span className="block text-[11px] text-neutral-400">
                              Pagado: ${paid} / Total:${total}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selector de Cuota a Pagar */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Seleccionar Cuota a Abonar</label>
                  <select
                    value={selectedInstallmentNum}
                    onChange={(e) => setSelectedInstallmentNum(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {schedule
                      .filter((inst) => inst.status !== "PAGADO")
                      .map((inst) => {
                        const saldo = (inst.amount || 0) - (inst.paidAmount || 0);
                        return (
                          <option key={inst.installmentNumber} value={inst.installmentNumber}>
                            Cuota #{inst.installmentNumber} — Saldo: ${saldo} ({formatDateToLocal(inst.dueDate)})
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Input de Monto */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Monto a abonar ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors font-semibold text-lg"
                    placeholder="0.00"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Puedes pagar la cuota completa o un monto menor (generará un pago parcial).
                  </span>
                </div>

                {/* Selector de Método de Pago (Limitado a Efectivo y Transferencia) */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  </select>
                </div>

                {/* Nota opcional */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Nota / Observación (Opcional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                    placeholder="Ej: Abona parte de la cuota"
                  />
                </div>

              </div>

              {/* Botones de acción fijos en la parte inferior */}
              <div className="p-5 border-t border-neutral-800 bg-neutral-950/50 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Registrando..." : "Confirmar Pago"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAGO EXITOSO, OPCIÓN DE DESCARGA Y CIERRE */}
      {successPaymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center space-y-5">
            
            <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-600/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl shadow-lg shadow-emerald-950">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">¡Pago Ejecutado con Éxito!</h3>
              <p className="text-xs text-neutral-400">
                El cobro de la cuota se ha registrado correctamente en el sistema.
              </p>
            </div>

            <div className="bg-black/40 border border-neutral-800 rounded-xl p-3.5 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Cliente:</span>
                <span className="text-white font-semibold">{successPaymentData.client?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Cuota Abonada:</span>
                <span className="text-white font-semibold">Cuota #{successPaymentData.installmentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Monto Pagado:</span>
                <span className="text-emerald-400 font-bold">${successPaymentData.amountPaid.toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              {/* Botón directo para descargar el comprobante en PNG */}
              <button
                type="button"
                onClick={() => downloadPaymentReceiptAsImage(successPaymentData)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                Descargar Comprobante de Pago (PNG)
              </button>

              {/* Botón único que avisa al padre y cierra todo de forma limpia */}
              <button
                type="button"
                onClick={handleCloseSuccessModal}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cerrar y Finalizar
              </button>
            </div>

          </div>
        </div>
      )}
    </>,
    document.body
  );
}