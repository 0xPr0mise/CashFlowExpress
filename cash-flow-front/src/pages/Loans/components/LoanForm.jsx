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
  loans = [], 
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
    dailyDaysCount: "24",
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

  // Manejo automático de cuotas y fechas según frecuencia
  useEffect(() => {
    const installmentsNum = parseInt(form.installments, 10) || 1;
    
    if (form.frequency === "DIARIO") {
      const totalDays = parseInt(form.dailyDaysCount, 10) || 24;
      setForm(prev => ({ ...prev, installments: String(totalDays) }));
    } else if (installmentsNum === 1) {
      setForm((prev) => ({ ...prev, frequency: "A_TERMINO" }));
    } else {
      if (form.frequency === "A_TERMINO") {
        setForm((prev) => ({ ...prev, frequency: "MENSUAL" }));
      }
    }

    const today = new Date();
    let targetDate = new Date();

    if (form.frequency === "DIARIO") {
      // El vencimiento en diario sí o sí es a 1 día (ajustando si cae domingo)
      targetDate.setDate(today.getDate() + 1);
      if (targetDate.getDay() === 0) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
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

  }, [form.installments, form.frequency, form.dailyDaysCount]);

  if (!isOpen) return null;

  const selectedClientHasBadDebt = form.clientId 
    ? loans.some((loan) => loan.clientId === form.clientId && loan.status === "INCOBRABLE")
    : false;

  const selectedClientHasRefinanced = form.clientId 
    ? loans.some((loan) => loan.clientId === form.clientId && loan.status === "REFINANCIADO")
    : false;

  const formatThousands = (value) => {
    if (!value && value !== 0) return "";
    const cleanValue = String(value).replace(/\D/g, "");
    if (!cleanValue) return "";
    return Number(cleanValue).toLocaleString("es-AR");
  };

  // Función para calcular los días hábiles hasta fin de mes (excluyendo domingos)
  const handleSetEndOfMonthDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    let businessDaysCount = 0;
    let curr = new Date(today);
    curr.setDate(curr.getDate() + 1);

    while (curr <= lastDayOfMonth) {
      if (curr.getDay() !== 0) {
        businessDaysCount++;
      }
      curr.setDate(curr.getDate() + 1);
    }

    const finalDays = Math.max(1, businessDaysCount).toString();
    setForm(prev => ({
      ...prev,
      dailyDaysCount: finalDays,
      installments: finalDays
    }));
  };

  // Función para calcular días hábiles según una fecha tope elegida en el calendario
  const handleCustomEndDateChange = (e) => {
    const selectedDateStr = e.target.value;
    if (!selectedDateStr) return;

    const endDate = new Date(selectedDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate <= today) {
      Swal.fire({
        icon: "warning",
        title: "Fecha inválida",
        text: "La fecha final debe ser posterior al día de hoy.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    let businessDaysCount = 0;
    let curr = new Date(today);
    curr.setDate(curr.getDate() + 1);

    while (curr <= endDate) {
      if (curr.getDay() !== 0) {
        businessDaysCount++;
      }
      curr.setDate(curr.getDate() + 1);
    }

    const finalDays = Math.max(1, businessDaysCount).toString();
    setForm(prev => ({
      ...prev,
      dailyDaysCount: finalDays,
      installments: finalDays
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (["amount", "interestRate", "installments", "dailyDaysCount", "remainderRate", "subsequentRate"].includes(name)) {
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue === "" || parseInt(cleanValue, 10) >= 0) {
        if (name === "dailyDaysCount") {
          setForm({ ...form, dailyDaysCount: cleanValue, installments: cleanValue });
          return;
        }
        setForm({ ...form, [name]: cleanValue });
      }
      return;
    }

    if (name === "frequency" && value === "DIARIO") {
      setForm({ ...form, frequency: value, installments: form.dailyDaysCount });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const areBasicFieldsComplete = form.clientId && form.amount && form.interestRate && form.paymentMethod && form.frequency;

  const currentDaysDiff = getDaysBetween(new Date(), form.dueDate);

  const handleOpenPreview = (e) => {
    e.preventDefault();
    if (!areBasicFieldsComplete || !form.dueDate) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor completa todos los campos obligatorios.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    if (selectedClientHasBadDebt) {
      Swal.fire({
        icon: "error",
        title: "¡CRÉDITO DENEGADO!",
        text: "Este cliente posee antecedentes de préstamos INCOBRABLES. No se le puede otorgar ningún crédito.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#dc2626",
        customClass: { popup: "border-2 border-rose-600 rounded-2xl shadow-2xl shadow-rose-950" }
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
      dailyDaysCount: "24",
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
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col">
          
          {/* Cabecera */}
          <div className="flex justify-between items-center border-b border-neutral-800 pb-3 flex-shrink-0">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
              {initialData ? "🔄 Refinanciar Préstamo" : "Otorgar Nuevo Préstamo"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-xs font-bold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl cursor-pointer transition-colors"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Formulario con Scroll interno */}
          <form onSubmit={handleOpenPreview} className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* 1. Cliente */}
              <div className="sm:col-span-2 w-full">
                <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Cliente *</label>
                <select
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="" className="text-neutral-500">Seleccione un Cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.dni ? `(DNI: ${c.dni})` : ""}
                    </option>
                  ))}
                </select>

                {selectedClientHasBadDebt && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border-2 border-rose-600 text-rose-200 text-xs font-bold flex items-start sm:items-center gap-3 animate-pulse shadow-lg shadow-rose-950">
                    <span className="text-lg sm:text-xl flex-shrink-0">🚨</span>
                    <div>
                      <p className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">¡CLIENTE BLOQUEADO POR ANTECEDENTES!</p>
                      <p className="text-rose-300 font-normal mt-0.5 text-[11px] sm:text-xs">Posee un préstamo <strong className="text-white underline">INCOBRABLE</strong>. El sistema denegará cualquier crédito.</p>
                    </div>
                  </div>
                )}

                {!selectedClientHasBadDebt && selectedClientHasRefinanced && (
                  <div className="mt-3 p-3 rounded-xl bg-purple-950/60 border border-purple-600 text-purple-200 text-xs font-medium flex items-start sm:items-center gap-3 shadow-lg">
                    <span className="text-lg sm:text-xl flex-shrink-0">🟣</span>
                    <div>
                      <p className="font-bold text-white text-xs uppercase tracking-wide">Aviso de Refinanciación previa</p>
                      <p className="text-purple-300 font-normal mt-0.5 text-[11px] sm:text-xs">Este cliente cuenta con antecedentes refinanciados. Se permite continuar.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Monto */}
              <div className="w-full">
                <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Monto ($) *</label>
                <input
                  type="text"
                  name="amount"
                  placeholder="0"
                  value={formatThousands(form.amount)}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* 3. Interés Mensual */}
              <div className="w-full">
                <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Interés Mensual (%) *</label>
                <input
                  type="text"
                  name="interestRate"
                  value={form.interestRate}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* 4. Forma de Entrega */}
              <div className="w-full">
                <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Forma de Entrega *</label>
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

              {/* 5. Frecuencia */}
              <div className="w-full">
                <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Frecuencia *</label>
                <select
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="DIARIO">Diario</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                  <option value="A_TERMINO">A Término</option>
                </select>
              </div>

              {/* CAMPOS CONDICIONALES */}
              {areBasicFieldsComplete && (
                <>
                  {/* Si es DIARIO: Pide días, botón fin de mes y selector de calendario personalizado */}
                  {form.frequency === "DIARIO" && (
                    <div className="w-full sm:col-span-2 bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl space-y-3 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-red-400">
                          Cantidad de Días / Cuotas Diarias *
                        </label>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={handleSetEndOfMonthDays}
                            className="flex-1 sm:flex-none bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-neutral-700"
                          >
                            📅 Fin de Mes
                          </button>
                          <div className="relative flex-1 sm:flex-none">
                            <input
                              type="date"
                              onChange={handleCustomEndDateChange}
                              title="Elegir fecha final en calendario"
                              className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-neutral-700 scheme-dark"
                            />
                          </div>
                        </div>
                      </div>

                      <input
                        type="text"
                        name="dailyDaysCount"
                        value={form.dailyDaysCount}
                        onChange={handleChange}
                        placeholder="Ej. 24"
                        className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 font-bold"
                      />
                      <p className="text-[11px] text-neutral-500">
                        Ajusta las cuotas hábiles (excluyendo domingos). El 1er vencimiento es obligatorio a 1 día.
                      </p>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                            Fecha 1er Vencimiento * (Fijo a 1 día)
                          </label>
                          <span className="text-[10px] sm:text-xs font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                            {currentDaysDiff} días
                          </span>
                        </div>
                        <input
                          type="date"
                          name="dueDate"
                          value={form.dueDate}
                          disabled
                          className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-400 cursor-not-allowed scheme-dark"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Notas / Historial</label>
                        <textarea
                          name="notes"
                          rows="2"
                          value={form.notes}
                          onChange={handleChange}
                          placeholder="Detalles adicionales o motivo de refinanciación..."
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Si es SEMANAL / QUINCENAL / MENSUAL / A_TÉRMINO */}
                  {form.frequency !== "DIARIO" && (
                    <>
                      <div className="w-full">
                        <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Cuotas *</label>
                        <input
                          type="text"
                          name="installments"
                          value={form.installments}
                          onChange={handleChange}
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                            {installmentsNum > 1 ? "Fecha 1er Vto. *" : "Fecha Vencimiento *"}
                          </label>
                          <span className="text-[10px] sm:text-xs font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                            {currentDaysDiff} días
                          </span>
                        </div>
                        <input
                          type="date"
                          name="dueDate"
                          value={form.dueDate}
                          onChange={handleChange}
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 cursor-pointer scheme-dark"
                        />
                      </div>

                      <div className="sm:col-span-2 w-full">
                        <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Notas / Historial</label>
                        <textarea
                          name="notes"
                          rows="2"
                          value={form.notes}
                          onChange={handleChange}
                          placeholder="Detalles adicionales o motivo de refinanciación..."
                          className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 resize-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <LoanCalculationOptions
                          form={form}
                          onChange={handleChange}
                          currentDaysDiff={currentDaysDiff}
                          installmentsNum={installmentsNum}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

            </div>

            {/* Footer de Botones */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-neutral-800 sticky bottom-0 bg-neutral-900/95 backdrop-blur-sm pb-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-300 font-semibold px-5 py-2.5 rounded-xl text-sm cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              {areBasicFieldsComplete && (
                <button
                  type="submit"
                  disabled={selectedClientHasBadDebt}
                  className={`w-full sm:w-auto font-semibold px-6 py-2.5 rounded-xl text-sm shadow-lg transition-all ${
                    selectedClientHasBadDebt 
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50 shadow-none border border-neutral-700" 
                      : "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-950/50 cursor-pointer"
                  }`}
                >
                  {selectedClientHasBadDebt ? "Cliente Bloqueado ❌" : "Previsualizar Préstamo"}
                </button>
              )}
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