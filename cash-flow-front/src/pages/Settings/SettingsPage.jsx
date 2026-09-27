import { useState, useEffect } from "react";
import { getSettings, saveSetting } from "../../services/settings.service";

export default function SettingsPage() {
  const [form, setForm] = useState({
    companyName: "Cash Flow Express",
    currency: "$",
    defaultInterestRate: "20",
    contactPhone: "",
  });
  const [saved, setSaved] = useState(false);

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
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      for (const [key, value] of Object.entries(form)) {
        await saveSetting(key, value);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar la configuración");
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            Configuración del Sistema
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Parámetros globales del negocio, monedas y tasas predeterminadas.
          </p>
        </div>

        {/* Notificación de Guardado */}
        {saved && (
          <div className="bg-emerald-950/60 border border-emerald-900/50 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg animate-fadeIn">
            <svg
              className="w-5 h-5 text-emerald-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            ¡Configuración guardada exitosamente!
          </div>
        )}

        {/* Formulario */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Nombre de la Empresa / Negocio
              </label>
              <input
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Símbolo de Moneda
              </label>
              <input
                type="text"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Tasa de Interés por Defecto (%)
              </label>
              <input
                type="number"
                name="defaultInterestRate"
                value={form.defaultInterestRate}
                onChange={handleChange}
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Teléfono de Contacto / Soporte
              </label>
              <input
                type="text"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
