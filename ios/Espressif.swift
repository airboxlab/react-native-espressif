//
//  Espressif.swift
//  AFNetworking
//
//  Created by Julien Smolareck on 09/09/2019.
//

import Foundation
import CoreBluetooth

struct EspressifPeripheralNetwork: Codable {
	enum State: String, Codable {
		case notStarted = "NOT_STARTED" // 0
		case inProgress = "IN_PROGRESS" // 1
		case ok = "OK" // = 2
		case nok = "NOK" // = 3
		
		init?(intValue: Int) {
			switch intValue {
			case 0: self = .notStarted
			case 1: self = .inProgress
			case 2: self = .ok
			case 3: self = .nok
			default:
				self = .nok
			}
		}
	}
	
	var testIp : State = .notStarted
	var testInternet: State = .notStarted
	var testCloud: State = .notStarted
}


struct EspressifPeripheral: Codable {
	var uuid: String
	var name: String
	var state: State
	var networkStatus: EspressifPeripheralNetwork
	
	enum State: String, Codable {
		case notConfigured = "NOT_CONFIGURED"
		case configured = "CONFIGURED"
		case disconnected = "DISCONNECTED"
		case sessionEstablished = "SESSION_ESTABLISHED"
		case credentialsStarted = "CREDENTIALS_STARTED"
		case credentialsSet = "CREDENTIALS_SET"
		case credentialsApplied = "CREDENTIALS_APPLIED"
		case networkTest = "NETWORK_TEST"
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
	
	private var deviceNetworkState: EspressifPeripheralNetwork?
	
	
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
		return ["devices-state", "log", "device-status", "network-state"]
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
			
			if let peripheral = peripheral {
				self.sendEvent(EspressifPeripheral(
					uuid:peripheral.identifier.uuidString,
					name:peripheral.name ?? "Unnamed",
					state: .sessionEstablished,
					networkStatus: EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
				))
			}
			
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
	
	@objc func startNetworkTest(_ uuid: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock){
		self.deviceNetworkState = EspressifPeripheralNetwork()
		
		self.networkTestStatus(uuid, resolve: resolve, reject: reject)
	}
	
	func networkTestStatus(_ uuid: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
		if self.transport == nil || self.security == nil {
			reject("ERROR", "react-native-espressif is not initialized", nil)
			return
		}
		
		let peripheral = self.peripherals.first { $0.identifier.uuidString == uuid }
		if peripheral == nil {
			reject("ERROR", "Peripheral not found", nil)
			return
		}
		
		var requestData = NetworkTestStatusRequest()
		requestData.protocolVersion = 1
		self.provision?.send(to: "network-test", data: requestData, completionHandler: { (status, response: NetworkTestStatusResponse?, error) in
			guard error == nil else {
				reject("ERROR", "Error in sending wifi credentials : \(error.debugDescription)", error)
				return
			}
			
			guard let response = response else {
				reject("ERROR", "Error during network test response is nil", nil)
				return
			}
			
			var networkStatus = EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
			networkStatus.testIp = EspressifPeripheralNetwork.State(intValue: response.statusTestIp.rawValue) ?? .nok
			networkStatus.testCloud = EspressifPeripheralNetwork.State(intValue: response.statusTestCloud.rawValue) ?? .nok
			networkStatus.testInternet = EspressifPeripheralNetwork.State(intValue: response.statusTestInternet.rawValue) ?? .nok
			
			self.sendEvent(EspressifPeripheral(
				uuid: peripheral!.identifier.uuidString,
				name: peripheral!.name ?? "Unnamed",
				state: .networkTest,
				networkStatus: networkStatus
			))
			
			if response.statusTestCloud == .testOk && response.statusTestInternet == .testOk && response.statusTestIp == .testOk {
				resolve(nil)
				return
			} else if response.statusTestCloud == .testNok || response.statusTestInternet == .testNok || response.statusTestIp == .testNok {
				reject("ERROR", "A test failed", nil)
				return
			}
			
			DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
				self.networkTestStatus(uuid, resolve: resolve, reject: reject)
			}
		})
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
		
		print("""
		Set Credentials
		SSID \(ssid)
		PASSPHRASE \(passphrase)
		uuid \(uuid)
		""")

