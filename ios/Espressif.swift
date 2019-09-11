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
		return ["devices-state"]
	}
	
	@objc func setConfig(_ config: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
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
			let configUUIDMap: [String: String] = [Provision.PROVISIONING_CONFIG_PATH: BLE_CONFIG_UUID]
			bleTransport = BLETransport(serviceUUIDString: BLE_SERVICE_UUID,
																	sessionUUIDString: BLE_SESSION_UUID,
																	configUUIDMap: configUUIDMap,
																	deviceNamePrefix: BLE_DEVICE_NAME_PREFIX,
																	scanTimeout: 1.0)
			self.bleTransport?.delegate = self
			self.transport = bleTransport
		} else {
			self.transport = SoftAPTransport(baseUrl: WIFI_BASEURL)
		}
		
		resolve(nil)
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
	
	@objc func setCredentials(_ ssid: String, _ passphrase: String){
		
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
		print("FOUND")
		self.peripherals = peripherals
		self.sendEvent(EspressifEvent(state: .devicesFound, message: "FOUND", peripherals: peripherals.map {
			return EspressifPeripheral(uuid:$0.identifier.uuidString, name: $0.name ?? "Unnamed", state: .notConfigured)
		}))
	}
	
	func peripheralsNotFound(serviceUUID: UUID?) {
		print("NOT FOUND \(serviceUUID)")
		self.peripherals = []
		self.sendEvent(EspressifEvent(state: .devicesNotFound, message: "NOT FOUND", peripherals: []))
	}
	
	func peripheralConfigured(peripheral: CBPeripheral) {
		print("CONFIGURED")
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
		print("NOTCONFIGURED")
		self.peripherals = []
		self.sendEvent(EspressifEvent(state: .deviceUpdated, message: "NotConfigured", peripherals: []))
	}
	
	func peripheralDisconnected(peripheral: CBPeripheral, error: Error?) {
		print("DISCONNECTED")
		self.peripherals = []
		self.sendEvent(EspressifEvent(state: .deviceUpdated, message: "Disconnected", peripherals: []))
	}
	
	
}
