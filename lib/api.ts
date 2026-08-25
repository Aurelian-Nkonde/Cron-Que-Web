import type {
  AuthResponse,
  CreateItemRequest,
  CreateLikeRequest,
  CreateUserRequest,
  Item,
  Like,
  LoginRequest,
  Notification,
  UpdateItemStatusRequest,
  User,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new ApiError(res.status, message || res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function registerUser(body: CreateUserRequest): Promise<User> {
  return request<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getUsers(token: string): Promise<User[]> {
  return request<User[]>("/api/users", { token });
}

export function getUserById(id: string, token: string): Promise<User> {
  return request<User>(`/api/users/${id}`, { token });
}

export function createItem(body: CreateItemRequest, token: string): Promise<Item> {
  return request<Item>("/api/items", {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

export function getItems(token: string): Promise<Item[]> {
  return request<Item[]>("/api/items", { token });
}

export function getItemById(id: string, token: string): Promise<Item> {
  return request<Item>(`/api/items/${id}`, { token });
}

export function updateItemStatus(
  id: string,
  body: UpdateItemStatusRequest,
  token: string,
): Promise<Item> {
  return request<Item>(`/api/items/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
    token,
  });
}

export function createLike(body: CreateLikeRequest, token: string): Promise<Like> {
  return request<Like>("/api/likes", {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

export function getLikes(token: string): Promise<Like[]> {
  return request<Like[]>("/api/likes", { token });
}

export function deleteLike(id: string, token: string): Promise<void> {
  return request<void>(`/api/likes/${id}`, {
    method: "DELETE",
    token,
  });
}

export function getNotifications(token: string): Promise<Notification[]> {
  return request<Notification[]>("/api/notifications", { token });
}
