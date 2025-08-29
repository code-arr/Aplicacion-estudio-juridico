import axios from "axios";

const api = axios.create({
  baseURL: "http://estudio-backend-dev.us-east-1.elasticbeanstalk.com/", // ⬅️ Cambiá esto según tu backend
  timeout: 5000,
});

export default api;
