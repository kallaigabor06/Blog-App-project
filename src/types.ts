export type Role = "admin" | "adminisztrátor" | string;

export interface User {
  id: number;
  username: string;
  role: Role;
  nev: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  categoryId?: number;
}

export interface PostCreateInput {
  title: string;
  content: string;
  categoryId?: number;
}