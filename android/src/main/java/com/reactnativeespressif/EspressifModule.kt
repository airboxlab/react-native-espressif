package com.reactnativeespressif


import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.le.ScanResult
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.reactnativeespressif.Provisionning.ESPConstants
import com.reactnativeespressif.Provisionning.ESPDevice
import com.reactnativeespressif.Provisionning.ESPProvisionManager
import com.reactnativeespressif.Provisionning.WiFiAccessPoint
import com.reactnativeespressif.Provisionning.listeners.BleScanListener
import com.reactnativeespressif.Provisionning.listeners.ProvisionListener
import com.reactnativeespressif.Provisionning.listeners.ResponseListener
import com.reactnativeespressif.Provisionning.listeners.WiFiScanListener
import com.reactnativeespressif.Provisionning.security.Security
import com.reactnativeespressif.Provisionning.security.Security0
import com.reactnativeespressif.Provisionning.security.Security1
import espressif.DeviceInfo
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.ArrayList

class EspressifModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), BleScanListener {

    private var config: EspressifConfig = EspressifConfig()
    private var security: Security? = null


    private var selectedUuid: String? = null
    private var peripherals = mutableMapOf<String, ESPDevice>()


  override fun getName(): String {
        return "Espressif"
    }



  @ReactMethod
  fun setConfig(config: ReadableMap, promise: Promise){
    this.config.set(config)

    if (this.config.security == EspressifConfig.SecurityType.SEC_1) {
      this.security = Security1(this.config.proofOfPossession)
    } else {
      this.security = Security0()
    }

    Log.d(ESPProvisionManager.TAG, "SET_CONFIG")
    promise.resolve(null)

    bluetoothStatus()

    val scanReceiver: BroadcastReceiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context?, intent: Intent) {
        val action = intent.action

        if (action.equals(BluetoothAdapter.ACTION_STATE_CHANGED, ignoreCase = true)) {
          // device found
          Log.d(ESPProvisionManager.TAG, "state change ${BluetoothAdapter.getDefaultAdapter().isEnabled}")
          bluetoothStatus()
        }
      }
    }
    reactApplicationContext.applicationContext.registerReceiver(scanReceiver, object : IntentFilter() {
      init {
        addAction(BluetoothAdapter.ACTION_STATE_CHANGED)
      }
    })
  }

  @ReactMethod
  fun disconnect(uuid: String, promise: Promise){
    this.peripherals[uuid]?.let {
      it.disconnectDevice()

      val arguments = Arguments.createMap()
      arguments.merge(EspressifPeripheral(
        it,
        EspressifPeripheral.State.DISCONNECTED,
        EspressifPeripheralNetwork(EspressifPeripheralNetwork.State.NOT_STARTED, EspressifPeripheralNetwork.State.NOT_STARTED, EspressifPeripheralNetwork.State.NOT_STARTED)
      ).toMap())

      this.sendEvent("device-status", arguments)
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun scanDevices() {
    this.peripherals.clear()

    if (ActivityCompat.checkSelfPermission(reactApplicationContext.applicationContext, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      reactApplicationContext.currentActivity.let {
        ActivityCompat.requestPermissions(
          it!!,
          arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 2)
      }
    }

    ESPProvisionManager.getInstance(reactApplicationContext.applicationContext).searchBleEspDevices(this.config.bleDeviceNamePrefix, this)
  }

  @ReactMethod
  fun startSession(uuid: String, promise: Promise){
    val instance = this;
    val device = this.peripherals[uuid]
    Log.d(ESPProvisionManager.TAG, "START SESSION")
    device?.initSession(object : ResponseListener {
      override fun onSuccess(returnData: ByteArray?) {
        Log.d(ESPProvisionManager.TAG, "SUCESSS SESSSION")
        val arguments = Arguments.createMap()
        arguments.merge(EspressifPeripheral(
          device,
          EspressifPeripheral.State.SESSION_ESTABLISHED,
          EspressifPeripheralNetwork(EspressifPeripheralNetwork.State.NOT_STARTED, EspressifPeripheralNetwork.State.NOT_STARTED, EspressifPeripheralNetwork.State.NOT_STARTED)
        ).toMap())

        instance.sendEvent("device-status", arguments)

        promise.resolve(null)
      }

      override fun onFailure(e: java.lang.Exception?) {
        Log.d(ESPProvisionManager.TAG, "ERROR $e")
        promise.reject("ERROR", "Error in establishing session $e")
      }

    })
  }

  @ReactMethod
  fun networkTestStatus(uuid: String, promise: Promise){
    this.peripherals[uuid]?.let {
      it.networkTest(object: ESPDevice.NetworkTestListener {
        override fun Changed(network: EspressifPeripheralNetwork?) {
          val arguments = Arguments.createMap()

          arguments.merge(EspressifPeripheral(it, EspressifPeripheral.State.NETWORK_TEST, network!!).toMap())

          sendEvent("device-status", toJSONObject(arguments).toString())
        }

        override fun Complete() {
          promise.resolve(null)
        }

        override fun Error(exception: java.lang.Exception?) {
          promise.reject(exception)
        }

      })
    }
  }

  @ReactMethod
  fun getDeviceInfo(promise: Promise){
    this.selectedUuid.let {


      this.peripherals[it!!]?.getDeviceInfo(object: ESPDevice.DeviceInfoListener {
        override fun Success(response: DeviceInfo.DeviceInfoResponse?) {
          var arguments = Arguments.createMap()

          response?.let {
            arguments.putString("UUID", it.uuid)
            arguments.putString("MACWiFi", it.macWiFi)
            arguments.putString("MACEthernet", it.macEthernet)
            arguments.putString("FWVersion", it.fwVersion)
            arguments.putString("DeviceCompatibility", it.deviceCompatibility)
          }
          promise.resolve(toJSONObject(arguments).toString())
        }

        override fun Error(exception: java.lang.Exception?) {
          promise.reject(exception)
        }

      })
    }
  }

  @ReactMethod
  fun setCredentials(ssid: String, passphrase: String, uuid:String, promise: Promise){
    Log.d(ESPProvisionManager.TAG, "SET_CREDENTIALS");
    this.peripherals[uuid]?.let {
      it.provision(ssid, passphrase, object: ProvisionListener {
        override fun createSessionFailed(e: java.lang.Exception?) {
          Log.e(ESPProvisionManager.TAG, "$e");
        }

        override fun wifiConfigSent() {
          Log.d(ESPProvisionManager.TAG, "wifiSent");
        }

        override fun wifiConfigFailed(e: java.lang.Exception?) {
          promise.reject(e)
          Log.e(ESPProvisionManager.TAG, "$e");
        }

        override fun wifiConfigApplied() {
          Log.d(ESPProvisionManager.TAG, "wifiConfigApplied");
        }

        override fun wifiConfigApplyFailed(e: java.lang.Exception?) {
          promise.reject(e)
          Log.e(ESPProvisionManager.TAG, "$e");
        }

        override fun provisioningFailedFromDevice(failureReason: ESPConstants.ProvisionFailureReason?) {
          Log.e(ESPProvisionManager.TAG, "$failureReason");

        }

        override fun deviceProvisioningSuccess() {
          Log.d(ESPProvisionManager.TAG, "deviceProvisioningSuccess");
          var arguments = Arguments.createMap()
          arguments.merge(EspressifPeripheral(
            it,
            EspressifPeripheral.State.CREDENTIALS_APPLIED,
            EspressifPeripheralNetwork(
              EspressifPeripheralNetwork.State.NOT_STARTED,
              EspressifPeripheralNetwork.State.NOT_STARTED,
              EspressifPeripheralNetwork.State.NOT_STARTED
            )
          ).toMap())
          sendEvent("device-status", arguments)
          promise.resolve(null)
        }

        override fun onProvisioningFailed(e: java.lang.Exception?) {
          promise.reject(e)
          Log.e(ESPProvisionManager.TAG, "$e");
        }

      })
    }
  }

  @ReactMethod
  fun scanWifi(uuid: String, promise: Promise){
    Log.d(ESPProvisionManager.TAG, "SCAN WIFI")
    this.peripherals[uuid]?.let {
      it.scanNetworks(object: WiFiScanListener {
        override fun onWifiListReceived(wifiList: ArrayList<WiFiAccessPoint>?) {
        var arguments = Arguments.createArray()

          wifiList?.forEach {
            Log.d(ESPProvisionManager.TAG, "${it.wifiName}")
            val map = Arguments.createMap()
            map.putInt("rssi", it.rssi)
            map.putString("ssid", it.wifiName)
            map.putString("auth", WifiAuth.fromInt(it.security).value)


            arguments.pushMap(map)
          }

          promise.resolve(toJSONObject(arguments).toString())
        }

        override fun onWiFiScanFailed(e: java.lang.Exception?) {
          promise.reject(e)
        }

      })
    }
  }

  @ReactMethod
  fun connectTo(uuid: String, promise: Promise){

    if (ActivityCompat.checkSelfPermission(reactApplicationContext.applicationContext, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      // TODO: Consider calling
      //    ActivityCompat#requestPermissions
      // here to request the missing permissions, and then overriding
      //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
      //                                          int[] grantResults)
      // to handle the case where the user grants the permission. See the documentation
      // for ActivityCompat#requestPermissions for more details.
      return
    }
    try {
      Log.d(ESPProvisionManager.TAG, "CONNECT TO $uuid")

      var connectionPromise = object : Promise {
        override fun resolve(value: Any?) {
          Handler(Looper.getMainLooper()).postDelayed(
            {
              val arguments = Arguments.createMap()

              val map = EspressifPeripheral(
                peripherals[uuid]!!,
                EspressifPeripheral.State.NOT_CONFIGURED,
                EspressifPeripheralNetwork(
                  EspressifPeripheralNetwork.State.NOT_STARTED,
                  EspressifPeripheralNetwork.State.NOT_STARTED,
                  EspressifPeripheralNetwork.State.NOT_STARTED
                )
              ).toMap()
              arguments.merge(map)


              selectedUuid = uuid
              sendEvent("device-status", arguments)
              Log.d(ESPProvisionManager.TAG, "CONNECTION DONE")
              promise.resolve(null)
            },2000)

        }

        override fun reject(code: String?, message: String?) {
          TODO("Not yet implemented")
        }

        override fun reject(code: String?, throwable: Throwable?) {
          TODO("Not yet implemented")
        }

        override fun reject(code: String?, message: String?, throwable: Throwable?) {
          TODO("Not yet implemented")
        }

        override fun reject(throwable: Throwable?) {
          TODO("Not yet implemented")
        }

        override fun reject(throwable: Throwable?, userInfo: WritableMap?) {
          TODO("Not yet implemented")
        }

        override fun reject(code: String?, userInfo: WritableMap) {
          TODO("Not yet implemented")
        }

        override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap?) {
          TODO("Not yet implemented")
        }

        override fun reject(code: String?, message: String?, userInfo: WritableMap) {
          TODO("Not yet implemented")
        }

        override fun reject(code: String?, message: String?, throwable: Throwable?, userInfo: WritableMap?) {
          TODO("Not yet implemented")
        }

        override fun reject(message: String?) {
          promise.reject(message)
        }

      }

      this.peripherals[uuid]?.connectToDevice(connectionPromise)


    } catch (e: java.lang.Exception){
      Log.d(ESPProvisionManager.TAG, "${e}")
    }
  }

  private fun bluetoothStatus() {
    if (BluetoothAdapter.getDefaultAdapter().isEnabled){
      sendEvent("bluetooth-status", "POWERED_ON")
    } else {
      sendEvent("bluetooth-status", "POWERED_OFF")
    }
  }

  private fun sendEvent(eventName: String, params: String?) {
    reactApplicationContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(eventName, params)
  }

  private fun sendEvent(eventName: String, params: WritableMap) {
    reactApplicationContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(eventName, toJSONObject(params).toString())
  }



  override fun scanStartFailed() {
    Log.d(ESPProvisionManager.TAG, "Please turn on bluetooth and try again.")
  }

  override fun onPeripheralFound(device: BluetoothDevice?, scanResult: ScanResult?) {

    // Device found
    if (device != null && scanResult?.scanRecord?.deviceName == device.name) {
      if (!this.peripherals.containsKey(device.address)){
        val espDevice = ESPDevice(reactApplicationContext.applicationContext, ESPConstants.TransportType.TRANSPORT_BLE, ESPConstants.SecurityType.SECURITY_1, this.config)
        espDevice.bluetoothDevice = device
        espDevice.deviceName = device.name
        espDevice.proofOfPossession = this.config.proofOfPossession

        if (scanResult?.scanRecord?.serviceUuids?.size ?: 0 > 0)
          espDevice.primaryServiceUuid = scanResult?.scanRecord?.serviceUuids?.get(0)?.toString() ?: ""

        this.peripherals[device.address] = espDevice
      }
    }
  }

  override fun scanCompleted() {
    Log.d(ESPProvisionManager.TAG, "scanCompleted")
    Log.d(ESPProvisionManager.TAG, "searchCnt : ${this.peripherals.count()}")

    val arguments = Arguments.createMap()
    val devices = Arguments.createArray()


    this.peripherals.values.forEach {
      val deviceJSON = Arguments.createMap()

      devices.pushMap(EspressifPeripheral(
        it,
        EspressifPeripheral.State.NOT_CONFIGURED,
        EspressifPeripheralNetwork(
          testIp = EspressifPeripheralNetwork.State.NOT_STARTED,
          testCloud = EspressifPeripheralNetwork.State.NOT_STARTED,
          testInternet = EspressifPeripheralNetwork.State.NOT_STARTED
        )).toMap())
    }

    arguments.putString("state", "DEVICES_FOUND")
    arguments.putArray("peripherals", devices)

    this.sendEvent("devices-state", arguments)
  }

  @Throws(JSONException::class)
  fun toJSONObject(readableMap: ReadableMap?): JSONObject {
    val jsonObject = JSONObject()
    val iterator = readableMap?.keySetIterator()
    while (iterator?.hasNextKey() == true) {
      val key = iterator.nextKey()
      when (readableMap.getType(key)) {
        ReadableType.Null -> jsonObject.put(key, null)
        ReadableType.Boolean -> jsonObject.put(key, readableMap.getBoolean(key))
        ReadableType.Number -> jsonObject.put(key, readableMap.getDouble(key))
        ReadableType.String -> jsonObject.put(key, readableMap.getString(key))
        ReadableType.Map -> jsonObject.put(key, toJSONObject(readableMap.getMap(key)))
        ReadableType.Array -> jsonObject.put(key, toJSONObject(readableMap.getArray(key)))
      }
    }
    return jsonObject
  }

  @Throws(JSONException::class)
  fun toJSONObject(readableArray: ReadableArray?): JSONArray {
    val jsonArray = JSONArray()


    var i = 0
    while (i < readableArray?.size() ?: 0){

      when (readableArray?.getType(i)) {
        ReadableType.Null -> jsonArray.put(i, null)
        ReadableType.Boolean -> jsonArray.put(i, readableArray.getBoolean(i))
        ReadableType.Number -> jsonArray.put(i, readableArray.getDouble(i))
        ReadableType.String -> jsonArray.put(i, readableArray.getString(i))
        ReadableType.Map -> jsonArray.put(i, toJSONObject(readableArray.getMap(i)))
        ReadableType.Array -> jsonArray.put(i, toJSONObject(readableArray.getArray(i)))
      }

      i += 1
    }

    return jsonArray
  }

  override fun onFailure(e: Exception?) {
    e!!.printStackTrace()
    Log.d(ESPProvisionManager.TAG, "onFailure")
    Log.d(ESPProvisionManager.TAG, "searchCnt : ${this.peripherals.count()}")
  }
}
