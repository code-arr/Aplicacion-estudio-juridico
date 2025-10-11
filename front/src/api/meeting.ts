import type { Meeting } from "@/types/Meeting";
import axios from "./axios";

export const getAllMeetings = async (): Promise<Meeting[]> => {
  return (await axios.get("meeting/getAll")).data;
};

export const getMeetingsByClientItem = async (
  itemId: string
): Promise<Meeting[]> => {
  return (await axios.get(`meeting/getByClientItemId/${itemId}`)).data;
};

export const createMeeting = async (
  newMeeting: any,
  clientItemId: string
): Promise<Meeting> => {
  console.log(newMeeting);

  return (await axios.post(`meeting/create/${clientItemId}`, newMeeting)).data;
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
  return (await axios.delete(`meeting/delete/${meetingId}`)).data;
};
