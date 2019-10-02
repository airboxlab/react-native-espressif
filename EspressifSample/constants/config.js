import { ESPSecurityType, ESPTransportType } from "react-native-espressif";

var transportType =ESPTransportType.Bluetooth;
var securityType = ESPSecurityType.Sec1;


export default {
  get: () => ({transportType, securityType}),
  setTransportType: transport => {
    transportType = transport;
  },
  setSecurityType: security => {
    securityType = security;
  }
};
