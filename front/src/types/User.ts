export type Role = "admin" | "lawyer";

export interface User {
  id: string;
  email: string;
  role: Role;
  // Podés agregar más según tu backend: token, casos, etc.
}
