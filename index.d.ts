export enum ESPSecurityType {
  Sec0 = "sec0",
  Sec1 = "sec1"
}

export enum ESPTransportType {
  Wifi = "wifi",
  Bluetooth = "bluetooh"
}

export enum ESPDeviceState {
  Configured = "CONFIGURED"
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
  onSateChanged(callback: (state: State, devices: [Device], error: Error?) => void);
  connectTo(uuid: string);
  setCredentials(ssid: string, passphrase: string, uuid: string);
}

export interface EspressifWrapper extends Espressif {
  (): Espressif;
}

declare const Espressif: EspressifWrapper;

export default Espressif;