		let peripheral = self.peripherals.first { $0.identifier.uuidString == uuid }
		if peripheral == nil {
			reject("ERROR", "Peripheral not found", nil)
			return
		}
		
		self.sendEvent(EspressifPeripheral(
			uuid: peripheral!.identifier.uuidString,
			name: peripheral!.name ?? "Unnamed",
			state: .credentialsStarted,
			networkStatus: EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
		))

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
			
			self.sendEvent(EspressifPeripheral(
				uuid: peripheral!.identifier.uuidString,
				name: peripheral!.name ?? "Unnamed",
				state: .credentialsSet,
				networkStatus: EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
			))

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
				
				self.sendEvent(EspressifPeripheral(
					uuid: peripheral!.identifier.uuidString,
					name: peripheral!.name ?? "Unnamed",
					state: .credentialsApplied,
					networkStatus: EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
				))
				
				self.getWifiStatus { response, error in
					if error != nil {
						reject("ERROR", "Error in sending wifi credentials : \(status.rawValue)", error)
						return
					}
						
//					do {
					if response?.respGetStatus.staState == Espressif_WifiStationState.connected {
						self.networkTestStatus(uuid, resolve: resolve, reject: reject)
					} else {
						reject("ERROR", "The wifi status is not correct", nil)
					}
//						resolve(try response?.jsonString())
//					} catch {
//						reject("ERROR", "Error in sending wifi credentials : \(status.rawValue)", error)
//					}
					
				}
			}
		}
	}
	
	func sendEvent(to name: String, _ event: EspressifEvent){
		do {
			let jsonData = try JSONEncoder().encode(event)
			let json = String(data: jsonData, encoding: .utf8)!
		
			self.sendEvent(withName: name, body: json)
			print("Event sended")
		} catch let e {
			print("ERROR SEND EVENT \(e.localizedDescription)")
		}
	}
	
	
	func sendEvent(_ body: EspressifPeripheral) {
		do {
			let jsonData = try JSONEncoder().encode(body)
			let json = String(data: jsonData, encoding: .utf8)!
		
			self.sendEvent(withName: "device-status", body: json)
		} catch let e {
			print("ERROR SEND EVENT \(e.localizedDescription)")
		}
	}
}

extension Espressif: BLETransportDelegate {
	func peripheralsFound(peripherals: [CBPeripheral]) {
		self.peripherals = peripherals
		self.sendEvent(to: "devices-state", EspressifEvent(state: .devicesFound, message: "FOUND", peripherals: peripherals.map {
			return EspressifPeripheral(
				uuid:$0.identifier.uuidString,
				name: $0.name ?? "Unnamed",
				state: .notConfigured,
				networkStatus: EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
			)
		}))
	}
	
	func peripheralsNotFound(serviceUUID: UUID?) {
		self.peripherals = []
		self.sendEvent(to: "devices-state", EspressifEvent(state: .devicesNotFound, message: "NOT FOUND", peripherals: []))
	}
	
	func peripheralConfigured(peripheral: CBPeripheral) {
		for i in 0..<self.peripherals.count {
			if self.peripherals[i].identifier.uuidString == peripheral.identifier.uuidString {
				self.peripherals[i] = peripheral
			}
		}
		
		self.sendEvent(EspressifPeripheral(
			uuid:peripheral.identifier.uuidString,
			name:peripheral.name ?? "Unnamed",
			state: .configured,
			networkStatus: EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
		))
	}
	
	func peripheralNotConfigured(peripheral: CBPeripheral) {
		self.sendEvent(EspressifPeripheral(
			uuid:peripheral.identifier.uuidString,
			name:peripheral.name ?? "Unnamed",
			state: .notConfigured,
			networkStatus: EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
		))

	}
	
	func peripheralDisconnected(peripheral: CBPeripheral, error: Error?) {
		self.peripherals = []
		self.sendEvent(EspressifPeripheral(
			uuid:peripheral.identifier.uuidString,
			name:peripheral.name ?? "Unnamed",
			state: .disconnected,
			networkStatus: EspressifPeripheralNetwork(testIp: .notStarted, testInternet: .notStarted, testCloud: .notStarted)
		))
	}
}
