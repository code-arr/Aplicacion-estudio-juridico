import type { Meeting } from "@/types/Meeting";
import axios from "./axios";

export const getAllMeetings = async (): Promise<Meeting[]> => {
  return (await axios.get("meeting/getAll")).data;
};

export const getMeetingsByLawyer = async (): Promise<Meeting[]> => {
  const data = await (await axios.get("meeting/getByLawyerId")).data;
  return data;
};

export const getMeetingsByClientItem = async (
  itemId: string
): Promise<Meeting[]> => {
  return (await axios.get(`meeting/getByClientItemId/${itemId}`)).data;
};

export const getMeetingsByClient = async (
  clientId: string
): Promise<Meeting[]> => {
  const data = await axios.get(`meeting/getByClientId/${clientId}`);
  return data.data;
};

export const createMeeting = async (
  newMeeting: any,
  clientId: string,
  clientItemId: string
): Promise<Meeting> => {
  return (
    await axios.post(`meeting/create/${clientItemId}`, {
      ...newMeeting,
      clientId: clientId,
    })
  ).data;
};

export const updateMeeting = async (
  meetingId: string,
  payload: Partial<Meeting>,
  lawyerEmail?: string
): Promise<Meeting> => {
  const qs = lawyerEmail
    ? `?lawyerEmail=${encodeURIComponent(lawyerEmail)}`
    : "";
  const { data } = await axios.put(
    `/meeting/update/${meetingId}${qs}`,
    payload
  );
  return data;
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
  return (await axios.delete(`meeting/delete/${meetingId}`)).data;
};

export const cancelMeeting = async (
  meetingId: string,
  lawyerEmail: string
): Promise<Meeting> => {
  return (await axios.patch(`meeting/cancel/${meetingId}`, { lawyerEmail }))
    .data;
};
