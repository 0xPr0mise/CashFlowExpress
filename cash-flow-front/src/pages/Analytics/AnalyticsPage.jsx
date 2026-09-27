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
    return (
      <div className="min-h-screen bg-black text-neutral-400 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
          Cargando métricas del sistema...
        </div>
      </div>
    );

  if (!stats)
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-sans">
        Error al cargar los datos analíticos del servidor.
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            Panel de Analíticas y Reportes
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Resumen general de rendimiento financiero, capital y cartera de
            clientes.
          </p>
        </div>

        {/* Tarjetas de Métricas (Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Clientes Totales */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-red-600 p-6 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Clientes Totales
            </h4>
            <p className="text-4xl font-black text-white tracking-tight">
              {stats.clientsCount}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-500 bg-black/40 px-2 py-1 rounded-md border border-neutral-800">
              Registrados en la base de datos
            </span>
          </div>

          {/* Préstamos Activos */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-amber-500 p-6 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Préstamos Activos
            </h4>
            <p className="text-4xl font-black text-amber-500 tracking-tight">
              {stats.activeLoansCount}
            </p>
            <div className="mt-3 text-xs text-neutral-400">
              De{" "}
              <span className="text-white font-bold">
                {stats.totalLoansCount}
              </span>{" "}
              totales ({stats.paidLoansCount} pagados)
            </div>
          </div>

          {/* Balance en Caja */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-emerald-500 p-6 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Balance en Caja
            </h4>
            <p className="text-4xl font-black text-emerald-400 tracking-tight">
              ${stats.cashBalance.toFixed(2)}
            </p>
            <span className="inline-block mt-3 text-xs text-emerald-500/80 bg-emerald-950/20 px-2 py-1 rounded-md border border-emerald-900/30 font-medium">
              Efectivo disponible
            </span>
          </div>

          {/* Capital Prestado */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-purple-500 p-6 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Capital Prestado
            </h4>
            <p className="text-3xl font-black text-purple-400 tracking-tight">
              ${stats.totalLentAmount.toFixed(2)}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-500 bg-black/40 px-2 py-1 rounded-md border border-neutral-800">
              Inversión total inicial
            </span>
          </div>

          {/* Dinero Cobrado */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-red-500 p-6 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700 sm:col-span-2 lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Dinero Cobrado / Recaudación
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <p className="text-4xl font-black text-red-500 tracking-tight">
                ${stats.totalCollected.toFixed(2)}
              </p>
              <div className="text-xs text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
                Esperado total:{" "}
                <span className="text-white font-bold">
                  ${stats.totalExpectedReturn.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Barra de progreso visual opcional de cobro */}
            <div className="w-full bg-neutral-950 rounded-full h-2 mt-4 overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stats.totalExpectedReturn > 0 ? Math.min(100, (stats.totalCollected / stats.totalExpectedReturn) * 100) : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
