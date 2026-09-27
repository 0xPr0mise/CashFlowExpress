import { useState } from "react";

export default function LoanForm({ clients, onLoanCreated }) {
  const [form, setForm] = useState({
    clientId: "",
    amount: "",
    interestRate: "20",
    installments: "10",
    frequency: "MENSUAL"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientId || !form.amount) {
      alert("Selecciona un cliente y define el monto.");
      return;
    }

    const amount = parseFloat(form.amount);
    const interestRate = parseFloat(form.interestRate);
    const installments = parseInt(form.installments);
    const totalToPay = amount + (amount * (interestRate / 100));

    onLoanCreated({
      clientId: form.clientId,
      amount,
      installments,
      frequency: form.frequency,
      totalToPay
    });

    setForm({ clientId: "", amount: "", interestRate: "20", installments: "10", frequency: "MENSUAL" });
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "#f0f4f8", padding: "20px", borderRadius: "8px", marginBottom: "20px", display: "grid", gap: "12px" }}>
      <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Otorgar Nuevo Préstamo</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
        <select name="clientId" value={form.clientId} onChange={handleChange} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
          <option value="">Seleccione un Cliente *</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name} (DNI: {c.dni || "N/A"})</option>
          ))}
        </select>
        <input type="number" name="amount" placeholder="Monto *" value={form.amount} onChange={handleChange} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
        <input type="number" name="interestRate" placeholder="Interés %" value={form.interestRate} onChange={handleChange} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
        <input type="number" name="installments" placeholder="Cuotas" value={form.installments} onChange={handleChange} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
        <select name="frequency" value={form.frequency} onChange={handleChange} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
          <option value="DIARIO">Diario</option>
          <option value="SEMANAL">Semanal</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="MENSUAL">Mensual</option>
        </select>
      </div>
      <button type="submit" style={{ background: "#007bff", color: "white", padding: "10px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
        Registrar Préstamo
      </button>
    </form>
  );
}