import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import LoansPage from "./pages/Loans/LoansPage";
import ClientsPage from "./pages/Clients/ClientsPage";
import CashPage from "./pages/Cash/CashPage";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage";
import SettingsPage from "./pages/Settings/SettingsPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen w-full bg-black text-gray-100 font-sans selection:bg-red-600 selection:text-white flex flex-col md:flex-row overflow-x-hidden">
        {/* Sidebar (Lateral en PC, Dock Flotante en Celulares) */}
        <Sidebar />

        {/* Contenedor principal adaptativo con Flexbox y ancho completo */}
        <main className="flex-1 w-full transition-all duration-300 min-h-screen pb-24 md:pb-6">
          <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/analytics" replace />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/loans" element={<LoansPage />} />
              <Route path="/cash" element={<CashPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}