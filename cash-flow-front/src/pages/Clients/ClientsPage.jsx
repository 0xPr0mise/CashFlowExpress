import { useState, useEffect } from "react";
import {
  getClients,
  createClient,
  deleteClient,
} from "../../services/client.service";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dni: "",
    address: "",
    reference: "",
    creditLimit: "",
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

    try {
      await createClient({
        ...form,
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : 0,
      });

      setForm({
        name: "",
        phone: "",
        dni: "",
        address: "",
        reference: "",
        creditLimit: "",
      });
      loadClients();
    } catch (error) {
      console.error("Error al crear cliente:", error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      try {
        await deleteClient(id);
        loadClients();
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="border-b border-neutral-800 pb-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            Gestión de Clientes
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Administración de cartera de clientes, límites de crédito y datos
            personales.
          </p>
        </div>

        {/* Formulario de Registro */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              ></path>
            </svg>
            Registrar Nuevo Cliente
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Ej. Juan Pérez"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Teléfono *
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Ej. 1123456789"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  name="dni"
                  placeholder="Ej. 35123456"
                  value={form.dni}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Ej. Av. Siempre Viva 123"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Referencia
                </label>
                <input
                  type="text"
                  name="reference"
                  placeholder="Ej. Casa verde / Esquina"
                  value={form.reference}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Límite de Crédito ($)
                </label>
                <input
                  type="number"
                  name="creditLimit"
                  placeholder="0.00"
                  value={form.creditLimit}
                  onChange={handleChange}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer"
              >
                Guardar Cliente
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Clientes */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Lista de Clientes</h3>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-400 bg-black/40">
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Teléfono</th>
                    <th className="p-4">DNI</th>
                    <th className="p-4">Dirección</th>
                    <th className="p-4">Límite Crédito</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-sm">
                  {clients.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-10 text-neutral-500"
                      >
                        No hay clientes registrados todavía.
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-4 font-bold text-white">
                          {client.name}
                        </td>
                        <td className="p-4 text-neutral-300">{client.phone}</td>
                        <td className="p-4 text-neutral-400">
                          {client.dni || "-"}
                        </td>
                        <td className="p-4 text-neutral-400">
                          {client.address || "-"}
                        </td>
                        <td className="p-4 font-semibold text-emerald-400">
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
      </div>
    </div>
  );
}
