/**
 * Mock backend interceptor.
 *
 * Replaces all real network calls to the Digitalness backend (or any /api/* path)
 * with dummy data so the CRM works fully offline. Any page that still uses
 * `fetch(...)` against the old backend now receives synthetic responses instead
 * of network errors. Pages built on Zustand stores are unaffected.
 */

import { employees, leads, customers, branches } from '@/data/dummyData';
import { invoices } from '@/data/invoiceData';
import { deals } from '@/data/dealData';

const BACKEND_HOSTS = ['digitalness-backend.onrender.com'];

const ok = (body: any, status = 200): Response => {
  // Construct a Response-like object whose .json() returns the raw body
  // (preserves non-enumerable / extra properties that JSON.stringify would drop).
  const headers = new Headers({ 'Content-Type': 'application/json' });
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Mock',
    headers,
    redirected: false,
    type: 'basic',
    url: '',
    clone() { return ok(body, status); },
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob([]),
    formData: async () => new FormData(),
    bytes: async () => new Uint8Array(),
    body: null,
    bodyUsed: false,
  } as unknown as Response;
};

// Wrap an array so it also responds to common envelope keys like
// { success, data, users, customers, ... } that various callers expect.
const envelope = (key: string, list: any[]) => {
  const out: any = [...list];
  out.success = true;
  out.data = list;
  out.results = list;
  out[key] = list;
  out.total = list.length;
  out.count = list.length;
  return out;
};

const newId = (prefix = 'ID') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const dummyUsers = employees.map((e) => ({
  _id: e.id,
  id: e.id,
  name: e.name,
  email: e.email,
  phone: e.phone,
  role: e.role,
  department: e.department,
  branchId: e.branchId,
  status: e.status,
}));

const route = (method: string, path: string, body: any): any => {
  // Strip leading "/api"
  const p = path.replace(/^\/api/, '') || '/';

  // ---- Auth ----
  if (p === '/auth/login' && method === 'POST') {
    const email = body?.email || 'admin@digitalness.in';
    const user =
      dummyUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ||
      { _id: 'EMP001', id: 'EMP001', name: 'Admin User', email, role: 'Admin', department: 'Management' };
    return { success: true, token: 'mock-token-' + newId(), user };
  }
  if (p === '/auth/register' && method === 'POST') {
    return { success: true, message: 'Registered', user: { _id: newId('EMP'), ...body } };
  }
  if (p === '/auth/me' || p === '/me') {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return { success: true, user: u };
    } catch {
      return { success: true, user: dummyUsers[0] };
    }
  }

  // ---- Listing endpoints ----
  if (p.startsWith('/users')) {
    if (method === 'GET') return envelope('users', dummyUsers);
    if (method === 'POST') return { success: true, user: { _id: newId('EMP'), ...body } };
    if (method === 'PUT' || method === 'PATCH') return { success: true, user: body };
    if (method === 'DELETE') return { success: true };
  }
  if (p.startsWith('/employees')) return envelope('employees', dummyUsers);
  if (p.startsWith('/branches')) {
    if (method === 'GET') return envelope('branches', branches);
    return { success: true, branch: { _id: newId('BR'), ...body } };
  }
  if (p.startsWith('/customers')) {
    if (method === 'GET') return envelope('customers', customers);
    if (method === 'POST') return { success: true, customer: { _id: newId('CUST'), ...body } };
    return { success: true };
  }
  if (p.startsWith('/leads')) {
    if (method === 'GET') return envelope('leads', leads);
    if (method === 'POST') return { success: true, lead: { _id: newId('LEAD'), ...body } };
    return { success: true };
  }
  if (p.startsWith('/deals')) {
    if (method === 'GET') return envelope('deals', deals);
    if (method === 'POST') return { success: true, deal: { _id: newId('DEAL'), ...body } };
    return { success: true };
  }
  if (p.startsWith('/invoices')) {
    if (method === 'GET') return envelope('invoices', invoices);
    return { success: true, invoice: { _id: newId('INV'), ...body } };
  }
  if (p.startsWith('/payments')) return envelope('payments', []);
  if (p.startsWith('/works')) {
    if (method === 'GET') return envelope('works', []);
    return { success: true };
  }
  if (p.startsWith('/tickets')) {
    if (method === 'GET') return envelope('tickets', []);
    return { success: true, ticket: { _id: newId('TKT'), ...body } };
  }
  if (p.startsWith('/templates')) {
    if (method === 'GET') return envelope('templates', []);
    return { success: true, template: { _id: newId('TPL'), ...body } };
  }
  if (p.startsWith('/notifications')) {
    if (method === 'GET') return envelope('notifications', []);
    return { success: true };
  }
  if (p.startsWith('/work-approvals')) {
    if (method === 'GET') return envelope('approvals', []);
    return { success: true };
  }
  if (p.startsWith('/communications')) {
    if (method === 'GET') return envelope('communications', []);
    return { success: true, message: 'Saved' };
  }
  if (p.startsWith('/daily-updates') || p.startsWith('/dailyUpdates')) {
    if (method === 'GET') return envelope('dailyUpdates', []);
    return { success: true };
  }
  if (p.startsWith('/blogs')) {
    if (method === 'GET') return envelope('blogs', []);
    return { success: true };
  }
  if (p.startsWith('/recruitment') || p.startsWith('/candidates')) {
    if (method === 'GET') return envelope('candidates', []);
    return { success: true };
  }
  if (p.startsWith('/clients/create-login')) {
    return { success: true, message: 'Login created', credentials: { email: body?.email, password: 'demo123' } };
  }

  // Default fallback
  if (method === 'GET') return envelope('items', []);
  return { success: true };
};

const shouldIntercept = (url: string) => {
  if (!url) return false;
  if (BACKEND_HOSTS.some((h) => url.includes(h))) return true;
  if (url.startsWith('/api/') || url.includes('/api/')) {
    // Avoid intercepting Vite asset paths
    return !/\.(js|css|map|svg|png|jpg|jpeg|webp|woff2?)(\?|$)/.test(url);
  }
  return false;
};

export const installMockApi = () => {
  if (typeof window === 'undefined') return;
  if ((window as any).__MOCK_API_INSTALLED__) return;
  (window as any).__MOCK_API_INSTALLED__ = true;

  const realFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    if (!shouldIntercept(url)) return realFetch(input as any, init);

    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    let body: any = undefined;
    try {
      if (init?.body && typeof init.body === 'string') body = JSON.parse(init.body);
    } catch { /* non-JSON body */ }

    const path = (() => {
      try { return new URL(url, 'http://x').pathname; } catch { return url; }
    })();

    try {
      const data = route(method, path, body);
      return ok(data);
    } catch (e) {
      return ok({ success: false, message: 'Mock error' }, 500);
    }
  }) as typeof fetch;
};
