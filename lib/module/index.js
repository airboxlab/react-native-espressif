import { NativeEventEmitter, NativeModules } from 'react-native';
const {
  Espressif
} = NativeModules;
export let WifiAuth;

(function (WifiAuth) {
  WifiAuth["WPA2"] = "WPA2_PSK";
  WifiAuth["WPA_WPA2"] = "WPA_WPA2_PSK";
  WifiAuth["WPA_ENTERPRISE"] = "WPA_ENTERPRISE";
  WifiAuth["OPEN"] = "OPEN";
})(WifiAuth || (WifiAuth = {}));

export let ESPTransportType;

(function (ESPTransportType) {
  ESPTransportType["Bluetooth"] = "bluetooth";
  ESPTransportType["Wifi"] = "wifi";
})(ESPTransportType || (ESPTransportType = {}));

export let ESPSecurityType;

(function (ESPSecurityType) {
  ESPSecurityType["Sec0"] = "sec0";
  ESPSecurityType["Sec1"] = "sec1";
})(ESPSecurityType || (ESPSecurityType = {}));

export let ESPDeviceState;

(function (ESPDeviceState) {
  ESPDeviceState["Configured"] = "CONFIGURED";
  ESPDeviceState["SessionEstablished"] = "SESSION_ESTABLISHED";
  ESPDeviceState["NetworkTest"] = "NETWORK_TEST";
  ESPDeviceState["Disconnected"] = "DISCONNECTED";
  ESPDeviceState["NotConfigured"] = "NOT_CONFIGURED";
})(ESPDeviceState || (ESPDeviceState = {}));

export let ESPNetworkStatus;

(function (ESPNetworkStatus) {
  ESPNetworkStatus["NotStarted"] = "NOT_STARTED";
  ESPNetworkStatus["InProgress"] = "IN_PROGRESS";
  ESPNetworkStatus["Ok"] = "OK";
  ESPNetworkStatus["Nok"] = "NOK";
})(ESPNetworkStatus || (ESPNetworkStatus = {}));

export let ESPEventState;

(function (ESPEventState) {
  ESPEventState["DeviceNotFound"] = "DEVICES_NOT_FOUND";
  ESPEventState["Unknown"] = "UNKNOWN";
  ESPEventState["DevicesFounds"] = "DEVICES_FOUND";
  ESPEventState["DeviceUpdated"] = "DEVICE_UPDATED";
})(ESPEventState || (ESPEventState = {}));

export let ESPBluetoothState;

(function (ESPBluetoothState) {
  ESPBluetoothState["Unknown"] = "UNKNOWN";
  ESPBluetoothState["Resetting"] = "RESETTING";
  ESPBluetoothState["Unsupported"] = "UNSUPPORTED";
  ESPBluetoothState["Unauthorized"] = "UNAUTHORIZED";
  ESPBluetoothState["PoweredOff"] = "POWERED_OFF";
  ESPBluetoothState["PoweredOn"] = "POWERED_ON";
})(ESPBluetoothState || (ESPBluetoothState = {}));

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
    const wifisJSON = await Espressif.scanWifi(device.uuid);
    return JSON.parse(wifisJSON);
  };

  device.networkTest = async () => {
    return await Espressif.networkTestStatus(device.uuid);
  };

  device.disconnect = async () => {
    return await Espressif.disconnect(device.uuid);
  };

  device.getDeviceInfo = async () => {
    const infoJson = await Espressif.getDeviceInfo();
    return JSON.parse(infoJson);
  };

  return device;
};

const Wrapper = () => {
  let peripherals = [];
  const RNEspressifEvent = new NativeEventEmitter(Espressif); // RNEspressifEvent.listeners('bluetooth-status').forEach(listener => listener.remove());
  // RNEspressifEvent.listeners('devices-state').forEach(listener => listener.remove());
  // RNEspressifEvent.listeners('device-status').forEach(listener => listener.remove());
  // RNEspressifEvent.listeners('network-state').forEach(listener => listener.remove());
  // RNEspressifEvent.listeners('devices-list').forEach(listener => listener.remove());

  RNEspressifEvent.removeAllListeners('bluetooth-status');
  RNEspressifEvent.removeAllListeners('devices-state');
  RNEspressifEvent.removeAllListeners('device-status');
  RNEspressifEvent.removeAllListeners('network-state');
  RNEspressifEvent.removeAllListeners('devices-list');
  RNEspressifEvent.addListener('bluetooth-status', status => {
    Espressif.bluetoothStatus = status;
  });

  Espressif.addBluetoothStatusListener = callback => {
    return RNEspressifEvent.addListener('bluetooth-status', callback);
  };

  Espressif.addDevicesListListener = callback => {
    return RNEspressifEvent.addListener('devices-list', callback);
  };

  RNEspressifEvent.addListener('devices-state', json => {
    const data = JSON.parse(json);
    peripherals = data.peripherals;
    peripherals.forEach(peripheral => setCallback(peripheral));
    RNEspressifEvent.emit('devices-list', data.state, peripherals);
  });
  RNEspressifEvent.addListener('device-status', dataStr => {
    console.info({
      dataStr
    });
    const data = JSON.parse(dataStr);
    const index = peripherals.findIndex(peripheral => data.uuid === peripheral.uuid);
    console.info(data);
    Object.assign(peripherals[index], data);
    peripherals[index].onStatusChanged(peripherals[index]);
  });
  RNEspressifEvent.addListener('network-state', dataStr => {
    const {
      uuid,
      status,
      components
    } = JSON.parse(dataStr);
    const index = peripherals.findIndex(peripheral => uuid === peripheral.uuid);
    console.info({
      dataStr
    });
    peripherals[index].onNetworkStatusChanged(status, components);
  });
  return Espressif;
};

export default Wrapper;
//# sourceMappingURL=index.js.map