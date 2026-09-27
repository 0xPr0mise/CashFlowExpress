import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ background: "#2c3e50", padding: "15px", color: "white", display: "flex", gap: "20px" }}>
      <Link to="/loans" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Préstamos</Link>
      <Link to="/clients" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Clientes</Link>
      <Link to="/cash" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Caja</Link>
      <Link to="/analytics" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Analíticas</Link>
      <Link to="/settings" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Configuración</Link>
    </nav>
  );
}