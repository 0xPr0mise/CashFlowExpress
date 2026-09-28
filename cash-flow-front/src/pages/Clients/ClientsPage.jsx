import { useState, useEffect } from "react";
import {
  getClients,
  createClient,
  deleteClient,
} from "../../services/client.service";
import ClientMetricsCard from "./components/ClientMetricsCard";
import ClientForm from "./components/ClientForm";
import ClientTable from "./components/ClientTable";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    dni: "",
    address: "",
    reference: "",
    creditLimit: "",
    referredById: "", // <- Añadido para el campo de referencia
  });

  const loadClients = async () => {
    try {
      const data = await getClients();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  useEffect(() => {
    loadClients();
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
        // Si no se selecciona ningún cliente, mandamos null para que Prisma lo acepte correctamente
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
      await loadClients();
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
        await loadClients();
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        alert("Error al eliminar el cliente");
      }
    }
  };

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(term) ||
      client.phone.toLowerCase().includes(term) ||
      (client.dni && client.dni.toLowerCase().includes(term))
    );
  });

  const totalCreditLimit = clients.reduce(
    (acc, curr) => acc + (curr.creditLimit || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-600/50"></span>
              Gestión de Cartera de Clientes
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Administración de clientes, límites de crédito y datos operativos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              Nuevo Cliente
            </button>
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-xs text-neutral-400 hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Sistema Activo
            </div>
          </div>
        </div>

        <ClientMetricsCard
          clients={clients}
          totalCreditLimit={totalCreditLimit}
        />

        {/* Modal con la lista de clientes para el selector de referencias */}
        <ClientForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          form={form}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          loading={loading}
          clients={clients}
        />

        <ClientTable
          filteredClients={filteredClients}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
}
