export default function ClientTable({
  filteredClients,
  searchTerm,
  setSearchTerm,
  handleDelete,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-bold text-white">Lista de Clientes</h3>

        {/* Buscador Rápido */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-500"
          />
        </div>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-400 bg-black/40">
                <th className="p-4">Nombre</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">DNI</th>
                <th className="p-4">Dirección / Ref</th>
                <th className="p-4">Referido por</th>
                <th className="p-4">Límite Crédito</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-12 text-neutral-500"
                  >
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-white">{client.name}</td>
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

                    {/* Columna nueva: Muestra el nombre del cliente que lo refirió */}
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

                    <td className="p-4 font-black text-emerald-400 tracking-tight">
                      $
                      {client.creditLimit
                        ? client.creditLimit.toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="bg-neutral-800 hover:bg-red-950/60 text-red-400 border border-neutral-700 hover:border-red-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
