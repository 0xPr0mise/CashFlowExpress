const API_URL = "http://localhost:3000/cash";

export async function getCashMovements() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener los movimientos de caja");
  return res.json();
}

export async function getCashBalance() {
  const res = await fetch(`${API_URL}/balance`);
  if (!res.ok) throw new Error("Error al obtener el balance");
  return res.json();
}

export async function createCashMovement(movementData) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movementData),
  });
  if (!res.ok) throw new Error("Error al registrar el movimiento de caja");
  return res.json();
}
