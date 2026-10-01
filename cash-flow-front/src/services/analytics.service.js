const API_URL = "http://localhost:3000/analytics";

export async function getAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.preset) params.append("preset", filters.preset);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const url = `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener las analíticas");
  return res.json();
}
