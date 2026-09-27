import { useState, useEffect } from "react";
import { getAnalytics } from "../../services/analytics.service";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando analíticas:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div style={{ padding: "20px" }}>Cargando métricas...</div>;
  if (!stats)
    return (
      <div style={{ padding: "20px" }}>
        Error al cargar los datos analíticos.
      </div>
    );

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
        Panel de Analíticas y Reportes
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* Clientes */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            borderLeft: "4px solid #3498db",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#777" }}>
            Clientes Totales
          </h4>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: "#2c3e50",
            }}
          >
            {stats.clientsCount}
          </p>
        </div>

        {/* Préstamos Activos */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            borderLeft: "4px solid #f39c12",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#777" }}>
            Préstamos Activos
          </h4>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: "#f39c12",
            }}
          >
            {stats.activeLoansCount}
          </p>
          <small style={{ color: "#888" }}>
            De {stats.totalLoansCount} totales ({stats.paidLoansCount} pagados)
          </small>
        </div>

        {/* Balance en Caja */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            borderLeft: "4px solid #27ae60",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#777" }}>
            Balance en Caja
          </h4>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: "#27ae60",
            }}
          >
            ${stats.cashBalance.toFixed(2)}
          </p>
        </div>

        {/* Total Prestado */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            borderLeft: "4px solid #9b59b6",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#777" }}>
            Capital Prestado
          </h4>
          <p
            style={{
              fontSize: "1.8rem",
              fontWeight: "bold",
              margin: 0,
              color: "#9b59b6",
            }}
          >
            ${stats.totalLentAmount.toFixed(2)}
          </p>
        </div>

        {/* Total Recaudado */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            borderLeft: "4px solid #1abc9c",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#777" }}>
            Dinero Cobrado
          </h4>
          <p
            style={{
              fontSize: "1.8rem",
              fontWeight: "bold",
              margin: 0,
              color: "#1abc9c",
            }}
          >
            ${stats.totalCollected.toFixed(2)}
          </p>
          <small style={{ color: "#888" }}>
            Esperado total: ${stats.totalExpectedReturn.toFixed(2)}
          </small>
        </div>
      </div>
    </div>
  );
}
