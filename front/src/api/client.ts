import type { Client } from "@/types/Client";
import axios from "./axios";

export const getClients = async (): Promise<Client[]> => {
  return (await axios.get("/client/getAll")).data;
};

export const getClientsByLawyerId = async (
  lawyerId: string
): Promise<Client[]> => {
  return (await axios.get(`client/getByLawyerId/${lawyerId}`)).data;
};

export const createClient = async (client: Client): Promise<Client> => {
  return (await axios.post("/client/create", client)).data;
};

export const updateClient = async (
  id: string,
  client: Partial<Client>
): Promise<Client> => {
  return (await axios.put(`/client/update/${id}`, client)).data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await axios.delete(`/client/delete/${id}`);
};

export const linkClientToLawyer = async (clientId: string): Promise<void> => {
  return (await axios.post(`/client/link/`, clientId)).data;
};

type SendMailInput = {
  email: string; // destinatario
  subject: string; // asunto
  description: string; // cuerpo/mensaje
  title: string; // título del documento
  contractFile: File | null; // archivo adjunto (opcional)
  lawyerEmail: string; // remitente (query param)
};

export async function sendDocument({
  email,
  subject,
  description,
  title,
  contractFile,
  lawyerEmail,
}: SendMailInput) {
  const form = new FormData();
  form.append("email", email);
  form.append("subject", subject);
  form.append("description", description);
  form.append("title", title);
  if (contractFile) form.append("contractFile", contractFile); // <- NOMBRE EXACTO

  const { data } = await axios.post(
    `/client/sendDocument?lawyerEmail=${encodeURIComponent(lawyerEmail)}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
}
