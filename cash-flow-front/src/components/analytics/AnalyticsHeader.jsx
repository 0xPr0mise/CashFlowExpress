export default function AnalyticsHeader() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-950/60 text-red-400 border border-red-900/50 uppercase tracking-wider">
          Terminal v3.4
        </span>
        <span className="text-[11px] text-neutral-400 font-medium">
          • Módulo de Inteligencia de Cartera
        </span>
      </div>
      
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
        Dashboard Financiero
      </h2>
      
      <p className="text-xs text-neutral-400 leading-relaxed">
        Monitoreo en tiempo real de flujos de caja, yield de colocación y rendimiento de activos.
      </p>
    </div>
  );
}