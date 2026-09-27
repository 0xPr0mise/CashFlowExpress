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

  // Cálculos adicionales para gráficos y métricas avanzadas
  const totalLoans = stats.totalLoansCount || 1; // Evitar división por cero
  const activePercentage = Math.round(
    (stats.activeLoansCount / totalLoans) * 100,
  );
  const paidPercentage = Math.round((stats.paidLoansCount / totalLoans) * 100);

  const estimatedProfit = stats.totalExpectedReturn - stats.totalLentAmount;
  const collectionRate =
    stats.totalExpectedReturn > 0
      ? Math.min(
          100,
          Math.round((stats.totalCollected / stats.totalExpectedReturn) * 100),
        )
      : 0;

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
              Panel de Analíticas y Reportes
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Análisis profundo de rendimiento financiero, flujos de caja y
              cartera de clientes.
            </p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Sistema sincronizado en tiempo real
          </div>
        </div>

        {/* Tarjetas de Métricas Principales (Grid Superior) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Clientes Totales */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-red-600 p-5 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Clientes Totales
            </h4>
            <p className="text-3xl font-black text-white tracking-tight">
              {stats.clientsCount}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
              Cartera activa
            </span>
          </div>

          {/* Préstamos Activos */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-amber-500 p-5 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Préstamos Activos
            </h4>
            <p className="text-3xl font-black text-amber-500 tracking-tight">
              {stats.activeLoansCount}
            </p>
            <div className="mt-3 text-xs text-neutral-400">
              De{" "}
              <span className="text-white font-bold">
                {stats.totalLoansCount}
              </span>{" "}
              totales
            </div>
          </div>

          {/* Balance en Caja */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-emerald-500 p-5 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Balance en Caja
            </h4>
            <p className="text-3xl font-black text-emerald-400 tracking-tight">
              ${stats.cashBalance.toFixed(2)}
            </p>
            <span className="inline-block mt-3 text-xs text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40">
              Disponible
            </span>
          </div>

          {/* Ganancia Proyectada */}
          <div className="bg-neutral-900/60 border border-neutral-800 border-l-4 border-l-purple-500 p-5 rounded-2xl shadow-xl backdrop-blur-sm transition-all hover:border-neutral-700">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Utilidad Proyectada
            </h4>
            <p className="text-3xl font-black text-purple-400 tracking-tight">
              ${estimatedProfit > 0 ? estimatedProfit.toFixed(2) : "0.00"}
            </p>
            <span className="inline-block mt-3 text-xs text-neutral-400 bg-black/40 px-2 py-0.5 rounded border border-neutral-800">
              Intereses estimados
            </span>
          </div>
        </div>

        {/* Sección de Gráficos e Insights Avanzados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Comparación Financiera (2 columnas en desktop) */}
          <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Rendimiento de Capital y Recaudación
              </h3>
              <p className="text-xs text-neutral-400 mb-6">
                Comparativa entre inversión inicial, recaudación actual y
                retorno proyectado.
              </p>
            </div>

            <div className="space-y-5 my-auto">
              {/* Barra Capital Prestado */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-400">
                    Capital Inicial Prestado
                  </span>
                  <span className="text-purple-400">
                    ${stats.totalLentAmount.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-700"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              {/* Barra Dinero Cobrado */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-400">
                    Dinero Cobrado a la Fecha
                  </span>
                  <span className="text-red-500">
                    ${stats.totalCollected.toFixed(2)} ({collectionRate}%)
                  </span>
                </div>
                <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${collectionRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Barra Esperado Total */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-400">
                    Retorno Total Esperado (Capital + Intereses)
                  </span>
                  <span className="text-emerald-400">
                    ${stats.totalExpectedReturn.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <span>Eficiencia de cobro global</span>
              <span className="font-bold text-white bg-black px-2.5 py-1 rounded-lg border border-neutral-800">
                {collectionRate}% completado
              </span>
            </div>
          </div>

          {/* Gráfico de Distribución de Préstamos (1 columna) */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Estado de Cartera
              </h3>
              <p className="text-xs text-neutral-400 mb-6">
                Proporción de préstamos activos vs. liquidados.
              </p>
            </div>

            <div className="space-y-4 my-auto">
              {/* Préstamos Activos */}
              <div className="bg-black/40 border border-neutral-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                    <span className="text-xs font-semibold text-neutral-300">
                      Activos en Curso
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-500">
                    {stats.activeLoansCount} ({activePercentage}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${activePercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Préstamos Pagados */}
              <div className="bg-black/40 border border-neutral-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                    <span className="text-xs font-semibold text-neutral-300">
                      Liquidados / Pagados
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {stats.paidLoansCount} ({paidPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${paidPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
              <span className="text-xs text-neutral-500">
                Total histórico procesado:{" "}
                <strong className="text-neutral-300">
                  {stats.totalLoansCount} préstamos
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
