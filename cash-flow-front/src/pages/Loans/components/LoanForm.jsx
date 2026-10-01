import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import LoanPreviewModal from "./LoanPreviewModal";
import LoanSuccessModal from "./LoanSuccessModal";
import LoanCalculationOptions from "./LoanCalculationOptions";
import { calculateLoanDetails, getDaysBetween } from "../utils/loanCalculator";

export default function LoanForm({ 
  isOpen, 
  onClose, 
  clients, 
  onLoanCreated, 
  defaultInterestRate = 20,
  initialData = null 
}) {
  const [form, setForm] = useState({
    clientId: "",
    amount: "",
    interestRate: String(defaultInterestRate),
    installments: "1",
    frequency: "A_TERMINO",
    paymentMethod: "EFECTIVO",
    dueDate: "",
    remainderType: "proporcional", 
    remainderRate: "20",
    multiInstallmentCalc: "plena",   
    subsequentCalcType: "plena",    
    subsequentRate: "20",
    notes: "",
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [calculatedDetails, setCalculatedDetails] = useState(null);
  const [successLoanData, setSuccessLoanData] = useState(null);

  const todayFormatted = new Date().toISOString().split('T')[0];

  // Sincronizar tasa por defecto si no hay datos iniciales
  useEffect(() => {
    if (defaultInterestRate !== undefined && !initialData) {
      setForm((prev) => ({ ...prev, interestRate: String(Math.round(defaultInterestRate)) }));
    }
  }, [defaultInterestRate, initialData]);

  // Precargar datos si viene de una refinanciación
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        clientId: initialData.clientId || "",
        amount: initialData.amount ? String(initialData.amount) : "",
        interestRate: initialData.interestRate ? String(initialData.interestRate) : String(defaultInterestRate),
        notes: initialData.notes || "",
      }));
    }
  }, [initialData, defaultInterestRate]);

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
    
    if (["amount", "interestRate", "installments", "remainderRate", "subsequentRate"].includes(name)) {
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue === "" || parseInt(cleanValue, 10) >= 0) {
        setForm({ ...form, [name]: cleanValue });
      }
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const currentDaysDiff = getDaysBetween(new Date(), form.dueDate);

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

    const details = calculateLoanDetails(form, clients, defaultInterestRate);
    setCalculatedDetails(details);
    setShowPreviewModal(true);
  };

  const handleConfirmLoan = async () => {
    if (!calculatedDetails) return;

    const isRefinancing = !!initialData;

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: isRefinancing 
        ? "Se va a registrar la refinanciación del préstamo sin afectar la caja operativa."
        : `Se va a otorgar y registrar este préstamo por ${calculatedDetails.paymentMethod}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, otorgar",
      cancelButtonText: "Cancelar",
      background: "#171717",
      color: "#ffffff",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#404040",
      customClass: { popup: "border border-neutral-800 rounded-2xl shadow-2xl" }
    });

    if (!result.isConfirmed) return;

    // 🚀 Enviamos las propiedades clave para que el back sepa manejar la refinanciación
    onLoanCreated({
      clientId: calculatedDetails.clientId,
      amount: calculatedDetails.amount,
      installments: calculatedDetails.installments,
      frequency: calculatedDetails.frequency,
      paymentMethod: calculatedDetails.paymentMethod,
      interestRate: calculatedDetails.interestRate,
      dueDate: calculatedDetails.dueDate,
      totalToPay: calculatedDetails.totalToPay,
      days: calculatedDetails.daysDiff,
      schedule: calculatedDetails.schedule,
      notes: form.notes || "",
      isRefinancing: isRefinancing,
      oldLoanId: initialData?.id || null, 
    });

    setSuccessLoanData(calculatedDetails);
    setForm({
      clientId: "",
      amount: "",
      interestRate: String(defaultInterestRate),
      installments: "1",
      frequency: "A_TERMINO",
      paymentMethod: "EFECTIVO",
      dueDate: "",
      remainderType: "proporcional",
      remainderRate: "20",
      multiInstallmentCalc: "plena",
      subsequentCalcType: "plena",
      subsequentRate: "20",
      notes: "",
    });
    setShowPreviewModal(false);
  };

  const installmentsNum = parseInt(form.installments, 10) || 1;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {initialData ? "🔄 Refinanciar Préstamo (Nuevo Crédito)" : "Otorgar Nuevo Préstamo"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          <form onSubmit={handleOpenPreview} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Cliente */}
              <div className="sm:col-span-2 w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Cliente *</label>
                <select
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="" className="text-neutral-500">Seleccione un Cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.dni ? `(DNI: ${c.dni})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div className="w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Monto ($) *</label>
                <input
                  type="text"
                  name="amount"
                  placeholder="0"
                  value={formatThousands(form.amount)}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Interés Mensual */}
              <div className="w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Interés Mensual (%) *</label>
                <input
                  type="text"
                  name="interestRate"
                  value={form.interestRate}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Forma de Entrega */}
              <div className="w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Forma de Entrega *</label>
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                </select>
              </div>

              {/* Cuotas */}
              <div className="w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Cuotas *</label>
                <input
                  type="text"
                  name="installments"
                  value={form.installments}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Frecuencia */}
              <div className="w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Frecuencia *</label>
                <select
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="DIARIO" disabled={installmentsNum === 1}>Diario</option>
                  <option value="SEMANAL" disabled={installmentsNum === 1}>Semanal</option>
                  <option value="QUINCENAL" disabled={installmentsNum === 1}>Quincenal</option>
                  <option value="MENSUAL" disabled={installmentsNum === 1}>Mensual</option>
                  <option value="A_TERMINO" disabled={installmentsNum > 1}>A Término</option>
                </select>
              </div>

              {/* Fecha de Vencimiento */}
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {installmentsNum > 1 ? "Fecha 1er Vencimiento *" : "Fecha de Vencimiento *"}
                  </label>
                  <span className="text-xs font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                    {currentDaysDiff} días
                  </span>
                </div>
                <input
                  type="date"
                  name="dueDate"
                  min={todayFormatted}
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 cursor-pointer scheme-dark"
                />
              </div>

              {/* Notas / Historial */}
              <div className="sm:col-span-2 w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Notas / Historial</label>
                <textarea
                  name="notes"
                  rows="2"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Detalles adicionales o motivo de refinanciación..."
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Componente Modular de Opciones de Cálculo Avanzado */}
              <LoanCalculationOptions
                form={form}
                onChange={handleChange}
                currentDaysDiff={currentDaysDiff}
                installmentsNum={installmentsNum}
              />

            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-5 py-2.5 rounded-xl text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Previsualizar Préstamo
              </button>
            </div>
          </form>
        </div>
      </div>

      <LoanPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onBack={() => setShowPreviewModal(false)}
        onConfirm={handleConfirmLoan}
        calculatedDetails={calculatedDetails}
        form={form}
      />

      <LoanSuccessModal
        isOpen={!!successLoanData}
        successLoanData={successLoanData}
        onClose={() => {
          setSuccessLoanData(null);
          onClose();
        }}
      />
    </>
  );
}