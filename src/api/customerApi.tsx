const API_URL = import.meta.env.VITE_API_URL || 'https://digitalness-backend.onrender.com/api';

const getToken = () => localStorage.getItem('token');

export const getCustomers = async () => {
  const res = await fetch(`${API_URL}/customers`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch customers');
  const data = await res.json();
  return Array.isArray(data) ? data : data.customers || data.data || [];
};