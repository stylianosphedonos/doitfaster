import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { AccessRequest, User, UserRole } from "./auth-types";
import { hashPassword } from "./password";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const REQUESTS_FILE = path.join(DATA_DIR, "access-requests.json");

const DEFAULT_ADMIN_PASSWORD = "admin123";

async function ensureUsersFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    const users = JSON.parse(raw) as User[];
    if (users.length > 0) return;
  } catch {
    // seed below
  }

  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const admin: User = {
    id: "default-admin",
    username: "admin",
    email: "admin@example.com",
    passwordHash,
    role: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(USERS_FILE, JSON.stringify([admin], null, 2));
}

async function ensureRequestsFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(REQUESTS_FILE);
  } catch {
    await fs.writeFile(REQUESTS_FILE, JSON.stringify([], null, 2));
  }
}

async function readUsers(): Promise<User[]> {
  await ensureUsersFile();
  const raw = await fs.readFile(USERS_FILE, "utf-8");
  return JSON.parse(raw) as User[];
}

async function writeUsers(users: User[]): Promise<void> {
  await ensureUsersFile();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function readRequests(): Promise<AccessRequest[]> {
  await ensureRequestsFile();
  const raw = await fs.readFile(REQUESTS_FILE, "utf-8");
  return JSON.parse(raw) as AccessRequest[];
}

async function writeRequests(requests: AccessRequest[]): Promise<void> {
  await ensureRequestsFile();
  await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2));
}

export async function getAllUsers(): Promise<User[]> {
  return readUsers();
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByUsername(
  username: string
): Promise<User | null> {
  const users = await readUsers();
  return (
    users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ??
    null
  );
}

export async function createUser(
  data: Omit<User, "id" | "createdAt" | "updatedAt">
): Promise<User> {
  const users = await readUsers();
  const now = new Date().toISOString();
  const user: User = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, "email" | "phone" | "address" | "role" | "passwordHash">>
): Promise<User | null> {
  const users = await readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const updated: User = {
    ...users[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  users[index] = updated;
  await writeUsers(users);
  return updated;
}

export async function deleteUser(id: string): Promise<boolean> {
  const users = await readUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  await writeUsers(filtered);
  return true;
}

export async function getPendingAccessRequests(): Promise<AccessRequest[]> {
  const requests = await readRequests();
  return requests.filter((r) => r.status === "pending");
}

export async function getAllAccessRequests(): Promise<AccessRequest[]> {
  return readRequests();
}

export async function getAccessRequestById(
  id: string
): Promise<AccessRequest | null> {
  const requests = await readRequests();
  return requests.find((r) => r.id === id) ?? null;
}

export async function usernameExists(username: string): Promise<boolean> {
  const user = await getUserByUsername(username);
  if (user) return true;
  const requests = await readRequests();
  return requests.some(
    (r) =>
      r.status === "pending" &&
      r.username.toLowerCase() === username.toLowerCase()
  );
}

export async function createAccessRequest(data: {
  username: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
}): Promise<AccessRequest> {
  const requests = await readRequests();
  const request: AccessRequest = {
    id: uuidv4(),
    username: data.username.trim(),
    email: data.email.trim(),
    passwordHash: data.passwordHash,
    phone: data.phone?.trim() || undefined,
    address: data.address?.trim() || undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.push(request);
  await writeRequests(requests);
  return request;
}

export async function approveAccessRequest(
  id: string,
  reviewerId: string,
  role: UserRole
): Promise<{ user: User } | { error: string }> {
  const requests = await readRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return { error: "Request not found" };

  const request = requests[index];
  if (request.status !== "pending") {
    return { error: "Request already reviewed" };
  }

  if (await getUserByUsername(request.username)) {
    return { error: "Username already taken" };
  }

  const user = await createUser({
    username: request.username,
    email: request.email,
    passwordHash: request.passwordHash,
    phone: request.phone,
    address: request.address,
    role,
  });

  requests[index] = {
    ...request,
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    assignedRole: role,
  };
  await writeRequests(requests);

  return { user };
}

export async function rejectAccessRequest(
  id: string,
  reviewerId: string
): Promise<boolean> {
  const requests = await readRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return false;

  if (requests[index].status !== "pending") return false;

  requests[index] = {
    ...requests[index],
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
  };
  await writeRequests(requests);
  return true;
}

export type { UserRole };
