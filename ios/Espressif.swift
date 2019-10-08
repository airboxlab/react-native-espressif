//
//  Espressif.swift
//  AFNetworking
//
//  Created by Julien Smolareck on 09/09/2019.
//

import Foundation
import CoreBluetooth

struct EspressifPeripheral: Codable {
	var uuid: String
	var name: String
	var state: State
	
	enum State: String, Codable {
		case notConfigured = "NOT_CONFIGURED"
		case configured = "CONFIGURED"
		case disconnected = "DISCONNECTED"
		case sessionEstablished = "SESSION_ESTABLISHED"
	}
}

struct EspressifEvent: Codable {
	var state: State = .unknown
	var message: String = ""
	var peripherals: [EspressifPeripheral] = []
	
	enum State: String, Codable {
		case devicesNotFound = "DEVICES_NOT_FOUND"
		case unknown = "UNKNOWN"
		case devicesFound = "DEVICES_FOUND"
		case deviceUpdated = "DEVICE_UPDATED"
	}
}

@objc(Espressif)
class Espressif: RCTEventEmitter {
	private var config: EspressifConfig = EspressifConfig()
	
	private var transport: Transport?
	private var security: Security?
	private var bleTransport: BLETransport?
	
	private var session: Session?
	private var provision: Provision?
	
	private var peripherals: [CBPeripheral] = []
	
	
	override static func requiresMainQueueSetup() -> Bool {
		return true
	}
	
	@objc override static func moduleName() -> String! {
		return "Espressif"
	}
	
	override func constantsToExport() -> [AnyHashable : Any]! {
		return [
			"EventState": [
				"DEVICES_NOT_FOUND": EspressifEvent.State.devicesNotFound.rawValue,
				"UNKNOWN": EspressifEvent.State.unknown.rawValue,
				"DEVICES_FOUND": EspressifEvent.State.devicesFound.rawValue,
				"DEVICE_UPDATED": EspressifEvent.State.deviceUpdated.rawValue
			],
			"DeviceState": [
				"NOT_CONFIGURED": EspressifPeripheral.State.notConfigured.rawValue,
				"CONFIGURED": EspressifPeripheral.State.configured.rawValue,
				"DISCONNECTED": EspressifPeripheral.State.disconnected.rawValue
			]
		]
	}
	
	override func supportedEvents() -> [String]! {
		return ["devices-state", "log"]
	}
	
	@objc func setConfig(_ config: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		DispatchQueue.main.async {
			do {
				try self.config.set(config)
			} catch let e {
				reject("Error", e.localizedDescription, e)
				return
			}
			
			if self.config.security == .Sec1 {
				self.security = Security1(proofOfPossession: PROOF_OF_POSSESSION)
			} else {
				self.security = Security0()
			}
			
			if self.config.transport == .Bluetooh {
				let capabilities = ["prov-scan", "prov-session", "prov-config", "proto-ver", "device-info", "network-test"]
				self.bleTransport = BLETransport(serviceUUIDString: BLE_SERVICE_UUID,
																				 capabilities: capabilities,
																				 deviceNamePrefix: BLE_DEVICE_NAME_PREFIX,
																				 scanTimeout: 5.0)
				self.bleTransport?.delegate = self
				self.transport = self.bleTransport
				self.bleTransport?.currentRequestCompletionHandler = { (data, error) in
					print("CurrentRequest")
					self.sendEvent(withName: "log", body: (data: data, error: error))
				}
			} else {
				self.transport = SoftAPTransport(baseUrl: WIFI_BASEURL)
			}
			
			resolve(nil)
		}
	}
	
	@objc func scanDevices() {
		DispatchQueue.main.async {
			self.bleTransport?.scan(delegate: self)
		}
		
	}
	
	@objc func writeData() {
		
	}
	
	@objc func connectTo(_ uuid: String){
		let peripheral = self.peripherals.first {
			return $0.identifier.uuidString == uuid
		}
		
		if peripheral != nil {
			self.bleTransport?.connect(peripheral: peripheral!, withOptions: nil)
		}
	}
	
	@objc func hasCapabilities() {
		
	}
	
