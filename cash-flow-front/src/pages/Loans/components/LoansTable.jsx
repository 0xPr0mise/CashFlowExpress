export default function LoansTable({ loans, onDeleteLoan }) {
  return (
    <div>
      <h3 style={{ color: "#333" }}>Préstamos Registrados</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
              <th style={{ padding: "12px" }}>Cliente</th>
              <th style={{ padding: "12px" }}>Monto</th>
              <th style={{ padding: "12px" }}>Cuotas</th>
              <th style={{ padding: "12px" }}>Frecuencia</th>
              <th style={{ padding: "12px" }}>Total a Pagar</th>
              <th style={{ padding: "12px" }}>Estado</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loans.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#777" }}>No hay préstamos cargados.</td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>{loan.client?.name || "N/A"}</td>
                  <td style={{ padding: "12px" }}>${loan.amount}</td>
                  <td style={{ padding: "12px" }}>{loan.installments}</td>
                  <td style={{ padding: "12px" }}>{loan.frequency}</td>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#28a745" }}>${loan.totalToPay}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ padding: "4px 8px", borderRadius: "4px", background: "#e2f0d9", color: "#385723", fontSize: "0.85rem", fontWeight: "bold" }}>
                      {loan.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button onClick={() => onDeleteLoan(loan.id)} style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}>
                      Eliminar
                    </button>
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