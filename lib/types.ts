export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export type ItemStatus = "ACTIVE" | "EXPIRED";

export type ItemTimes = "2_minutes" | "5_minutes" | "15_minutes";

export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  userId: string;
  status: ItemStatus;
  createdAt: string;
  expiresAt: string;
}

export interface CreateItemRequest {
  name: string;
  imageUrl: string;
  description: string;
  userId: string;
  times: ItemTimes;
}

export interface UpdateItemStatusRequest {
  status: ItemStatus;
}

export interface Like {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
}

export interface CreateLikeRequest {
  userId: string;
  itemId: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}
