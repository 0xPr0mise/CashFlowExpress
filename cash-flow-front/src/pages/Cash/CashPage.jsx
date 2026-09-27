import { useState, useEffect } from "react";
import {
  getCashMovements,
  getCashBalance,
  createCashMovement,
} from "../../services/cash.service";

export default function CashPage() {
  const [movements, setMovements] = useState([]);
  const [balanceData, setBalanceData] = useState({
    balance: 0,
    totalMovements: 0,
  });
  const [form, setForm] = useState({
    type: "INGRESO",
    category: "EXTRA",
    amount: "",
    description: "",
  });

  const loadCashData = async () => {
    try {
      const [movsData, balData] = await Promise.all([
        getCashMovements(),
        getCashBalance(),
      ]);
      setMovements(movsData);
      setBalanceData(balData);
    } catch (error) {
      console.error("Error al cargar datos de caja:", error);
    }
  };

  useEffect(() => {
    loadCashData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCashMovement({
        ...form,
        amount: parseFloat(form.amount),
      });
      setForm({
        type: "INGRESO",
        category: "EXTRA",
        amount: "",
        description: "",
      });
      loadCashData();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      alert("Error al registrar el movimiento");
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1000px",
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
        Gestión de Caja
      </h2>

      {/* Tarjeta de Balance */}
      <div
        style={{
          background: balanceData.balance >= 0 ? "#d4edda" : "#f8d7da",
          color: balanceData.balance >= 0 ? "#155724" : "#721c24",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px 0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
          Balance Actual en Caja
        </h3>
        <p
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            margin: "10px 0 0 0",
          }}
        >
          ${balanceData.balance.toFixed(2)}
        </p>
      </div>

      {/* Formulario de Registro Manual */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#333" }}>
          Registrar Movimiento Manual
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Tipo
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Categoría
            </label>
            <input
              type="text"
              placeholder="Ej. Gasto oficina, Retiro..."
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Monto ($)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Descripción
            </label>
            <input
              type="text"
              placeholder="Detalle opcional..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          style={{
            marginTop: "15px",
            background: "#3498db",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Guardar Movimiento
        </button>
      </form>

      {/* Tabla de Movimientos */}
      <h3 style={{ color: "#333" }}>Historial de Movimientos</h3>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f8f9fa",
                textAlign: "left",
                borderBottom: "2px solid #dee2e6",
              }}
            >
              <th style={{ padding: "12px" }}>Fecha</th>
              <th style={{ padding: "12px" }}>Tipo</th>
              <th style={{ padding: "12px" }}>Categoría</th>
              <th style={{ padding: "12px" }}>Descripción</th>
              <th style={{ padding: "12px" }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#777",
                  }}
                >
                  No hay movimientos registrados.
                </td>
              </tr>
            ) : (
              movements.map((mov) => (
                <tr key={mov.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>
                    {new Date(mov.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background:
                          mov.type === "INGRESO" ? "#d4edda" : "#f8d7da",
                        color: mov.type === "INGRESO" ? "#155724" : "#721c24",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                      }}
                    >
                      {mov.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>{mov.category}</td>
                  <td style={{ padding: "12px" }}>{mov.description || "-"}</td>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: "bold",
                      color: mov.type === "INGRESO" ? "#28a745" : "#dc3545",
                    }}
                  >
                    {mov.type === "INGRESO" ? "+" : "-"}${mov.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
