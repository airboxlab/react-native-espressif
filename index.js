import { NativeModules, NativeEventEmitter } from "react-native";
import PropTypes from "prop-types";

const { Espressif } = NativeModules;

const Wrapper = () => {
  const RNEspressifEvent = new NativeEventEmitter(Espressif);
  if (Espressif.devicesStateSub) {
    Espressif.devicesStateSub.remove();
  }

  Espressif.subscription = RNEspressifEvent.addListener(
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

Wrapper.ConnectionType = {
  WIFI: "wifi",
  Bluetooth: "bluetooth"
};

Wrapper.Options = {
  TRANSPORT: "transport_type",
  SECURITY: "security_type"
};

Wrapper.Security = {
  Sec0: "sec0",
  Sec1: "sec1"
};

export default Wrapper;
