import { useState, useEffect } from "react";
import { getSettings, saveSetting } from "../../services/settings.service";
import BudgetReceipt from "../../components/Receipts/BudgetReceipt";
import LoanDisbursementReceipt from "../../components/Receipts/LoanDisbursementReceipt";
import PaymentReceipt from "../../components/Receipts/PaymentReceipt";

export default function SettingsPage() {
  const [form, setForm] = useState({
    companyName: "Cash Flow Express",
    currency: "$",
    defaultInterestRate: "20",
    maxLoanTermDays: "30",
    lateFeePercentage: "2",
    contactEmail: "",
    contactPhone: "",
    dateFormat: "DD/MM/YYYY",
    receiptHeaderTitle: "COMPROBANTE DE OPERACIÓN",
    receiptCompanyId: "",
    receiptFooterNote:
      "Gracias por confiar en nosotros. Conserve este comprobante.",
    receiptStyle: "MODERN",
    receiptShowLogo: "true",
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewType, setPreviewType] = useState(null); // 'budget' | 'loan' | 'payment' | null

  useEffect(() => {
    getSettings()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const settingsObj = {};
          data.forEach((item) => {
            settingsObj[item.key] = item.value;
          });
          setForm((prev) => ({ ...prev, ...settingsObj }));
        }
      })
      .catch((err) => console.error("Error al cargar configuración:", err));
  }, []);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox"
        ? e.target.checked.toString()
        : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const [key, value] of Object.entries(form)) {
        await saveSetting(key, value);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      alert("Error al guardar la configuración en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans relative">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
              Configuración General del Sistema
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Parámetros globales del negocio, políticas de riesgo y plantillas
              de recibos.
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Preferencias Activas
          </div>
        </div>

        {/* Notificación */}
        {saved && (
          <div className="bg-emerald-950/60 border border-emerald-900/50 text-emerald-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-xl backdrop-blur-sm">
            ¡Configuración y plantillas de recibos guardadas exitosamente!
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identidad */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
            <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
              Identidad Comercial y Regional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Símbolo de Moneda *
                </label>
                <input
                  type="text"
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  required
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* Políticas de Crédito */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
            <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
              Políticas de Crédito y Tasas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Interés Predeterminado (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="defaultInterestRate"
                  value={form.defaultInterestRate}
                  onChange={handleChange}
                  required
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Plazo Máximo (Días)
                </label>
                <input
                  type="number"
                  name="maxLoanTermDays"
                  value={form.maxLoanTermDays}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Mora Diaria (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="lateFeePercentage"
                  value={form.lateFeePercentage}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* Configuración de Recibos */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
            <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
              Diseño y Textos de Recibos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Título del Recibo
                </label>
                <input
                  type="text"
                  name="receiptHeaderTitle"
                  value={form.receiptHeaderTitle}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Identificación Fiscal (CUIT / RUT)
                </label>
                <input
                  type="text"
                  name="receiptCompanyId"
                  value={form.receiptCompanyId}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Nota al Pie del Recibo
                </label>
                <textarea
                  name="receiptFooterNote"
                  rows="2"
                  value={form.receiptFooterNote}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
            </div>

            {/* Botones de Previsualización */}
            <div className="pt-3 border-t border-neutral-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Previsualizar Plantillas en Vivo
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewType("budget")}
                  className="bg-black hover:bg-neutral-800 border border-neutral-800 p-3.5 rounded-xl text-left transition-all cursor-pointer"
                >
                  <span className="block text-xs font-bold text-white">
                    Presupuesto
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Ver cotización
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewType("loan")}
                  className="bg-black hover:bg-neutral-800 border border-neutral-800 p-3.5 rounded-xl text-left transition-all cursor-pointer"
                >
                  <span className="block text-xs font-bold text-white">
                    Entrega Préstamo
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Ver comprobante de salida
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewType("payment")}
                  className="bg-black hover:bg-neutral-800 border border-neutral-800 p-3.5 rounded-xl text-left transition-all cursor-pointer"
                >
                  <span className="block text-xs font-bold text-white">
                    Pago Parcial
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Ver ticket de abono
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50"
            >
              {loading
                ? "Guardando Cambios..."
                : "Guardar Toda la Configuración"}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL DE PREVISUALIZACIÓN DE RECIBOS */}
      {previewType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="relative w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Vista Previa de Comprobante
              </span>
              <button
                onClick={() => setPreviewType(null)}
                className="text-neutral-400 hover:text-white text-sm font-bold px-2 py-1 bg-neutral-800 rounded-lg cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Renderizado Dinámico del Recibo Seleccionado */}
            <div className="max-h-[80vh] overflow-y-auto">
              {previewType === "budget" && <BudgetReceipt settings={form} />}
              {previewType === "loan" && (
                <LoanDisbursementReceipt settings={form} />
              )}
              {previewType === "payment" && <PaymentReceipt settings={form} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