	@objc func startSession(_ uuid: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		let peripheral = self.peripherals.first {
			return $0.identifier.uuidString == uuid
		}
		
		if self.transport == nil || self.security == nil {
			reject("ERROR", "react-native-espressif is not initialized", nil)
			return
		}
		
		let newSession = Session(transport: transport!, security: security!)
		
		newSession.initialize(response: nil) { error in
			guard error == nil else {
				reject("ERROR", "Error in establishing session \(error.debugDescription)", error)
				return
			}
			
			self.provision = Provision(session: newSession)
			self.session = newSession
			
			self.sendEvent(EspressifEvent(state: .deviceUpdated, message: "Session Started", peripherals: self.peripherals.map {
				var state : EspressifPeripheral.State = .notConfigured
				if peripheral?.identifier.uuidString == $0.identifier.uuidString {
					state = .sessionEstablished
				}

				return EspressifPeripheral(uuid:$0.identifier.uuidString, name: $0.name ?? "Unnamed", state: state)
			}))
			
			resolve(nil)
		}
	}
	
	@objc func getDeviceInfo(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		if self.transport == nil || self.security == nil {
			reject("ERROR", "react-native-espressif is not initialized", nil)
			return
		}
		
		if self.provision == nil || self.session == nil {
			reject("ERROR", "the session is not started", nil)
			return
		}
		
		var request = DeviceInfoRequest()
		request.protocolVersion = 1
		self.provision?.send(to: "device-info", data: request, completionHandler: { (status, response: DeviceInfoResponse?, error) in
			guard error == nil else {
				reject("ERROR", "Error sending device-info : \(error.debugDescription)", error)
				print("ERROR")
				return
			}
			
			do {
				resolve(try response?.jsonString())
			} catch {
				reject("ERROR", "Serializing data", error);
			}
		})
	}
	
