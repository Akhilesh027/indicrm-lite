// ==================== Token Management ====================

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// ==================== User Management ====================

export interface User {
  _id: string;
  id?: string; // fallback
  name: string;
  email?: string;
  role: string;
  branchId?: string;
  department?: string;
  status?: string;
}

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    const user = JSON.parse(stored);
    return {
      _id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      department: user.department,
      status: user.status,
    };
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeCurrentUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// ==================== Auth Headers ====================

export const authHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const jsonHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ==================== Role Helpers ====================

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Admin";
};

export const isOperationalManager = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Operational Manager";
};

export const isAdminOrManager = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Admin" || user?.role === "Operational Manager";
};

export const isTelecaller = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Telecaller";
};

export const isBDE = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "BDE";
};

export const isSupport = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "Support";
};

export const hasRole = (allowedRoles: string[]): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return allowedRoles.includes(user.role);
};

// ==================== Logout ====================

export const logout = (redirectTo = "/login"): void => {
  removeToken();
  removeCurrentUser();
  window.location.href = redirectTo;
};