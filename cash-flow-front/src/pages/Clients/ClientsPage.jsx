import { useState, useEffect } from "react";
import { getClients, createClient, deleteClient } from "../../services/client.service";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dni: "",
    address: "",
    reference: "",
    creditLimit: ""
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
        creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : 0
      });

      setForm({ name: "", phone: "", dni: "", address: "", reference: "", creditLimit: "" });
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
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h2>Gestión de Clientes</h2>

      <form onSubmit={handleSubmit} style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px", display: "grid", gap: "10px" }}>
        <h3>Registrar Nuevo Cliente</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input type="text" name="name" placeholder="Nombre y Apellido *" value={form.name} onChange={handleChange} style={{ padding: "8px" }} />
          <input type="text" name="phone" placeholder="Teléfono *" value={form.phone} onChange={handleChange} style={{ padding: "8px" }} />
          <input type="text" name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} style={{ padding: "8px" }} />
          <input type="text" name="address" placeholder="Dirección" value={form.address} onChange={handleChange} style={{ padding: "8px" }} />
          <input type="text" name="reference" placeholder="Referencia" value={form.reference} onChange={handleChange} style={{ padding: "8px" }} />
          <input type="number" name="creditLimit" placeholder="Límite de Crédito" value={form.creditLimit} onChange={handleChange} style={{ padding: "8px" }} />
        </div>
        <button type="submit" style={{ background: "#28a745", color: "white", padding: "10px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
          Guardar Cliente
        </button>
      </form>

      <h3>Lista de Clientes</h3>
      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>DNI</th>
            <th>Dirección</th>
            <th>Límite Crédito</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", color: "#777" }}>No hay clientes registrados todavía.</td>
            </tr>
          ) : (
            clients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.phone}</td>
                <td>{client.dni || "-"}</td>
                <td>{client.address || "-"}</td>
                <td>${client.creditLimit || 0}</td>
                <td style={{ textAlign: "center" }}>
                  <button onClick={() => handleDelete(client.id)} style={{ background: "#dc3545", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}