import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import LoansPage from "./pages/Loans/LoansPage";
import ClientsPage from "./pages/Clients/ClientsPage";
import CashPage from "./pages/Cash/CashPage";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage";
import SettingsPage from "./pages/Settings/SettingsPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-red-600 selection:text-white">
        <Navbar />

        <Routes>
          <Route path="/" element={<Navigate to="/analytics" replace />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/cash" element={<CashPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}
