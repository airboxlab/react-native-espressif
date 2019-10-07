import { ESPSecurityType, ESPTransportType } from "react-native-espressif";

var transportType =ESPTransportType.Bluetooth;
var securityType = ESPSecurityType.Sec1;
var wifiBaseUrl = "192.168.4.1:80";
var wifiNetworkNamePrefix = "mysoftap";
var bleDeviceNamePrefix = "PROV_";

export default {
  get: () => ({transportType, securityType, wifiBaseUrl, wifiNetworkNamePrefix, bleDeviceNamePrefix}),
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
