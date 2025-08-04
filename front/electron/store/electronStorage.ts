import Store from "electron-store";
import { machineIdSync } from "node-machine-id";

// Esta ID es única por dispositivo y estable
const machineId = machineIdSync();

const store = new Store({
  encryptionKey: machineId,
});

export default store;
