import { handleResponse } from "./communicationApi";

const API_URL = import.meta.env.VITE_API_URL || "https://digitalness-backend.onrender.com/api";

export const getEmployees = async () => {
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch employees");
  // Backend may return array directly or { users: [] }
  return Array.isArray(data) ? data : data.users || [];
};