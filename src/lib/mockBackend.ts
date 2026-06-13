/**
 * Mock replacements for the former backend API + socket modules.
 * Kept in this file to avoid touching call sites; re-exported via
 * lightweight shim files at the original import paths.
 */
import { customers as dummyCustomers, employees as dummyEmployees } from '@/data/dummyData';

const delay = <T,>(value: T, ms = 80): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const KEY = 'digitalness-mock-communications-v1';

interface MockMessage {
  _id: string;
  channel: string;
  direction: string;
  subject: string;
  message: string;
  createdAt: string;
  targetId: string;
  targetType: 'customer' | 'employee';
  byName: string;
  [key: string]: any;
}

const loadAll = (): MockMessage[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
const saveAll = (rows: MockMessage[]) => localStorage.setItem(KEY, JSON.stringify(rows));

export const mockGetCustomers = () =>
  delay(dummyCustomers.map((c) => ({
    _id: c.id, id: c.id, name: c.name, email: (c as any).email, phone: (c as any).contactNumbers?.[0] || (c as any).contactNumber, businessName: (c as any).businessName || (c as any).business,
  })));

export const mockGetEmployees = () =>
  delay(dummyEmployees.map((e) => ({
    _id: e.id, id: e.id, name: e.name, email: e.email, phone: e.phone, role: e.role, department: e.department,
  })));

export const mockGetCustomerCommunications = (customerId: string) =>
  delay(loadAll().filter((m) => m.targetType === 'customer' && m.targetId === customerId));

export const mockGetEmployeeCommunications = (employeeId: string) =>
  delay(loadAll().filter((m) => m.targetType === 'employee' && m.targetId === employeeId));

const create = (targetType: 'customer' | 'employee', targetId: string, payload: any): MockMessage => {
  const row: MockMessage = {
    _id: `MSG_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    channel: payload.channel,
    direction: payload.direction,
    subject: payload.subject,
    message: payload.message,
    createdAt: new Date().toISOString(),
    targetId,
    targetType,
  };
  const all = loadAll();
  all.unshift(row);
  saveAll(all);
  return row;
};

export const mockCreateCustomerCommunication = (payload: any) =>
  delay(create('customer', payload.customerId, payload));

export const mockCreateEmployeeCommunication = (payload: any) =>
  delay(create('employee', payload.employeeId, payload));

// Stub socket — matches socket.io-client surface used by the app.
type Handler = (...args: any[]) => void;
const handlers: Record<string, Handler[]> = {};
export const mockSocket = {
  on: (event: string, fn: Handler) => {
    (handlers[event] = handlers[event] || []).push(fn);
  },
  off: (event: string, fn?: Handler) => {
    if (!handlers[event]) return;
    handlers[event] = fn ? handlers[event].filter((h) => h !== fn) : [];
  },
  emit: (_event: string, ..._args: any[]) => { /* no-op in mock mode */ },
  connect: () => mockSocket,
  disconnect: () => mockSocket,
  connected: false,
  id: 'mock-socket',
};
