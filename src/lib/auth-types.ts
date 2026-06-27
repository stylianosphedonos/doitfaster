export type UserRole = "admin" | "superuser" | "user";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type AccessRequestStatus = "pending" | "approved" | "rejected";

export interface AccessRequest {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
  status: AccessRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  assignedRole?: UserRole;
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  superuser: "Super user",
  user: "User",
};

export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin" || role === "superuser";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

export function canReviewAccessRequests(role: UserRole): boolean {
  return role === "admin" || role === "superuser";
}

export function canExportPdf(role: UserRole | null): boolean {
  return role !== null;
}
