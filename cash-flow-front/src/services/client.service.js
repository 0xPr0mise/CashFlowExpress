const API_URL = "http://localhost:3000";

export async function getClients() {
  try {
    const res = await fetch(`${API_URL}/clients`);
    return await res.json();
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    return [];
  }
}

export async function createClient(data) {
  try {
    // Aseguramos que si referredById está vacío (""), se envíe como null para Prisma
    const payload = {
      ...data,
      referredById:
        data.referredById && data.referredById.trim() !== ""
          ? data.referredById
          : null,
    };

    const res = await fetch(`${API_URL}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Error en la respuesta del servidor al crear el cliente");
    }

    return await res.json();
  } catch (err) {
    console.error("Error al crear cliente:", err);
    throw err;
  }
}

export async function deleteClient(id) {
  try {
    const res = await fetch(`${API_URL}/clients/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (err) {
    console.error("Error al eliminar cliente:", err);
    throw err;
  }
}
