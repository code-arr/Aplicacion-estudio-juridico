import axios from "axios";
import { useLawyerStore } from "@/store/useLawyerStore";

const api = axios.create({
  baseURL: "http://estudio-backend-dev.us-east-1.elasticbeanstalk.com",
  timeout: 5000,
});

// Asegura que el lawyerId siempre sea el ACTUAL del store
api.interceptors.request.use((config) => {
  const lawyerId = useLawyerStore.getState().lawyer?.id;
  if (lawyerId) {
    config.params = { ...(config.params || {}), lawyerId };
  }
  return config;
});

export default api;
