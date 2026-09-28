import { useState, useEffect } from "react";
import { getSettings, saveSetting } from "../../services/settings.service";
import BudgetReceipt from "../../components/Receipts/BudgetReceipt";
import LoanDisbursementReceipt from "../../components/Receipts/LoanDisbursementReceipt";
import PaymentReceipt from "../../components/Receipts/PaymentReceipt";

// Componentes modularizados
import SettingsNav from "./components/SettingsNav";
import GeneralSettingsTab from "./components/GeneralSettingsTab";
import ReceiptSettingsTab from "./components/ReceiptSettingsTab";
import BackupSettingsTab from "./components/BackupSettingsTab";
import AboutSettingsTab from "./components/AboutSettingsTab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'receipts' | 'backup' | 'about'
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

        {/* Notificación de guardado */}
        {saved && (
          <div className="bg-emerald-950/60 border border-emerald-900/50 text-emerald-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-xl backdrop-blur-sm">
            ¡Configuración y plantillas de recibos guardadas exitosamente!
          </div>
        )}

        {/* Tarjetas de Navegación SPA */}
        <SettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Contenido Dinámico según la Pestaña Activa */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "general" && (
            <GeneralSettingsTab form={form} handleChange={handleChange} />
          )}

          {activeTab === "receipts" && (
            <ReceiptSettingsTab
              form={form}
              handleChange={handleChange}
              setPreviewType={setPreviewType}
            />
          )}

          {activeTab === "backup" && <BackupSettingsTab />}

          {activeTab === "about" && <AboutSettingsTab />}

          {/* Botón de Guardado Global (visible solo en pestañas editables) */}
          {(activeTab === "general" || activeTab === "receipts") && (
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
          )}
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
                type="button"
                onClick={() => setPreviewType(null)}
                className="text-neutral-400 hover:text-white text-sm font-bold px-2 py-1 bg-neutral-800 rounded-lg cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

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
