import { NativeModules, NativeEventEmitter } from "react-native";
import PropTypes from "prop-types";

const { Espressif } = NativeModules;

let peripherals = [];

const setCallback = device => {
  device.startSession = async () => {
    return await Espressif.startSession(device.uuid);
  };

  device.connect = async () => {
    return await Espressif.connectTo(device.uuid);
  };

  device.setCredentials = async (ssid, passphrase) => {
    return await Espressif.setCredentials(ssid, passphrase, device.uuid);
  };

  device.scanWifi = async () => {
    return await Espressif.scanWifi(device.uuid);
  };

  device.networkTest = async () => {
    return await Espressif.networkTestStatus(device.uuid);
  };

  return device;
};

const Wrapper = () => {
  const RNEspressifEvent = new NativeEventEmitter(Espressif);

  if (Espressif.deviceStatus) Espressif.deviceStatus.remove();

  if (Espressif.deviceNetworkStatus) Espressif.deviceNetworkStatus.remove();

  if (Espressif.devicesStateSub) {
    Espressif.devicesStateSub.remove();
  }

  Espressif.deviceStatus = RNEspressifEvent.addListener(
    "device-status",
    dataStr => {
      const data = JSON.parse(dataStr);
      console.info(data);
      const index = peripherals.findIndex(
        peripheral => data.uuid === peripheral.uuid
      );

      peripherals[index] = { ...peripherals[index], ...data };
      peripherals[index].onStatusChanged(peripherals[index]);
    }
  );

  Espressif.deviceNetworkStatus = RNEspressifEvent.addListener(
    "network-state",
    dataStr => {
      const data = JSON.parse(dataStr);
      const index = peripherals.findIndex(
        peripheral => data.uuid === peripheral.uuid
      );
      peripherals[index].onNetworkStatusChanged(data.status, data.components);
    }
  );

  Espressif.devicesStateSub = RNEspressifEvent.addListener(
    "devices-state",
    dataStr => {
      const data = JSON.parse(dataStr);

      peripherals = data.peripherals;
      peripherals.forEach(peripheral => setCallback(peripheral));
      Espressif.OnStateChanged(data.state, peripherals);
    }
  );

  return Espressif;
};

export const ESPTransportType = {
  Bluetooth: "bluetooth",
  Wifi: "wifi"
};

export const ESPSecurityType = {
  Sec0: "sec0",
  Sec1: "sec1"
};

export const ESPDeviceState = {
  Configured: "CONFIGURED",
  SessionEstablished: "SESSION_ESTABLISHED"
};

export default Wrapper;