	func getWifiStatus(completionHandler: @escaping (_ response: Espressif_WiFiConfigPayload?, _ error: Error?) -> Void){
		var testWifiData = Espressif_WiFiConfigPayload()
		testWifiData.cmdGetStatus = Espressif_CmdGetStatus()
		self.provision?.send(to: "prov-config", data: testWifiData) { (status, response: Espressif_WiFiConfigPayload?, error) in
			guard error == nil else {
				completionHandler(nil, error)
				return
			}
			
			if response?.msg == Espressif_WiFiConfigMsgType.typeRespGetStatus {
				print("Get Wifi Status \(response?.respGetStatus.staState)")
				if response?.respGetStatus.staState == Espressif_WifiStationState.connecting {
					DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
						self.getWifiStatus(completionHandler: completionHandler)
					}
					
				} else {
						completionHandler(response, nil)
				}
			}
			
			
		}
	}
	
	@objc func setCredentials(_ ssid: String, passphrase: String, uuid: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock){
		if self.transport == nil || self.security == nil {
			reject("ERROR", "react-native-espressif is not initialized", nil)
			return
		}
		
		var configData = Espressif_WiFiConfigPayload()
		configData.msg = Espressif_WiFiConfigMsgType.typeCmdSetConfig
		configData.cmdSetConfig.ssid = Data(ssid.bytes)
		configData.cmdSetConfig.passphrase = Data(passphrase.bytes)

		self.provision?.send(to: "prov-config", data: configData) { (status, response: Espressif_WiFiConfigPayload?, error) in
			guard error == nil else {
				reject("ERROR", "Error in sending wifi credentials : \(error.debugDescription)", error)
				print("ERROR")
				return
			}
			
			if status != .success {
				reject("ERROR", "Error in sending wifi credentials : \(status.rawValue)", error)
				print("ERROR")
				return
			}

			var applyData = Espressif_WiFiConfigPayload()
			applyData.cmdApplyConfig = Espressif_CmdApplyConfig()
			applyData.msg = Espressif_WiFiConfigMsgType.typeCmdApplyConfig
			self.provision?.send(to: "prov-config", data: applyData) { (status, response: Espressif_WiFiConfigPayload?, error) in
				guard error == nil else {
					reject("ERROR", "Error in applying wifi : \(error.debugDescription)", error)
					print("ERROR")
					return
				}
				
				if status != .success {
					reject("ERROR", "Error in applying wifi : \(status.rawValue)", error)
					print("ERROR")
					return
				}
				
				self.getWifiStatus { response, error in
					if error != nil {
						reject("ERROR", "Error in sending wifi credentials : \(status.rawValue)", error)
						return
					}
						
					do {
						resolve(try response?.jsonString())
					} catch {
						reject("ERROR", "Error in sending wifi credentials : \(status.rawValue)", error)
					}
					
				}
			}
		}
//			provision.sendProtocolVersion(version: 1) { status, error in
//
//				print("STATUS \(status)")
//
//				provision.configureWifi(ssid: ssid, passphrase: passphrase) { status, error in
//					guard error == nil else {
//						reject("ERROR", "Error in configuring wifi : \(error.debugDescription)", error)
//						return
//					}
//					print("CONFIGURE WIFI \(status)")
//					if status == Espressif_Status.success {
//
//						provision.applyConfigurations(completionHandler: { status, error in
//							guard error == nil else {
//								reject("ERROR", "Error in applying configurations : \(error.debugDescription)", nil)
//								return
//							}
//						}, wifiStatusUpdatedHandler: { wifiState, failReason, error in
//							DispatchQueue.main.async {
//								if error != nil {
//									reject("ERROR", "Error in getting wifi state : \(error.debugDescription)", error)
//								} else if wifiState == Espressif_WifiStationState.connected {
//									resolve("Device connected")
//								} else if wifiState == Espressif_WifiStationState.disconnected {
//									reject("ERROR","Please check the device indicators for Provisioning status.", nil)
//								} else {
//									reject("ERROR", "Device provisioning failed.\nReason : \(failReason).\nPlease try again", nil)
//								}
//							}
//						})
//					}
//				}
//			}
	}
	
	func sendEvent(_ event: EspressifEvent){
		do {
			let jsonData = try JSONEncoder().encode(event)
			let json = String(data: jsonData, encoding: .utf8)!
		
			self.sendEvent(withName: "devices-state", body: json)
			print("Event sended")
		} catch let e {
			print("ERROR SEND EVENT \(e.localizedDescription)")
		}
	}
	
}

extension Espressif: BLETransportDelegate {
	func peripheralsFound(peripherals: [CBPeripheral]) {
		self.peripherals = peripherals
		self.sendEvent(EspressifEvent(state: .devicesFound, message: "FOUND", peripherals: peripherals.map {
			return EspressifPeripheral(uuid:$0.identifier.uuidString, name: $0.name ?? "Unnamed", state: .notConfigured)
		}))
	}
	
	func peripheralsNotFound(serviceUUID: UUID?) {
		self.peripherals = []
		self.sendEvent(EspressifEvent(state: .devicesNotFound, message: "NOT FOUND", peripherals: []))
	}
	
	func peripheralConfigured(peripheral: CBPeripheral) {
		for i in 0..<self.peripherals.count {
			if self.peripherals[i].identifier.uuidString == peripheral.identifier.uuidString {
				self.peripherals[i] = peripheral
			}
		}
		
		self.sendEvent(EspressifEvent(state: .deviceUpdated, message: "Configured", peripherals: peripherals.map {
			var state : EspressifPeripheral.State = .notConfigured
			if peripheral.identifier.uuidString == $0.identifier.uuidString {
				state = .configured
			}

			return EspressifPeripheral(uuid:$0.identifier.uuidString, name: $0.name ?? "Unnamed", state: state)
		}))
	}
	
	func peripheralNotConfigured(peripheral: CBPeripheral) {
		self.peripherals = []
		self.sendEvent(EspressifEvent(state: .deviceUpdated, message: "NotConfigured", peripherals: []))
	}
	
	func peripheralDisconnected(peripheral: CBPeripheral, error: Error?) {
		self.peripherals = []
		self.sendEvent(EspressifEvent(state: .deviceUpdated, message: "Disconnected", peripherals: []))
	}
	
	
}
