const API_URL = "http://localhost:3000/analytics";

export async function getAnalytics() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener las analíticas");
  return res.json();
}
