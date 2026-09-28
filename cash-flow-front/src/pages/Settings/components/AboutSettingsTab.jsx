export default function AboutSettingsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
        <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
          Acerca de Cash Flow Express
        </h3>
        <div className="space-y-3 text-xs text-neutral-300">
          <div className="flex justify-between py-2 border-b border-neutral-800/60">
            <span className="text-neutral-500">Versión del Sistema</span>
            <span className="font-mono text-white font-bold">v2.4.0-pro</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-800/60">
            <span className="text-neutral-500">Motor de Base de Datos</span>
            <span className="text-white">SQLite / Cloud Sync</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-800/60">
            <span className="text-neutral-500">Desarrollado para</span>
            <span className="text-white">Gestión Financiera de Préstamos</span>
          </div>
          <div className="pt-2">
            <p className="text-[11px] text-neutral-500">
              Sistema protegido por licencias comerciales. Todos los derechos
              reservados. Para soporte técnico, contacte al administrador de
              infraestructura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
