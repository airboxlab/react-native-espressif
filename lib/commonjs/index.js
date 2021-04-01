"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ESPBluetoothState = exports.ESPEventState = exports.ESPNetworkStatus = exports.ESPDeviceState = exports.ESPSecurityType = exports.ESPTransportType = exports.WifiAuth = void 0;

var _reactNative = require("react-native");

const {
  Espressif
} = _reactNative.NativeModules;
let WifiAuth;
exports.WifiAuth = WifiAuth;

(function (WifiAuth) {
  WifiAuth["WPA2"] = "WPA2_PSK";
  WifiAuth["WPA_WPA2"] = "WPA_WPA2_PSK";
  WifiAuth["WPA_ENTERPRISE"] = "WPA_ENTERPRISE";
  WifiAuth["OPEN"] = "OPEN";
})(WifiAuth || (exports.WifiAuth = WifiAuth = {}));

let ESPTransportType;
exports.ESPTransportType = ESPTransportType;

(function (ESPTransportType) {
  ESPTransportType["Bluetooth"] = "bluetooth";
  ESPTransportType["Wifi"] = "wifi";
})(ESPTransportType || (exports.ESPTransportType = ESPTransportType = {}));

let ESPSecurityType;
exports.ESPSecurityType = ESPSecurityType;

(function (ESPSecurityType) {
  ESPSecurityType["Sec0"] = "sec0";
  ESPSecurityType["Sec1"] = "sec1";
})(ESPSecurityType || (exports.ESPSecurityType = ESPSecurityType = {}));

let ESPDeviceState;
exports.ESPDeviceState = ESPDeviceState;

(function (ESPDeviceState) {
  ESPDeviceState["Configured"] = "CONFIGURED";
  ESPDeviceState["SessionEstablished"] = "SESSION_ESTABLISHED";
  ESPDeviceState["NetworkTest"] = "NETWORK_TEST";
  ESPDeviceState["Disconnected"] = "DISCONNECTED";
  ESPDeviceState["NotConfigured"] = "NOT_CONFIGURED";
})(ESPDeviceState || (exports.ESPDeviceState = ESPDeviceState = {}));

let ESPNetworkStatus;
exports.ESPNetworkStatus = ESPNetworkStatus;

(function (ESPNetworkStatus) {
  ESPNetworkStatus["NotStarted"] = "NOT_STARTED";
  ESPNetworkStatus["InProgress"] = "IN_PROGRESS";
  ESPNetworkStatus["Ok"] = "OK";
  ESPNetworkStatus["Nok"] = "NOK";
})(ESPNetworkStatus || (exports.ESPNetworkStatus = ESPNetworkStatus = {}));

let ESPEventState;
exports.ESPEventState = ESPEventState;

(function (ESPEventState) {
  ESPEventState["DeviceNotFound"] = "DEVICES_NOT_FOUND";
  ESPEventState["Unknown"] = "UNKNOWN";
  ESPEventState["DevicesFounds"] = "DEVICES_FOUND";
  ESPEventState["DeviceUpdated"] = "DEVICE_UPDATED";
})(ESPEventState || (exports.ESPEventState = ESPEventState = {}));

let ESPBluetoothState;
exports.ESPBluetoothState = ESPBluetoothState;

(function (ESPBluetoothState) {
  ESPBluetoothState["Unknown"] = "UNKNOWN";
  ESPBluetoothState["Resetting"] = "RESETTING";
  ESPBluetoothState["Unsupported"] = "UNSUPPORTED";
  ESPBluetoothState["Unauthorized"] = "UNAUTHORIZED";
  ESPBluetoothState["PoweredOff"] = "POWERED_OFF";
  ESPBluetoothState["PoweredOn"] = "POWERED_ON";
})(ESPBluetoothState || (exports.ESPBluetoothState = ESPBluetoothState = {}));

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
  const RNEspressifEvent = new _reactNative.NativeEventEmitter(Espressif); // RNEspressifEvent.listeners('bluetooth-status').forEach(listener => listener.remove());
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

var _default = Wrapper;
exports.default = _default;
//# sourceMappingURL=index.js.map