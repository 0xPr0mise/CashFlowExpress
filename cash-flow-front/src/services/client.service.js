const API_URL = 'http://localhost:3000';

export async function getClients() {
  try {
    const res = await fetch(`${API_URL}/clients`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createClient(data) {
  const res = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function deleteClient(id) {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: 'DELETE',
  });
  return await res.json();
}