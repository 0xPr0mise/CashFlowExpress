const API_URL = "http://localhost:3000";

export async function getLoans() {
  const res = await fetch(`${API_URL}/loans`);
  if (!res.ok) throw new Error("Error al obtener préstamos");
  return res.json();
}

export async function getLoanById(id) {
  const res = await fetch(`${API_URL}/loans/${id}`);
  if (!res.ok) throw new Error("Error al obtener el préstamo");
  return res.json();
}

export async function createLoan(loanData) {
  const res = await fetch(`${API_URL}/loans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loanData),
  });
  if (!res.ok) throw new Error("Error al crear el préstamo");
  return res.json();
}

export async function deleteLoan(id) {
  const res = await fetch(`${API_URL}/loans/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar el préstamo");
  return res.json();
}