import Store from "electron-store";
import machine from "node-machine-id";

// Esta ID es única por dispositivo y estable
const { machineIdSync } = machine; // desestructurás del default
const machineId = machineIdSync();

const store = new Store({
  encryptionKey: machineId,
});

export default store;
