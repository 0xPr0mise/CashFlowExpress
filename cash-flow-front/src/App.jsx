import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // O donde decidas ubicarlo
import LoansPage from "./pages/Loans/LoansPage";
import ClientsPage from "./pages/Clients/ClientsPage"; // Si tienes tu página de clientes separada
import CashPage from "./pages/Cash/CashPage";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage"; // Si tienes tu página de análisis separada

export default function App() {
  return (
    <Router>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          minHeight: "100vh",
          background: "#f8f9fa",
        }}
      >
        <Navbar />
        <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <Routes>
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/cash" element={<CashPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
