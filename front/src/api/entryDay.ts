import axios from "./axios";

export const getTop10ByLawyer = async () => {
  return (await axios.get("entry-day/getTop10ByLawyerId")).data;
};

export const getClientDetail = async (clientId: string) => {
  return (await axios.get(`entry-day/getClientDetail/${clientId}`)).data;
};

export const getMonthlyByLawyer = async () => {
  return (await axios.get("entry-day/getMonthlyTimeByLawyerId")).data;
};
