import { payLoan } from "../../../services/loans.service"; // Ajusta la ruta si es necesario

export default function LoansTable({ loans, onLoanUpdated, onDeleteLoan }) {
  // Función para manejar el evento de pago directo
  const handlePayClick = async (loan) => {
    const amountStr = prompt(
      `Ingrese el monto a abonar para el préstamo de ${loan.client?.name || "Cliente"}:`,
      "0",
    );
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, ingrese un monto válido.");
      return;
    }

    try {
      await payLoan(loan.id, { amount, paymentMethod: "EFECTIVO" });
      alert("¡Pago registrado con éxito!");

      // Si pasaste una función para recargar los datos desde el componente padre, la ejecutamos:
      if (onLoanUpdated) {
        onLoanUpdated();
      } else {
        window.location.reload(); // Recarga de emergencia si no hay callback
      }
    } catch (error) {
      console.error(error);
      alert("Error al registrar el pago en el servidor.");
    }
  };

  return (
    <div>
      <h3 style={{ color: "#333", marginBottom: "15px" }}>
        Préstamos Registrados
      </h3>
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
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#777",
                  }}
                >
                  No hay préstamos cargados.
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>
                    {loan.client?.name || "N/A"}
                  </td>
                  <td style={{ padding: "12px" }}>${loan.amount}</td>
                  <td style={{ padding: "12px" }}>{loan.installments}</td>
                  <td style={{ padding: "12px" }}>{loan.frequency}</td>
                  <td
                    style={{
                      padding: "12px",
                      fontWeight: "bold",
                      color: "#28a745",
                    }}
                  >
                    ${loan.totalToPay}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background:
                          loan.status === "PAGADO" ? "#d4edda" : "#e2f0d9",
                        color: loan.status === "PAGADO" ? "#155724" : "#385723",
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                      }}
                    >
                      {loan.status}
                    </span>
                  </td>

                  {/* Celda unificada de Acciones para mantener el orden de la tabla */}
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        justifyContent: "center",
                      }}
                    >
                      {loan.status !== "PAGADO" && (
                        <button
                          onClick={() => handlePayClick(loan)}
                          style={{
                            background: "#27ae60",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          Pagar 💵
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteLoan(loan.id)}
                        style={{
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
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
