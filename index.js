import { NativeModules, NativeEventEmitter } from "react-native";
import PropTypes from "prop-types";

const { Espressif } = NativeModules;

const Wrapper = () => {
  const RNEspressifEvent = new NativeEventEmitter(Espressif);
  if (Espressif.devicesStateSub) {
    Espressif.devicesStateSub.remove();
  }

  Espressif.devicesStateSub = RNEspressifEvent.addListener(
    "devices-state",
    dataStr => {
      const data = JSON.parse(dataStr);

      this.stateChanged(data.state, data.peripherals);
    }
  );

  Espressif.onStateChanged = callback => {
    this.stateChanged = callback;
  };

  return {
    ...Espressif
  };
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
  Configured: "CONFIGURED"
};

export default Wrapper;
