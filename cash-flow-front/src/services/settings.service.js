const API_URL = "http://localhost:3000/settings";

export async function getSettings() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener configuraciones");
  return res.json();
}

export async function saveSetting(key, value) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error("Error al guardar configuración");
  return res.json();
}

// NUEVO: Función para obtener la URL de descarga del backup
export function getBackupDownloadUrl() {
  return `${API_URL}/backup/download`;
}