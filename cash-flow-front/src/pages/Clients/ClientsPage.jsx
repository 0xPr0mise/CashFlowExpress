import { useState, useEffect } from "react";
import {
  getClients,
  createClient,
  deleteClient,
} from "../../services/client.service";
import { getLoans } from "../../services/loans.service";
import ClientMetricsCard from "./components/ClientMetricsCard";
import ClientForm from "./components/ClientForm";
import ClientTable from "./components/ClientTable";
import ClientReferralsModal from "./components/ClientReferralsModal";
import ClientLoansModal from "./components/ClientLoansModal"; // <--- Importamos el componente

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReferralsModalOpen, setIsReferralsModalOpen] = useState(false);

  // Estados para el modal de préstamos
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLoansModalOpen, setIsLoansModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    dni: "",
    address: "",
    reference: "",
    creditLimit: "",
    referredById: "",
  });

  const loadData = async () => {
    try {
      const [clientsData, loansData] = await Promise.all([
        getClients(),
        getLoans().catch(() => []),
      ]);

      const validLoans = Array.isArray(loansData) ? loansData : [];
      setLoans(validLoans);

      if (Array.isArray(clientsData)) {
        const enrichedClients = clientsData.map((client) => {
          const clientLoans = validLoans.filter((loan) => {
            const loanClientId =
              loan.clientId ||
              loan.client_id ||
              loan.userId ||
              loan.user_id ||
              (loan.client && loan.client.id);

            return loanClientId != null && loanClientId == client.id;
          });

          const totalPending = clientLoans.reduce((sum, loan) => {
            const amount = Number(
              loan.remainingAmount ??
                loan.balance ??
                loan.pendingAmount ??
                loan.pending_amount ??
                loan.amount ??
                0,
            );
            return sum + amount;
          }, 0);

          return {
            ...client,
            totalPending,
            clientLoans,
          };
        });

        setClients(enrichedClients);
      }
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert("Por favor completa al menos el Nombre y el Teléfono.");
      return;
    }

    setLoading(true);
    try {
      await createClient({
        ...form,
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : 0,
        referredById: form.referredById ? form.referredById : null,
      });

      setForm({
        name: "",
        phone: "",
        dni: "",
        address: "",
        reference: "",
        creditLimit: "",
        referredById: "",
      });
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error al crear cliente:", error);
      alert("Error al registrar el cliente en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      try {
        await deleteClient(id);
        await loadData();
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        alert("Error al eliminar el cliente");
      }
    }
  };

  const handleOpenLoansModal = (client) => {
    setSelectedClient(client);
    setIsLoansModalOpen(true);
  };

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(term) ||
      client.phone.toLowerCase().includes(term) ||
      (client.dni && client.dni.toLowerCase().includes(term))
    );
  });

  const totalPendingPortfolio = clients.reduce(
    (acc, curr) => acc + (curr.totalPending || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 sm:p-6 md:p-10 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Cabecera optimizada Mobile-First */}
        <div className="border-b border-neutral-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50 flex-shrink-0"></span>
              Gestión de Cartera de Clientes
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Administración de clientes, saldos pendientes y datos operativos.
            </p>
          </div>

          {/* Botones de acción adaptados a filas flexibles en móvil */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-5 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              + Nuevo Cliente
            </button>
            <button
              onClick={() => setIsReferralsModalOpen(true)}
              className="group inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 shadow-sm cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Ver Red de Referidos
            </button>
          </div>
        </div>

        <ClientMetricsCard
          clients={clients}
          totalCreditLimit={totalPendingPortfolio}
        />

        <ClientForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          form={form}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          loading={loading}
          clients={clients}
        />

        <ClientReferralsModal
          isOpen={isReferralsModalOpen}
          onClose={() => setIsReferralsModalOpen(false)}
          clients={clients}
        />

        <ClientTable
          filteredClients={filteredClients}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleDelete={handleDelete}
          handleOpenLoansModal={handleOpenLoansModal}
        />
      </div>

      {/* Renderizamos el componente del modal de préstamos */}
      <ClientLoansModal
        isOpen={isLoansModalOpen}
        onClose={() => setIsLoansModalOpen(false)}
        selectedClient={selectedClient}
      />
    </div>
  );
}