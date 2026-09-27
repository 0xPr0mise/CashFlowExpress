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
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          color: "#2c3e50",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
        }}
      >
        Configuración del Sistema
      </h2>

      {saved && (
        <div
          style={{
            background: "#d4edda",
            color: "#155724",
            padding: "10px 15px",
            borderRadius: "6px",
            margin: "15px 0",
          }}
        >
          ¡Configuración guardada exitosamente!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          marginTop: "20px",
        }}
      >
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Nombre de la Empresa / Negocio
          </label>
          <input
            type="text"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Símbolo de Moneda
          </label>
          <input
            type="text"
            name="currency"
            value={form.currency}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Tasa de Interés por Defecto (%)
          </label>
          <input
            type="number"
            name="defaultInterestRate"
            value={form.defaultInterestRate}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            required
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Teléfono de Contacto / Soporte
          </label>
          <input
            type="text"
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: "#2c3e50",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
