export default function BackupSettingsTab() {
  const handleExportBackup = () => {
    alert(
      "Función de exportación de base de datos simulada. Aquí puedes generar un archivo JSON con los respaldos.",
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
        <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
          Respaldo y Seguridad de Datos
        </h3>
        <p className="text-xs text-neutral-400">
          Protege la información de tu negocio realizando copias de seguridad
          periódicas de la base de datos (clientes, préstamos, pagos y
          configuraciones).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-black border border-neutral-800 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white">
              Exportar Respaldo (JSON)
            </h4>
            <p className="text-[11px] text-neutral-500">
              Descarga una copia completa de todos los registros del sistema.
            </p>
            <button
              type="button"
              onClick={handleExportBackup}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              Descargar Backup
            </button>
          </div>

          <div className="bg-black border border-neutral-800 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white">
              Restaurar Base de Datos
            </h4>
            <p className="text-[11px] text-neutral-500">
              Carga un archivo de respaldo previo para recuperar datos.
            </p>
            <input
              type="file"
              accept=".json"
              className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
