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

export async function payLoan(loanId, paymentData) {
  // paymentData ahora puede incluir: { amount, paymentMethod, note, targetInstallmentNumber }
  const res = await fetch(`${API_URL}/loans/${loanId}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  if (!res.ok) throw new Error("Error al registrar el pago");
  return res.json();
}

export async function getLoansByClient(clientId) {
  const res = await fetch(`${API_URL}/loans?clientId=${clientId}`);
  if (!res.ok) throw new Error("Error al obtener los préstamos del cliente");
  return res.json();
}