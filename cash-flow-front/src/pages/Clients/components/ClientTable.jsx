import { useState } from "react";

export default function ClientTable({
  filteredClients,
  searchTerm,
  setSearchTerm,
  handleDelete,
  handleOpenLoansModal,
}) {
  // Función auxiliar estética para formatear montos en enteros con separadores de millares
  const formatMoney = (amount) => {
    const numericValue = Number(amount) || 0;
    const rounded = Math.round(numericValue);
    return rounded.toLocaleString("es-AR");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-bold text-white">Lista de Clientes</h3>

        {/* Buscador Rápido con Botón X para Limpiar */}
        <div className="w-full sm:w-72 relative flex items-center">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-500 shadow-inner"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-10 text-center text-neutral-500 shadow-xl backdrop-blur-sm">
          No se encontraron clientes registrados.
        </div>
      ) : (
        <>
          {/* --- VISTA MÓVIL: TARJETAS (Visible solo en celulares) --- */}
          <div className="block md:hidden space-y-3">
            {filteredClients.map((client) => {
              const clientLoans = client.loans || [];
              
              const hasRefinancedLoan = clientLoans.some((loan) => {
                const status = loan.status ? String(loan.status).toUpperCase() : "";
                return (
                  loan.isRefinanced ||
                  loan.refinanced ||
                  loan.is_refinanced ||
                  status === "REFINANCIADO"
                );
              });

              const calculatedPending = clientLoans.reduce((sum, loan) => {
                const status = loan.status ? String(loan.status).toUpperCase() : 'ACTIVO';
                if (status === 'PAGADO' || status === 'REFINANCIADO') return sum;

                const totalToPay = Number(loan.totalToPay || loan.amount || 0);
                const totalPaid = Array.isArray(loan.payments)
                  ? loan.payments.reduce((acc, p) => acc + Number(p.amount ?? p.monto ?? p.valor ?? 0), 0)
                  : Number(loan.paidAmount || 0);

                const net = totalToPay - totalPaid;
                return sum + (net > 0 ? net : 0);
              }, 0);

              const finalPending = calculatedPending;

              return (
                <div
                  key={client.id}
                  className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4 shadow-lg space-y-3 backdrop-blur-sm"
                >
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-800/80 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        {client.name}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        📞 {client.phone || "Sin teléfono"} {client.dni ? `• DNI: ${client.dni}` : ""}
                      </p>
                    </div>
                    {hasRefinancedLoan && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800">
                        Refinanciado
                      </span>
                    )}
                  </div>

                  {/* Detalles de ubicación y referidos */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-neutral-400">
                      <span className="text-neutral-500 block text-[10px] uppercase">Dirección</span>
                      <span className="text-neutral-300">{client.address || "-"}</span>
                      {client.reference && (
                        <span className="block text-[10px] text-neutral-500 italic">Ref: {client.reference}</span>
                      )}
                    </div>
                    <div className="text-neutral-400">
                      <span className="text-neutral-500 block text-[10px] uppercase">Referido por</span>
                      {client.referredBy ? (
                        <span className="text-neutral-200 font-medium">{client.referredBy.name}</span>
                      ) : (
                        <span className="text-neutral-500">-</span>
                      )}
                    </div>
                  </div>

                  {/* Saldo Pendiente Destacado */}
                  <div className="flex items-center justify-between bg-black/40 border border-neutral-800/60 p-3 rounded-xl">
                    <span className="text-xs text-neutral-400 font-medium">Total Pendiente:</span>
                    <span className="text-base font-black text-amber-400 tracking-tight">
                      ${formatMoney(finalPending)}
                    </span>
                  </div>

                  {/* Botones de Acción táctiles */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenLoansModal && handleOpenLoansModal(client)}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Ver Préstamos 📋
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(client.id)}
                      className="px-4 bg-neutral-800 hover:bg-red-950/60 text-red-400 border border-neutral-700 hover:border-red-900 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* --- VISTA ESCRITORIO: TABLA CLÁSICA (Visible solo en pantallas medianas y grandes) --- */}
          <div className="hidden md:block bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-400 bg-black/40">
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Teléfono</th>
                    <th className="p-4">DNI</th>
                    <th className="p-4">Dirección / Ref</th>
                    <th className="p-4">Referido por</th>
                    <th className="p-4">Total Pendiente</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-sm">
                  {filteredClients.map((client) => {
                    const clientLoans = client.loans || [];
                    
                    const hasRefinancedLoan = clientLoans.some((loan) => {
                      const status = loan.status ? String(loan.status).toUpperCase() : "";
                      return (
                        loan.isRefinanced ||
                        loan.refinanced ||
                        loan.is_refinanced ||
                        status === "REFINANCIADO"
                      );
                    });

                    const calculatedPending = clientLoans.reduce((sum, loan) => {
                      const status = loan.status ? String(loan.status).toUpperCase() : 'ACTIVO';
                      if (status === 'PAGADO' || status === 'REFINANCIADO') return sum;

                      const totalToPay = Number(loan.totalToPay || loan.amount || 0);
                      const totalPaid = Array.isArray(loan.payments)
                        ? loan.payments.reduce((acc, p) => acc + Number(p.amount ?? p.monto ?? p.valor ?? 0), 0)
                        : Number(loan.paidAmount || 0);

                      const net = totalToPay - totalPaid;
                      return sum + (net > 0 ? net : 0);
                    }, 0);

                    const finalPending = calculatedPending;

                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-4 font-bold text-white">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span>{client.name}</span>
                            {hasRefinancedLoan && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800 w-fit">
                                Refinanciado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-neutral-300">{client.phone}</td>
                        <td className="p-4 text-neutral-400">
                          {client.dni || "-"}
                        </td>
                        <td className="p-4 text-neutral-400 text-xs">
                          <div>{client.address || "-"}</div>
                          {client.reference && (
                            <span className="text-neutral-500 italic">
                              Ref: {client.reference}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-neutral-300 text-xs">
                          {client.referredBy ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              {client.referredBy.name}
                            </span>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>

                        <td className="p-4 font-black text-amber-400 tracking-tight">
                          ${formatMoney(finalPending)}
                        </td>

                        <td className="p-4 text-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (handleOpenLoansModal) {
                                handleOpenLoansModal(client);
                              } else {
                                alert("La función del modal no está conectada.");
                              }
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                            title="Ver préstamos activos"
                          >
                            Ver Préstamos
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(client.id)}
                            className="bg-neutral-800 hover:bg-red-950/60 text-red-400 border border-neutral-700 hover:border-red-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}