import {
  EmitterSubscription,
  EventSubscriptionVendor,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

const { Espressif } = NativeModules as {
  Espressif: EspressifType & EventSubscriptionVendor;
};

export type EspressifConfig = {
  transportType: ESPTransportType;
  securityType: ESPSecurityType;
  wifiBaseUrl?: string;
  wifiNetworkNamePrefix?: string;
  bleDeviceNamePrefix?: string;
  bleSessionUuid?: string;
  bleConfigUuid?: string;
  bleServiceUuid?: string;
};

export type EspressifDeviceInfo = {
  UUID: string;
  MACWiFi: string;
  MACEthernet: string;
  FWVersion: string;
  DeviceCompatibility: string;
};

export enum WifiAuth {
  WPA2 = 'WPA2_PSK',
  WPA_WPA2 = 'WPA_WPA2_PSK',
  WPA_ENTERPRISE = 'WPA_ENTERPRISE',
  OPEN = 'OPEN',
}

export type EspressifWifi = {
  rssi: number;
  channel: number;
  ssid: string;
  auth: WifiAuth;
};

export type EspressifDevice = {
  name: string;
  uuid: string;
  networkStatus: ESPNetworkStatus;
  state: ESPDeviceState;

  onStatusChanged: (device: EspressifDevice) => void;
  onNetworkStatusChanged: (
    status: ESPNetworkStatus,
    device: EspressifDevice
  ) => void;

  connect(): Promise<void>;
  startSession(): Promise<void>;
  setCredentials(ssid: string, passphrase: string): Promise<void>;
  scanWifi(): Promise<EspressifWifi[]>;
  networkTest(): Promise<void>;
  disconnect(): Promise<void>;
  getDeviceInfo(): Promise<EspressifDeviceInfo>;
};

export type EspressifType = {
  bluetoothStatus: ESPBluetoothState;

  /**
   *
   * @param {EspressifConfig} config - Configuration object for Espressif, MUST BE SET before any uses of RNEspressif
   */
  setConfig(config: EspressifConfig): void;
  /**
   * Start a bluetooth scan for searching every devices whose are close enough
   */
  scanDevices(): void;
  /**
   *
   * @param {BluetoothStatusCallback} callback
   */
  addBluetoothStatusListener(
    callback: BluetoothStatusCallback
  ): EmitterSubscription;

  /**
   *
   * @param {DevicesListCallback} callback
   */
  addDevicesListListener(callback: DevicesListCallback): EmitterSubscription;

  OnStateChanged: (
    state: ESPBluetoothState,
    devices: EspressifDevice[]
  ) => void;

  startSession(deviceUuid: string): Promise<void>;
  connectTo(deviceUuid: string): Promise<void>;
  setCredentials(
    ssid: string,
    passphrase: string,
    deviceUuid: string
  ): Promise<void>;
  scanWifi(deviceUuid: string): Promise<string>;
  networkTestStatus(deviceUuid: string): Promise<void>;
  disconnect(deviceUuid: string): Promise<void>;
  getDeviceInfo(): Promise<string>;
};

export interface DevicesListCallback {
  (state: ESPEventState, devices: EspressifDevice[]): void;
}

export interface BluetoothStatusCallback {
  (status: ESPBluetoothState): void;
}

export enum ESPTransportType {
  Bluetooth = 'bluetooth',
  Wifi = 'wifi',
}

export enum ESPSecurityType {
  Sec0 = 'sec0',
  Sec1 = 'sec1',
}

export enum ESPDeviceState {
  Configured = 'CONFIGURED',
  SessionEstablished = 'SESSION_ESTABLISHED',
  NetworkTest = 'NETWORK_TEST',
  Disconnected = 'DISCONNECTED',
  NotConfigured = 'NOT_CONFIGURED',
}

export enum ESPNetworkStatus {
  NotStarted = 'NOT_STARTED',
  InProgress = 'IN_PROGRESS',
  Ok = 'OK',
  Nok = 'NOK',
}

export enum ESPEventState {
  DeviceNotFound = 'DEVICES_NOT_FOUND',
  Unknown = 'UNKNOWN',
  DevicesFounds = 'DEVICES_FOUND',
  DeviceUpdated = 'DEVICE_UPDATED',
}

export enum ESPBluetoothState {
  Unknown = 'UNKNOWN',
  Resetting = 'RESETTING',
  Unsupported = 'UNSUPPORTED',
  Unauthorized = 'UNAUTHORIZED',
  PoweredOff = 'POWERED_OFF',
  PoweredOn = 'POWERED_ON',
}

const setCallback = (device: EspressifDevice): EspressifDevice => {
  device.startSession = async () => await Espressif.startSession(device.uuid);
  device.connect = async () => await Espressif.connectTo(device.uuid);
  device.setCredentials = async (ssid, passphrase) =>
    await Espressif.setCredentials(ssid, passphrase, device.uuid);

  device.scanWifi = async () => {
    const wifisJSON = await Espressif.scanWifi(device.uuid);
    return JSON.parse(wifisJSON);
  };

  device.networkTest = async () =>
    await Espressif.networkTestStatus(device.uuid);

  device.disconnect = async () => await Espressif.disconnect(device.uuid);

  device.getDeviceInfo = async () => {
    const infoJson = await Espressif.getDeviceInfo();
    return JSON.parse(infoJson);
  };

  return device;
};

const Wrapper = (): EspressifType => {
  let peripherals: EspressifDevice[] = [];

  const RNEspressifEvent = new NativeEventEmitter(Espressif);

  // RNEspressifEvent.listeners('bluetooth-status').forEach(listener => listener.remove());
  // RNEspressifEvent.listeners('devices-state').forEach(listener => listener.remove());
  // RNEspressifEvent.listeners('device-status').forEach(listener => listener.remove());
  // RNEspressifEvent.listeners('network-state').forEach(listener => listener.remove());
  // RNEspressifEvent.listeners('devices-list').forEach(listener => listener.remove());
  RNEspressifEvent.removeAllListeners('bluetooth-status');
  RNEspressifEvent.removeAllListeners('devices-state');
  RNEspressifEvent.removeAllListeners('device-status');
  RNEspressifEvent.removeAllListeners('network-state');
  RNEspressifEvent.removeAllListeners('devices-list');

  RNEspressifEvent.addListener('bluetooth-status', (status) => {
    Espressif.bluetoothStatus = status;
  });

  Espressif.addBluetoothStatusListener = (
    callback: (status: ESPBluetoothState) => void
  ): EmitterSubscription => {
    return RNEspressifEvent.addListener('bluetooth-status', callback);
  };

  Espressif.addDevicesListListener = (
    callback: DevicesListCallback
  ): EmitterSubscription => {
    return RNEspressifEvent.addListener('devices-list', callback);
  };

  RNEspressifEvent.addListener('devices-state', (json) => {
    const data = JSON.parse(json);
    peripherals = data.peripherals;

    peripherals.forEach((peripheral) => setCallback(peripheral));
    RNEspressifEvent.emit('devices-list', data.state, peripherals);
  });

  RNEspressifEvent.addListener('device-status', (dataStr) => {
    console.info({ dataStr });
    const data = JSON.parse(dataStr);
    const index = peripherals.findIndex(
      (peripheral) => data.uuid === peripheral.uuid
    );

    console.info(data);
    Object.assign(peripherals[index], data);
    peripherals[index].onStatusChanged(peripherals[index]);
  });

  RNEspressifEvent.addListener('network-state', (dataStr) => {
    const { uuid, status, components } = JSON.parse(dataStr);
    const index = peripherals.findIndex(
      (peripheral) => uuid === peripheral.uuid
    );
    console.info({ dataStr });
    peripherals[index].onNetworkStatusChanged(status, components);
  });

  return Espressif;
};

export default Wrapper;
