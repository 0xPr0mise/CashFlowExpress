export default function AnalyticsHeader() {
    return (
      <div className="border-b border-neutral-800/80 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-red-950/60 text-red-400 border border-red-900/50 uppercase tracking-widest">
              Terminal Analítica v3.4
            </span>
            <span className="text-xs text-neutral-500">• Módulo de Inteligencia de Cartera</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Dashboard Financiero & Riesgo
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Monitoreo en tiempo real de flujos de caja, yield de colocación y rendimiento de activos.
          </p>
        </div>
  
        <div className="flex items-center gap-3">
          <div className="bg-neutral-900/90 border border-neutral-800 px-4 py-2.5 rounded-xl text-xs text-neutral-300 flex items-center gap-2.5 shadow-xl">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-md shadow-emerald-500/50"></span>
            <span>Motor Activo / Sincronizado</span>
          </div>
        </div>
      </div>
    );
  }