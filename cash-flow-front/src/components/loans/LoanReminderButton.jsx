import Swal from "sweetalert2";

export default function LoanReminderButton({ loan, getNextDueDateFormatted, isOverdue }) {
  const handleSendReminder = () => {
    const clientName = loan.client?.name || loan.clientName || "Estimado cliente";
    const clientPhone = loan.client?.phone || loan.clientPhone || "";
    
    // Calcular saldo pendiente actual
    const totalToPay = loan.totalToPay || 0;
    const totalPaidSoFar = Array.isArray(loan.payments)
      ? loan.payments.reduce((acc, p) => acc + (p.amount || 0), 0)
      : (loan.paidAmount || 0);
    const pendingAmount = Math.max(0, totalToPay - totalPaidSoFar);

    const nextDueDate = getNextDueDateFormatted ? getNextDueDateFormatted(loan) : "N/A";

    // 📝 Mensaje dinámico según si está vencido o próximo a vencer
    let messageText = "";
    if (isOverdue) {
      messageText = `Hola *${clientName}*, te escribimos para recordarte que tenés una *cuota vencida* con fecha límite *${nextDueDate}*. El saldo pendiente actual es de *$${pendingAmount.toLocaleString("es-AR")}*. Por favor, comunicate con nosotros para normalizar tu situación. ¡Muchas gracias!`;
    } else {
      messageText = `Hola *${clientName}*, te escribimos para recordarte que tenés un vencimiento próximo por un monto de *$${pendingAmount.toLocaleString("es-AR")}* con fecha límite el *${nextDueDate}*. ¡Muchas gracias!`;
    }

    const message = encodeURIComponent(messageText);

    if (clientPhone) {
      const cleanPhone = clientPhone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    } else {
      navigator.clipboard.writeText(decodeURIComponent(message));
      Swal.fire({
        icon: "info",
        title: "Mensaje copiado",
        text: `El cliente no tiene un teléfono registrado. El mensaje se copió al portapapeles.`,
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  // Estilos condicionales: Rojo/Alerta si está vencido, Celeste si es un recordatorio normal
  const desktopClasses = isOverdue
    ? "hidden md:flex bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-rose-950/50 cursor-pointer items-center gap-1 animate-pulse"
    : "hidden md:flex bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white border border-sky-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-sky-950/50 cursor-pointer items-center gap-1";

  const mobileClasses = isOverdue
    ? "flex md:hidden bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950/50 cursor-pointer items-center justify-center animate-pulse"
    : "flex md:hidden bg-sky-600 hover:bg-sky-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-950/50 cursor-pointer items-center justify-center";

  const titleText = isOverdue ? "¡Cuota vencida! Enviar aviso de mora" : "Enviar recordatorio de pago";

  return (
    <>
      <button
        type="button"
        onClick={handleSendReminder}
        className={desktopClasses}
        title={titleText}
      >
        {isOverdue ? "⚠️ Aviso Mora" : "💬 Recordatorio"}
      </button>

      <button
        type="button"
        onClick={handleSendReminder}
        className={mobileClasses}
        title={titleText}
      >
        {isOverdue ? "⚠️" : "💬"}
      </button>
    </>
  );
}