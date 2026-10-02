import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { name: "Préstamos", fullName: "Préstamos", path: "/loans", icon: "💳" },
    { name: "Clientes", fullName: "Clientes", path: "/clients", icon: "👥" },
    { name: "Caja", fullName: "Caja", path: "/cash", icon: "💵" },
    { name: "Analíticas", fullName: "Analíticas", path: "/analytics", icon: "📊" },
    { name: "Config.", fullName: "Configuración", path: "/settings", icon: "⚙️" },
  ];

  return (
    <>
      {/* --- VISTA ESCRITORIO: SIDEBAR LATERAL --- */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-screen bg-neutral-950 border-r border-neutral-800 transition-all duration-300 z-50 flex-col justify-between ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          <div className="p-5 flex items-center justify-between border-b border-neutral-800">
            {!collapsed ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
                <span className="text-white font-black tracking-tight text-sm uppercase truncate">
                  Cash Flow <span className="text-red-600">Express</span>
                </span>
              </div>
            ) : (
              <div className="mx-auto">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50 block"></span>
              </div>
            )}
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
              title={collapsed ? "Expandir Sidebar" : "Colapsar Sidebar"}
            >
              {collapsed ? "➡" : "⬅️"}
            </button>
          </div>

          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all group ${
                    active
                      ? "bg-red-600 text-white shadow-lg shadow-red-950/50"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                  }`}
                  title={collapsed ? item.fullName : ""}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.fullName}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <div className={`flex items-center gap-3 bg-black/40 border border-neutral-800 p-2.5 rounded-xl ${collapsed ? "justify-center" : ""}`}>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0"></span>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-white truncate">Terminal v3.4</p>
                <p className="text-[10px] text-neutral-500 truncate">Sincronizado</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* --- VISTA MÓVIL: BARRA INFERIOR FIJA (Anclada al borde inferior, sin huecos ni contenido detrás) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-neutral-950 border-t border-neutral-800 z-50 px-2 flex items-center justify-around shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.9)]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                active 
                  ? "text-red-400 font-bold bg-red-950/40 border-t-2 border-red-600" 
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <span className={`text-base transition-transform ${active ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[9px] mt-0.5 truncate tracking-tight scale-95">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}