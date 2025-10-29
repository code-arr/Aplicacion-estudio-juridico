//src/api/entryDay.ts
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

// ===== NUEVAS: stats pedidas por el dueño =====
export const getCaseCycle = async (clientItemId: string) => {
  return (await axios.get("entry-day/case-cycle", { params: { clientItemId } }))
    .data;
};

export const getCaseCost = async (clientItemId: string) => {
  return (await axios.get("entry-day/case-cost", { params: { clientItemId } }))
    .data;
};

export const getClientAverages = async (
  clientId: string,
  opts?: { year?: number; closedOnly?: boolean }
) => {
  const data = (
    await axios.get("entry-day/client-averages", {
      params: { clientId, ...opts },
    })
  ).data;

  return data;
};

export const getStudyAverages = async (opts?: {
  year?: number;
  lawyerId?: string;
}) => {
  return (await axios.get("entry-day/study-averages", { params: { ...opts } }))
    .data;
};

export const getPracticeAreas = async (
  clientId: string,
  opts?: {
    level?: "category" | "section" | "itemType";
    includeHours?: boolean;
    includeCost?: boolean;
    year?: number;
  }
) => {
  const data = (
    await axios.get("entry-day/practice-areas", {
      params: { clientId, ...opts },
    })
  ).data;

  return data;
};

export const getCostSummary = async (params: {
  clientId: string;
  clientItemId?: string;
  year?: number;
  month?: number;
}) => {
  return (await axios.get("entry-day/getCostSummary", { params })).data;
};
