export type Role = "admin" | "lawyer";

export interface User {
  id: string;
  email: string;
  role: Role;
  googleEmail?: string;
}
