export enum ESPSecurityType {
  Sec0 = "sec0",
  Sec1 = "sec1"
}

export enum ESPTransportType {
  Wifi = "wifi",
  Bluetooth = "bluetooh"
}

export enum ESPDeviceState {
  Configured = "CONFIGURED",
  SessionEstablished = "SESSION_ESTABLISHED",
  Disconnected = "DISCONNECTED"
}

export enum ESPNetworkStatus {
  NotStarted = "NOT_STARTED",
  InProgress = "IN_PROGRESS",
  Ok = "OK",
  Nok = "NOK"
}

interface NetworkComponentStatus {
  ip: boolean;
  internet: boolean;
  cloud: boolean;
}

interface Config {
  transportType: ESPTransportType;
  securityType: ESPSecurityType;
  bleDeviceNamePrefix: string;
  wifiBaseUrl: string;
  wifiNetworkNamePrefix: string;
}

interface Device {
  name: string;
  uuid: string;
  state: ESPEventState;
  onNetworkStatusChanged: (status: ESPNetworkStatus, components: NetworkComponentStatus) => void;
  onStatusChanged: (device: Device) => void;
  startSession();
  connect();
  setCredentials(ssid: string, passphrase: string);
}

export enum ESPEventState {
  DeviceNotFound = "DEVICES_NOT_FOUND",
  Unknown = "UNKNOWN",
  DevicesFounds = "DEVICES_FOUND",
  DeviceUpdated = "DEVICE_UPDATED"
}

export interface Event {
  state: ESPEventState;
}

export interface Espressif {
  setConfig(config: Config): Promise<Void>;
  onStateChanged: (state: State, devices: [Device], error: Error?) => void;
}

export interface EspressifWrapper extends Espressif {
  (): Espressif;
}

declare const Espressif: EspressifWrapper;

export default Espressif;
