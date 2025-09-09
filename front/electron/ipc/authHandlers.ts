import { ipcMain } from "electron";
import {
  saveAuthData,
  getAuthData,
  clearAuthData,
} from "../store/authStore.js";

ipcMain.handle("auth:save", (_event, auth) => {
  saveAuthData(auth);
});
ipcMain.handle("auth:get", getAuthData);
ipcMain.handle("auth:clear", clearAuthData);
