import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/common/Sidebar"; // Ajusta la ruta si guardaste el Sidebar en otra carpeta
import LoansPage from "./pages/Loans/LoansPage";
import ClientsPage from "./pages/Clients/ClientsPage";
import CashPage from "./pages/Cash/CashPage";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage";
import SettingsPage from "./pages/Settings/SettingsPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-red-600 selection:text-white flex">
        {/* Nuevo Sidebar Colapsable */}
        <Sidebar />

        {/* Contenedor principal con margen izquierdo para evitar que el sidebar lo tape */}
        <main className="flex-1 ml-20 md:ml-64 transition-all duration-300 min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/analytics" replace />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/cash" element={<CashPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}