package com.reactnativeespressif

import android.bluetooth.BluetoothDevice
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.reactnativeespressif.Provisionning.ESPDevice
import espressif.DeviceInfo

class EspressifPeripheralNetwork(testIp: State, testInternet: State, testCloud: State) {
  enum class State(val value: String){
    NOT_STARTED("NOT_STARTED"),
    IN_PROGRESS("IN_PROGRESS"),
    OK("OK"),
    NOK("NOK");

    companion object {
      public fun fromInt(value: Int): State {
        when (value) {
          0 -> return State.NOT_STARTED
          1 -> return State.IN_PROGRESS
          2 -> return State.OK
          3 -> return State.NOK
        }
        return State.NOT_STARTED
      }

      @JvmStatic
      fun fromInt(value: DeviceInfo.NetworkTestStatus): EspressifPeripheralNetwork.State {
        when (value) {
          DeviceInfo.NetworkTestStatus.TEST_NOT_STARTED -> return State.NOT_STARTED
          DeviceInfo.NetworkTestStatus.TEST_IN_PROGRESS -> return State.IN_PROGRESS
          DeviceInfo.NetworkTestStatus.TEST_OK -> return State.OK
          DeviceInfo.NetworkTestStatus.TEST_NOK -> return State.NOK
        }
        return State.NOT_STARTED
      }
    }
  }

  var testIp: State = testIp
  var testInternet: State = testInternet
  var testCloud: State = testCloud
}

class EspressifPeripheral(device: ESPDevice, state: State, networkStatus: EspressifPeripheralNetwork) {
  var uuid: String = device.bluetoothDevice.address
  var name: String = device.deviceName
  var networkStatus: EspressifPeripheralNetwork = networkStatus
  var state: State = state

  enum class State(val value: String){
    NOT_CONFIGURED("NOT_CONFIGURED"),
    CONFIGURED("CONFIGURED"),
    DISCONNECTED("DISCONNECTED"),
    SESSION_ESTABLISHED("SESSION_ESTABLISHED"),
    CREDENTIALS_STARTED("CREDENTIALS_STARTED"),
    CREDENTIALS_SET("CREDENTIALS_SET"),
    CREDENTIALS_APPLIED("CREDENTIALS_APPLIED"),
    NETWORK_TEST("NETWORK_TEST")
  }

  fun toMap(): ReadableMap {
    return Arguments.createMap().also {
      it.putString("uuid", this.uuid)
      it.putString("name", this.name)

      it.putMap("networkStatus", Arguments.createMap().also {
        it.putString("testIp", this.networkStatus.testIp.value)
        it.putString("testInternet", this.networkStatus.testInternet.value)
        it.putString("testCloud", this.networkStatus.testCloud.value)
      })

      it.putString("state", this.state.value)
    }
  }
}

enum class WifiAuth(val value: String){


  OPEN("OPEN"),
  WEP("WEP"),
  WPA_PSK("WPA_PSK"),
  WPA2_PSK("WPA2_PSK"),
  WPA_WPA2_PSK("WPA_WPA2_PSK"),
  WPA2_ENTERPRISE("WPA_ENTERPRISE");

  companion object {
    fun fromInt(value: Int): WifiAuth {
      when (value) {
        0 -> return OPEN
        1 -> return WEP
        2 -> return WPA_PSK
        3 -> return WPA2_PSK
        4 -> return WPA_WPA2_PSK
        5 -> return WPA2_ENTERPRISE
      }
      return OPEN
    }
  }

}

//public inline fun WifiAuthFromValue(value: Int): WifiAuth {
//  when(value){
//    0 -> return WifiAuth.OPEN
//    1 -> return WifiAuth.WEP
//    2 -> return WifiAuth.WPA_PSK
//    3 -> return WifiAuth.WPA2_PSK
//    4 -> return WifiAuth.WPA_WPA2_PSK
//    5 -> return WifiAuth.WPA2_ENTERPRISE
//  }
//}
