import type { Process } from "@/types/Process";
import axios from "./axios";

export const getAllProcesses = async (): Promise<Process[]> => {
  return (await axios.get("process/getAll")).data;
};

export const getProcessesByClientItem = async (
  itemId: string
): Promise<Process[]> => {
  return (await axios.get(`process/getByClientItemId/${itemId}`)).data;
};

export const createProcess = async (
  newProcess: Process,
  clientId: string,
  clientItemId: string
): Promise<Process> => {
  return (
    await axios.post(`process/create/${clientItemId}`, {
      ...newProcess,
      clientId: clientId,
    })
  ).data;
};

export const updateProcess = async (
  processId: string,
  data: Partial<Process>
) => {
  return (await axios.put(`process/update/${processId}`, { data })).data;
};

export const deleteProcess = async (processId: string): Promise<void> => {
  return (await axios.delete(`process/delete/${processId}`)).data;
};
