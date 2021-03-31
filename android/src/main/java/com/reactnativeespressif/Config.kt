package com.reactnativeespressif

import android.util.Log
import com.facebook.react.bridge.ReadableMap
import com.reactnativeespressif.Provisionning.ESPProvisionManager

class EspressifConfig {
  enum class OptionsType(val type: String) {
    TRANSPORT_TYPE("transportType"),
    SECURITY_TYPE("securityType"),
    BLE_DEVICE_NAME_PREFIX("bleDeviceNamePrefix"),
    WIFI_BASE_URL("wifiBaseUrl"),
    WIFI_NETWORKNAME_PREFIX("wifiNetworkNamePrefix"),
    BLE_CONFIG_UUID("bleConfigUuid"),
    BLE_SESSION_UUID("bleSessionUuid"),
    BLE_SERVICE_UUID("bleServiceUuid");

    companion object {
      fun from(findType: String): OptionsType = OptionsType.values().first { it.type == findType }
    }
  }

  enum class TransportType(val type: String) {
    WIFI("wifi"),
    BLUETOOTH("bluetooth");

    companion object {
      fun from(findType: String): TransportType = TransportType.values().first { it.type == findType }
    }
  }

  enum class SecurityType(val type: String) {
    SEC_0("sec0"),
    SEC_1("sec1");

    companion object {
      fun from(findType: String): SecurityType = SecurityType.values().first { it.type == findType }
    }
  }

  var security: SecurityType = SecurityType.SEC_0
    private set

  var transport: TransportType = TransportType.WIFI
    private set

  var proofOfPossession = "airboxlab"
    private set
  var bleConfigUuid = "0000FF52-0000-1000-8000-00805F9B34FB"
    private set
  var bleServiceUuid = "0000ffff-0000-1000-8000-00805f9b34fb"
    private set
  var bleSessionUuid = "0000ff51-0000-1000-8000-00805f9b34fb"
    private set
  var bleDeviceNamePrefix = "PROV_"
    private set
  var wifiBaseUrl = "192.168.4.1:80"
    private set
  var wifiNetworkNamePrefix = "mysoftap"
    private set

  fun set(config: ReadableMap) {
    config.entryIterator.forEach {
      Log.d(ESPProvisionManager.TAG, "SETCONFGI ${it.key} ${it.value}")
      when (it.key) {
        OptionsType.SECURITY_TYPE.type -> this.security = SecurityType.from(it.value as String)
        OptionsType.TRANSPORT_TYPE.type -> this.transport = TransportType.from(it.value as String)
        OptionsType.BLE_DEVICE_NAME_PREFIX.type -> this.bleDeviceNamePrefix = it.value as String
        OptionsType.WIFI_BASE_URL.type -> this.wifiBaseUrl = it.value as String
        OptionsType.BLE_CONFIG_UUID.type -> this.bleConfigUuid = it.value as String
        OptionsType.BLE_SERVICE_UUID.type -> this.bleServiceUuid = it.value as String
        OptionsType.BLE_SESSION_UUID.type -> this.bleSessionUuid = it.value as String
        OptionsType.WIFI_NETWORKNAME_PREFIX.type -> this.wifiNetworkNamePrefix = it.value as String
      }
    }
  }
}
