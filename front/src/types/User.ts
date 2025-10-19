// src/types/User.ts
export type Role = "admin" | "lawyer";

export interface User {
  id: string;
  email: string;
  role: Role;
  googleEmail?: string;

  lawyerId?: string;
  adminId?: string;

  createdAt: Date;
  updatedAt: Date;
}
