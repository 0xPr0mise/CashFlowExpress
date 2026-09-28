export default function SettingsNav({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: "general",
      label: "Identidad y Crédito",
      icon: "⚙️",
      desc: "Empresa y tasas",
    },
    {
      id: "receipts",
      label: "Recibos y Plantillas",
      icon: "🧾",
      desc: "Tickets y comprobantes",
    },
    {
      id: "backup",
      label: "Backup de Datos",
      icon: "💾",
      desc: "Respaldo y seguridad",
    },
    {
      id: "about",
      label: "Acerca del Sistema",
      icon: "ℹ️",
      desc: "Versión y soporte",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              isActive
                ? "bg-neutral-900 border-red-600 shadow-lg shadow-red-950/30 ring-1 ring-red-600/50"
                : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{tab.icon}</span>
              <span
                className={`w-2 h-2 rounded-full ${isActive ? "bg-red-600 animate-pulse" : "bg-neutral-800"}`}
              />
            </div>
            <div>
              <span className="block text-xs font-bold text-white">
                {tab.label}
              </span>
              <span className="text-[10px] text-neutral-400">{tab.desc}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
