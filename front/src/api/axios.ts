import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api", // ⬅️ Cambiá esto según tu backend
  timeout: 5000,
});

export default api;
