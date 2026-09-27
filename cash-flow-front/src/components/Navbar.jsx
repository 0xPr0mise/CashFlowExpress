import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  // Función auxiliar para determinar si el enlace está activo
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-neutral-800 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo / Marca */}
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
          <span className="text-white font-black tracking-tight text-lg uppercase">
            Cash Flow <span className="text-red-600">Express</span>
          </span>
        </div>

        {/* Enlaces de Navegación en el nuevo orden */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          <Link
            to="/loans"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              isActive("/loans")
                ? "bg-red-600 text-white shadow-lg shadow-red-950/50"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            Préstamos
          </Link>

          <Link
            to="/clients"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              isActive("/clients")
                ? "bg-red-600 text-white shadow-lg shadow-red-950/50"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            Clientes
          </Link>

          <Link
            to="/cash"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              isActive("/cash")
                ? "bg-red-600 text-white shadow-lg shadow-red-950/50"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            Caja
          </Link>

          <Link
            to="/analytics"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              isActive("/analytics")
                ? "bg-red-600 text-white shadow-lg shadow-red-950/50"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            Analíticas
          </Link>

          <Link
            to="/settings"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              isActive("/settings")
                ? "bg-red-600 text-white shadow-lg shadow-red-950/50"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            Configuración
          </Link>
        </div>
      </div>
    </nav>
  );
}
