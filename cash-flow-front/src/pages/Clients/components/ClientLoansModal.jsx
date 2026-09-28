export default function ClientLoansModal({ isOpen, onClose, selectedClient }) {
  if (!isOpen || !selectedClient) return null;

  // Calculamos el total pendiente específico para mostrar en el resumen del modal
  const totalClientPending =
    selectedClient.clientLoans?.reduce((sum, loan) => {
      return (
        sum + Number(loan.remainingAmount ?? loan.balance ?? loan.amount ?? 0)
      );
    }, 0) || 0;

  const loansCount = selectedClient.clientLoans?.length || 0;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800/90 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-black/30">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Detalle de Cartera
            </span>
            <h3 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
              {selectedClient.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Resumen Rápido (Sub-banner) */}
        <div className="px-6 py-3 bg-neutral-950/60 border-b border-neutral-800/60 flex items-center justify-between text-xs">
          <span className="text-neutral-400">
            Préstamos activos:{" "}
            <strong className="text-white">{loansCount}</strong>
          </span>
          <span className="text-neutral-400">
            Total Pendiente:{" "}
            <strong className="text-amber-400 font-black text-sm">
              ${Number(totalClientPending).toFixed(2)}
            </strong>
          </span>
        </div>

        {/* Listado de Préstamos */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {loansCount === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center mx-auto text-lg text-neutral-400">
                📂
              </div>
              <p className="text-neutral-300 text-sm font-semibold">
                Sin préstamos registrados
              </p>
              <p className="text-neutral-500 text-xs">
                Este cliente no posee créditos asignados actualmente en el
                sistema.
              </p>
            </div>
          ) : (
            selectedClient.clientLoans.map((loan) => {
              const pending = Number(
                loan.remainingAmount ?? loan.balance ?? loan.amount ?? 0,
              );
              const original = Number(loan.amount || 0);
              const status = loan.status || "Activo";

              return (
                <div
                  key={loan.id}
                  className="bg-neutral-800/40 border border-neutral-800 hover:border-neutral-700/80 p-4 rounded-xl transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-md border border-neutral-700/50">
                      ID: #{loan.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-950/50 text-amber-400 border border-amber-900/40">
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800/60 text-xs">
                    <div>
                      <span className="text-neutral-500 block mb-0.5">
                        Monto Original
                      </span>
                      <span className="font-bold text-neutral-200 text-sm">
                        ${original.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block mb-0.5">
                        Saldo Pendiente
                      </span>
                      <span className="font-black text-amber-400 text-sm">
                        ${pending.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-neutral-800 bg-black/20">
          <button
            onClick={onClose}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-lg"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
