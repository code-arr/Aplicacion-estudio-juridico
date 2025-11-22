// src/api/admin.ts
import axios from "@/api/axios";
import type { Admin } from "@/types/Admin";
import type { Client } from "@/types/Client";
import type { Lawyer } from "@/types/Lawyer";
import type { ClientItem } from "@/types/ClientItem";

export async function getAdmin(): Promise<Admin | null> {
  const { data } = await axios.get("admin");
  return data;
}

export async function getAllClients(): Promise<Client[]> {
  const { data } = await axios.get<Client[]>("/client/getAll");
  return data;
}

export async function getAllLawyers(): Promise<Lawyer[]> {
  const { data } = await axios.get<Lawyer[]>("/lawyer/getAll");
  return data;
}

export async function getAllClientItems(): Promise<ClientItem[]> {
  const { data } = await axios.get<ClientItem[]>("/clientItem/getAll");
  return data;
}

export async function deleteClient(id: string) {
  const { data } = await axios.delete(`admin/deleteClient/${id}`);
  return data; // 👈 Ahora devolvés el objeto { message: ... }
}
