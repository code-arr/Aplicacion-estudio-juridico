export type Role = "admin" | "lawyer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  token: string;
  // Podés agregar más según tu backend: token, casos, etc.
}
