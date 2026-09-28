import { useState, useMemo } from "react";

export default function ClientReferralsModal({ isOpen, onClose, clients }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  // Filtramos la lista de clientes para el autocompletado en base al input
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        (c.dni && c.dni.toLowerCase().includes(term)),
    );
  }, [searchTerm, clients]);

  if (!isOpen) return null;

  // Clientes raíz (sin referente) para la vista general por defecto
  const rootClients = clients.filter((c) => !c.referredById);

  // Función recursiva para renderizar ramas hacia abajo (sus referidos)
  const renderClientBranch = (client) => {
    const subReferrals = clients.filter((c) => c.referredById === client.id);

    return (
      <div
        key={client.id}
        className="ml-4 pl-4 border-l border-neutral-800 space-y-3 my-2"
      >
        <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <div>
              <p className="text-sm font-bold text-white">{client.name}</p>
              <p className="text-xs text-neutral-400">
                Tel: {client.phone} {client.dni ? `• DNI: ${client.dni}` : ""}
              </p>
            </div>
          </div>
          <span className="text-xs bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-700">
            {subReferrals.length} referidos directos
          </span>
        </div>

        {subReferrals.length > 0 && (
          <div className="space-y-2">
            {subReferrals.map((referredClient) =>
              renderClientBranch(referredClient),
            )}
          </div>
        )}
      </div>
    );
  };

  // Obtener la cadena ascendente (quién lo refirió hacia arriba)
  const getAncestorsChain = (client) => {
    const chain = [];
    let current = client;
    while (current && current.referredById) {
      const parent = clients.find((c) => c.id === current.referredById);
      if (parent) {
        chain.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return chain;
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSelectedClient(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
              Árbol de Red de Referidos
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Busca un cliente para rastrear su red de recomendaciones.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Buscador con Autocompletado */}
        <div className="relative">
          <div className="flex items-center bg-black/40 border border-neutral-800 rounded-xl px-3.5 py-2.5 focus-within:border-red-600 transition-colors">
            <svg
              className="w-4 h-4 text-neutral-500 mr-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono para filtrar red..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value) setSelectedClient(null);
              }}
              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-neutral-500"
            />
            {(searchTerm || selectedClient) && (
              <button
                onClick={clearSearch}
                className="ml-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lista de Autocompletado */}
          {searchTerm && !selectedClient && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto divide-y divide-neutral-800/60">
              {searchResults.map((client) => (
                <div
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setSearchTerm(client.name);
                  }}
                  className="p-3 hover:bg-neutral-800/60 cursor-pointer transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-bold text-white">
                      {client.name}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      Tel: {client.phone}
                    </p>
                  </div>
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700">
                    Seleccionar
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contenido Dinámico: Vista Filtrada por Cliente o Vista General */}
        <div className="space-y-4 min-h-[200px]">
          {selectedClient ? (
            <div className="space-y-4">
              <div className="bg-black/20 border border-neutral-800 p-4 rounded-xl space-y-3">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Ruta de Referidos para:{" "}
                  <span className="text-white">{selectedClient.name}</span>
                </p>

                {/* 1. Quién lo refirió (Ascendente) */}
                <div className="space-y-2">
                  <p className="text-[11px] text-neutral-500 font-semibold">
                    ¿Quién lo refirió? (Ascendente):
                  </p>
                  {getAncestorsChain(selectedClient).length === 0 ? (
                    <p className="text-xs text-neutral-400 italic bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800">
                      Este cliente es cabeza de red (no fue referido por nadie).
                    </p>
                  ) : (
                    getAncestorsChain(selectedClient).map((ancestor, index) => (
                      <div
                        key={ancestor.id}
                        className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg ml-4"
                      >
                        <span className="w-2 h-2 rounded-full bg-neutral-500"></span>
                        <span className="text-xs text-neutral-300 font-medium">
                          {ancestor.name}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          (Nivel -
                          {getAncestorsChain(selectedClient).length - index})
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* 2. El cliente seleccionado actualmente */}
                <div className="flex items-center justify-between bg-neutral-800/80 border border-red-900/50 p-3 rounded-xl ml-4 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                    <span className="text-sm font-bold text-white">
                      {selectedClient.name} (Cliente Actual)
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    Tel: {selectedClient.phone}
                  </span>
                </div>

                {/* 3. A quiénes refirió (Descendente) */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] text-neutral-500 font-semibold">
                    ¿A quiénes refirió? (Descendente):
                  </p>
                  {clients.filter((c) => c.referredById === selectedClient.id)
                    .length === 0 ? (
                    <p className="text-xs text-neutral-400 italic bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800 ml-4">
                      Este cliente aún no ha registrado referidos directos.
                    </p>
                  ) : (
                    renderClientBranch(selectedClient)
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Vista por defecto (Todo el árbol general)
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Mostrando todas las redes activas de referidos:
              </p>
              {rootClients.length === 0 ? (
                <p className="text-center py-8 text-neutral-500 text-sm">
                  No hay registros de referidos todavía.
                </p>
              ) : (
                rootClients.map((client) => renderClientBranch(client))
              )}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex justify-end pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
