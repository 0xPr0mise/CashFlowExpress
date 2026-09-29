import { useState, useEffect } from "react";
import Swal from "sweetalert2"; // <--- Importamos SweetAlert2
import BudgetReceipt from "../../../components/Receipts/BudgetReceipt";
import LoanDisbursementReceipt from "../../../components/Receipts/LoanDisbursementReceipt";

export default function LoanForm({ 
  isOpen, 
  onClose, 
  clients, 
  onLoanCreated, 
  defaultInterestRate = 20 
}) {
  const [form, setForm] = useState({
    clientId: "",
    amount: "",
    interestRate: String(defaultInterestRate),
    installments: "1",
    frequency: "A_TERMINO",
    dueDate: "",
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [calculatedDetails, setCalculatedDetails] = useState(null);
  const [successLoanData, setSuccessLoanData] = useState(null);

  const todayFormatted = new Date().toISOString().split('T')[0];

  const formatDateToLocal = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (defaultInterestRate !== undefined) {
      setForm((prev) => ({ ...prev, interestRate: String(Math.round(defaultInterestRate)) }));
    }
  }, [defaultInterestRate]);

  useEffect(() => {
    const installmentsNum = parseInt(form.installments, 10) || 1;
    
    if (installmentsNum === 1) {
      setForm((prev) => ({ ...prev, frequency: "A_TERMINO" }));
    } else {
      if (form.frequency === "A_TERMINO") {
        setForm((prev) => ({ ...prev, frequency: "MENSUAL" }));
      }
    }

    const today = new Date();
    let targetDate = new Date();

    if (form.frequency === "DIARIO") {
      targetDate.setDate(today.getDate() + 1);
    } else if (form.frequency === "SEMANAL") {
      targetDate.setDate(today.getDate() + 7);
    } else if (form.frequency === "QUINCENAL") {
      targetDate.setDate(today.getDate() + 15);
    } else if (form.frequency === "MENSUAL") {
      targetDate.setMonth(today.getMonth() + 1);
    } else {
      targetDate.setDate(today.getDate() + 30);
    }

    setForm(prev => ({ 
      ...prev, 
      dueDate: targetDate.toISOString().split('T')[0] 
    }));

  }, [form.installments, form.frequency]);

  if (!isOpen) return null;

  const formatThousands = (value) => {
    if (!value && value !== 0) return "";
    const cleanValue = String(value).replace(/\D/g, "");
    if (!cleanValue) return "";
    return Number(cleanValue).toLocaleString("es-AR");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "amount" || name === "interestRate" || name === "installments") {
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue === "" || parseInt(cleanValue, 10) >= 0) {
        setForm({ ...form, [name]: cleanValue });
      }
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const getDaysBetween = () => {
    if (!form.dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(form.dueDate);
    due.setHours(0, 0, 0, 0);
    const timeDiff = due.getTime() - today.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  };

  const currentDaysDiff = getDaysBetween();

  const handleOpenPreview = (e) => {
    e.preventDefault();
    if (!form.clientId || !form.amount || !form.dueDate) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Selecciona un cliente, define el monto y la fecha de vencimiento.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const amount = parseInt(form.amount, 10) || 0;
    const baseInterestRate = parseInt(form.interestRate, 10) || parseInt(defaultInterestRate, 10) || 20;
    const installments = parseInt(form.installments, 10) || 1;
    const frequency = form.frequency;

    let finalInterestRate = baseInterestRate;
    let interestAmount = 0;
    let totalToPay = 0;
    const schedule = [];

    if (installments === 1 || frequency === "A_TERMINO") {
      const dailyRate = baseInterestRate / 30;
      finalInterestRate = Math.round(dailyRate * Math.max(1, currentDaysDiff));
      interestAmount = Math.round(amount * (finalInterestRate / 100));
      totalToPay = amount + interestAmount;

      schedule.push({
        installmentNumber: 1,
        dueDate: form.dueDate,
        capital: amount,
        interest: interestAmount,
        amount: totalToPay
      });
    } else {
      interestAmount = Math.round(amount * (baseInterestRate / 100));
      totalToPay = amount + interestAmount;
      
      const installmentTotal = Math.round(totalToPay / installments);
      const installmentCapital = Math.round(amount / installments);
      const installmentInterest = Math.round(interestAmount / installments);

      const baseDate = new Date(form.dueDate);

      for (let i = 1; i <= installments; i++) {
        let instDate = new Date(baseDate);

        if (frequency === "SEMANAL") {
          instDate.setDate(baseDate.getDate() + (7 * (i - 1)));
        } else if (frequency === "QUINCENAL") {
          instDate.setDate(baseDate.getDate() + (15 * (i - 1)));
        } else if (frequency === "MENSUAL") {
          instDate.setMonth(baseDate.getMonth() + (i - 1));
        } else if (frequency === "DIARIO") {
          instDate.setDate(baseDate.getDate() + (i - 1));
        }

        schedule.push({
          installmentNumber: i,
          dueDate: instDate.toISOString().split('T')[0],
          capital: installmentCapital,
          interest: installmentInterest,
          amount: installmentTotal
        });
      }
    }

    const selectedClient = clients.find((c) => String(c.id) === String(form.clientId));

    setCalculatedDetails({
      client: selectedClient,
      clientId: form.clientId,
      amount,
      interestRate: finalInterestRate,
      installments,
      frequency,
      dueDate: form.dueDate,
      daysDiff: currentDaysDiff,
      interestAmount,
      totalToPay,
      installmentAmount: Math.round(totalToPay / installments),
      schedule,
    });

    setShowPreviewModal(true);
  };

  const handleConfirmLoan = async () => {
    if (!calculatedDetails) return;

    // Reemplazamos window.confirm por SweetAlert2
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se va a otorgar y registrar este préstamo en el sistema.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, otorgar",
      cancelButtonText: "Cancelar",
      background: "#171717", // Neutral-900 para combinar con tu UI
      color: "#ffffff",
      confirmButtonColor: "#dc2626", // Rojo estilo Tailwind (red-600)
      cancelButtonColor: "#404040",   // Neutral-700
      customClass: {
        popup: "border border-neutral-800 rounded-2xl shadow-2xl"
      }
    });

    if (!result.isConfirmed) return;

    onLoanCreated({
      clientId: calculatedDetails.clientId,
      amount: calculatedDetails.amount,
      installments: calculatedDetails.installments,
      frequency: calculatedDetails.frequency,
      interestRate: calculatedDetails.interestRate,
      dueDate: calculatedDetails.dueDate,
      totalToPay: calculatedDetails.totalToPay,
      days: calculatedDetails.daysDiff,
      schedule: calculatedDetails.schedule,
    });

    setSuccessLoanData(calculatedDetails);
    
    setForm({
      clientId: "",
      amount: "",
      interestRate: String(defaultInterestRate),
      installments: "1",
      frequency: "A_TERMINO",
      dueDate: "",
    });
    
    setShowPreviewModal(false);
  };

  const handleCloseSuccessModal = () => {
    setSuccessLoanData(null);
    onClose();
  };

  const installmentsNum = parseInt(form.installments, 10) || 1;

  return (
    <>
      {/* MODAL 1: Formulario principal */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Otorgar Nuevo Préstamo
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors"
            >
              ✕ Cerrar
            </button>
          </div>

          <form onSubmit={handleOpenPreview} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Cliente *
                </label>
                <select
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                >
                  <option value="" className="text-neutral-500">
                    Seleccione un Cliente
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.dni ? `(DNI: ${c.dni})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Monto ($) *
                </label>
                <input
                  type="text"
                  name="amount"
                  placeholder="0"
                  value={formatThousands(form.amount)}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Interés Mensual (%) *
                </label>
                <input
                  type="text"
                  name="interestRate"
                  value={form.interestRate}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Cuotas *
                </label>
                <input
                  type="text"
                  name="installments"
                  value={form.installments}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Frecuencia *
                </label>
                <select
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                >
                  <option value="DIARIO" disabled={installmentsNum === 1}>Diario</option>
                  <option value="SEMANAL" disabled={installmentsNum === 1}>Semanal</option>
                  <option value="QUINCENAL" disabled={installmentsNum === 1}>Quincenal</option>
                  <option value="MENSUAL" disabled={installmentsNum === 1}>Mensual</option>
                  <option value="A_TERMINO" disabled={installmentsNum > 1}>A Término</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {installmentsNum > 1 ? "Fecha 1er Vencimiento *" : "Fecha de Vencimiento *"}
                  </label>
                  <span className="text-xs font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                    Plazo calculado: {currentDaysDiff} días
                  </span>
                </div>
                <input
                  type="date"
                  name="dueDate"
                  min={todayFormatted}
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer scheme-dark"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Previsualizar Préstamo / Presupuesto
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL 2: Previsualización */}
      {showPreviewModal && calculatedDetails && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📋 Previsualización del Préstamo
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer"
              >
                ✕ Volver
              </button>
            </div>

            <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Cliente:</span>
                <span className="text-white font-medium">{calculatedDetails.client?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Monto Solicitado:</span>
                <span className="text-white font-medium">${calculatedDetails.amount.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Plazo / Frecuencia:</span>
                <span className="text-white font-medium">
                  {calculatedDetails.installments} cuota(s) - {calculatedDetails.frequency}
                </span>
              </div>
              <div className="flex justify-between text-amber-400 font-medium">
                <span>Días Calendario Calculados (1er Vto.):</span>
                <span>{calculatedDetails.daysDiff} días</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Tasa de Interés Aplicada:</span>
                <span className="text-white font-medium">{calculatedDetails.interestRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total de Interés:</span>
                <span className="text-green-400 font-medium">${calculatedDetails.interestAmount.toLocaleString("es-AR")}</span>
              </div>
              <div className="border-t border-neutral-800 pt-2 flex justify-between text-base font-bold">
                <span className="text-white">Total a Pagar:</span>
                <span className="text-red-500">${calculatedDetails.totalToPay.toLocaleString("es-AR")}</span>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Desglose de Cuotas (Capital + Interés):
                </span>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {calculatedDetails.schedule.map((inst) => (
                    <div key={inst.installmentNumber} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800 gap-1">
                      <span className="text-neutral-300 font-semibold">
                        Cuota #{inst.installmentNumber} — <span className="text-neutral-400 font-normal">{formatDateToLocal(inst.dueDate)}</span>
                      </span>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-neutral-400">Cap: ${inst.capital.toLocaleString("es-AR")} + Int: ${inst.interest.toLocaleString("es-AR")}</span>
                        <span className="text-amber-400 font-bold">${inst.amount.toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
              >
                ← Editar Datos
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <div className="w-full sm:w-auto">
                  <BudgetReceipt loanData={calculatedDetails} />
                </div>
                <button
                  type="button"
                  onClick={handleConfirmLoan}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer"
                >
                  Confirmar y Otorgar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Éxito y Comprobante de Desembolso */}
      {successLoanData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center space-y-5">
            
            <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-600/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl shadow-lg shadow-emerald-950">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">¡Préstamo Asignado con Éxito!</h3>
              <p className="text-xs text-neutral-400">
                El préstamo se ha registrado correctamente en el sistema y el movimiento de caja fue generado.
              </p>
            </div>

            <div className="bg-black/40 border border-neutral-800 rounded-xl p-3.5 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Cliente:</span>
                <span className="text-white font-semibold">{successLoanData.client?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Monto Entregado:</span>
                <span className="text-emerald-400 font-bold">${successLoanData.amount.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total a Devolver:</span>
                <span className="text-white font-bold">${successLoanData.totalToPay.toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <div className="w-full">
                <LoanDisbursementReceipt loanData={successLoanData} />
              </div>

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
    </>
  );
}