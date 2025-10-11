// src/api/admin.ts
import type { Client } from "@/types/Client";
import type { Lawyer } from "@/types/Lawyer";
import type { Admin } from "@/types/Admin";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export type AdminGlobalStats = {
  totalLawyers: number;
  totalClients: number;
  totalDocuments: number;
  totalTimeSec: number;
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export function getAllClients(): Promise<Client[]> {
  return apiGet<Client[]>("/admin/clients");
}

export function getAllLawyers(): Promise<Lawyer[]> {
  return apiGet<Lawyer[]>("/admin/lawyers");
}

export function getGlobalStats(): Promise<AdminGlobalStats> {
  return apiGet<AdminGlobalStats>("/admin/stats/global");
}

// 👇 NUEVO: ajustá la ruta si tu back expone otra
export function getAdminByUserId(userId: string): Promise<Admin> {
  return apiGet<Admin>(`/admin/by-user/${userId}`);
}
