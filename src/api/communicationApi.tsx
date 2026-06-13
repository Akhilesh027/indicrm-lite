import {
  mockGetCustomerCommunications,
  mockGetEmployeeCommunications,
  mockCreateCustomerCommunication,
  mockCreateEmployeeCommunication,
} from '@/lib/mockBackend';

export const getCustomerCommunications = (customerId: string) => mockGetCustomerCommunications(customerId);
export const getEmployeeCommunications = (employeeId: string) => mockGetEmployeeCommunications(employeeId);
export const createCustomerCommunication = (payload: any) => mockCreateCustomerCommunication(payload);
export const createEmployeeCommunication = (payload: any) => mockCreateEmployeeCommunication(payload);
