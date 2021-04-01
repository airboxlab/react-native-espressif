import { EmitterSubscription } from 'react-native';
export declare type EspressifConfig = {
    transportType: ESPTransportType;
    securityType: ESPSecurityType;
    wifiBaseUrl?: string;
    wifiNetworkNamePrefix?: string;
    bleDeviceNamePrefix?: string;
    bleSessionUuid?: string;
    bleConfigUuid?: string;
    bleServiceUuid?: string;
};
export declare type EspressifDeviceInfo = {
    UUID: string;
    MACWiFi: string;
    MACEthernet: string;
    FWVersion: string;
    DeviceCompatibility: string;
};
export declare enum WifiAuth {
    WPA2 = "WPA2_PSK",
    WPA_WPA2 = "WPA_WPA2_PSK",
    WPA_ENTERPRISE = "WPA_ENTERPRISE",
    OPEN = "OPEN"
}
export declare type EspressifWifi = {
    rssi: number;
    channel: number;
    ssid: string;
    auth: WifiAuth;
};
export declare type EspressifDevice = {
    name: string;
    uuid: string;
    networkStatus: ESPNetworkStatus;
    state: ESPDeviceState;
    onStatusChanged: (device: EspressifDevice) => void;
    onNetworkStatusChanged: (status: ESPNetworkStatus, device: EspressifDevice) => void;
    connect(): Promise<void>;
    startSession(): Promise<void>;
    setCredentials(ssid: string, passphrase: string): Promise<void>;
    scanWifi(): Promise<EspressifWifi[]>;
    networkTest(): Promise<void>;
    disconnect(): Promise<void>;
    getDeviceInfo(): Promise<EspressifDeviceInfo>;
};
declare type EspressifType = {
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
    addBluetoothStatusListener(callback: BluetoothStatusCallback): EmitterSubscription;
    /**
     *
     * @param {DevicesListCallback} callback
     */
    addDevicesListListener(callback: DevicesListCallback): EmitterSubscription;
    OnStateChanged: (state: ESPBluetoothState, devices: EspressifDevice[]) => void;
    startSession(deviceUuid: string): Promise<void>;
    connectTo(deviceUuid: string): Promise<void>;
    setCredentials(ssid: string, passphrase: string, deviceUuid: string): Promise<void>;
    scanWifi(deviceUuid: string): Promise<string>;
    networkTestStatus(deviceUuid: string): Promise<void>;
    disconnect(deviceUuid: string): Promise<void>;
    getDeviceInfo(): Promise<string>;
};
interface DevicesListCallback {
    (state: ESPEventState, devices: EspressifDevice[]): void;
}
interface BluetoothStatusCallback {
    (status: ESPBluetoothState): void;
}
export declare enum ESPTransportType {
    Bluetooth = "bluetooth",
    Wifi = "wifi"
}
export declare enum ESPSecurityType {
    Sec0 = "sec0",
    Sec1 = "sec1"
}
export declare enum ESPDeviceState {
    Configured = "CONFIGURED",
    SessionEstablished = "SESSION_ESTABLISHED",
    NetworkTest = "NETWORK_TEST",
    Disconnected = "DISCONNECTED",
    NotConfigured = "NOT_CONFIGURED"
}
export declare enum ESPNetworkStatus {
    NotStarted = "NOT_STARTED",
    InProgress = "IN_PROGRESS",
    Ok = "OK",
    Nok = "NOK"
}
export declare enum ESPEventState {
    DeviceNotFound = "DEVICES_NOT_FOUND",
    Unknown = "UNKNOWN",
    DevicesFounds = "DEVICES_FOUND",
    DeviceUpdated = "DEVICE_UPDATED"
}
export declare enum ESPBluetoothState {
    Unknown = "UNKNOWN",
    Resetting = "RESETTING",
    Unsupported = "UNSUPPORTED",
    Unauthorized = "UNAUTHORIZED",
    PoweredOff = "POWERED_OFF",
    PoweredOn = "POWERED_ON"
}
declare const Wrapper: () => EspressifType;
export default Wrapper;
