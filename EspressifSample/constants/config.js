import { ESPSecurityType, ESPTransportType } from "react-native-espressif";

var transportType = ESPTransportType.Bluetooth;
var securityType = ESPSecurityType.Sec1;
var wifiBaseUrl = "192.168.4.1:80";
var wifiNetworkNamePrefix = "mysoftap";
var bleDeviceNamePrefix = "FoobotSat_";
const bleSessionUuid = "6563FF51-6564-5F62-616C-786F62726961";
const bleConfigUuid = "6563FF52-6564-5F62-616C-786F62726961";
const bleServiceUuid = "65636976-6564-5F62-616C-786F62726961";

export default {
  get: () => ({
    transportType,
    securityType,
    wifiBaseUrl,
    wifiNetworkNamePrefix,
    bleDeviceNamePrefix,
    bleConfigUuid,
    bleServiceUuid,
    bleSessionUuid
  }),
  setTransportType: transport => {
    transportType = transport;
  },
  setSecurityType: security => {
    securityType = security;
  },
  setBleDeviceNamePrefix: prefix => {
    bleDeviceNamePrefix = prefix;
  },
  setWifiBaseUrl: baseUrl => {
    wifiBaseUrl = baseUrl;
  },
  setWifiNetworkNamePrefix: name => {
    wifiNetworkNamePrefix = name;
  }
};
