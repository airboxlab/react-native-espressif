//
//  Config.swift
//  AFNetworking
//
//  Created by Julien Smolareck on 10/09/2019.
//

import Foundation

let PROOF_OF_POSSESSION = "abcd1234"
let BLE_CONFIG_UUID = "0000FF52-0000-1000-8000-00805F9B34FB"
let BLE_SERVICE_UUID = "0000ffff-0000-1000-8000-00805f9b34fb"
let BLE_SESSION_UUID = "0000ff51-0000-1000-8000-00805f9b34fb"
var BLE_DEVICE_NAME_PREFIX = "PROV_"
var WIFI_BASEURL = "192.168.4.1:80"
var WIFI_NETWORKNAME_PREFIX = "mysoftap"

class EspressifConfig {
	
	
	enum OptionsType: String {
		case TransportType = "transportType"
		case SecurityType = "securityType"
		case BleDeviceNamePrefix = "bleDeviceNamePrefix"
		case WifiBaseUrl = "wifiBaseUrl"
		case WifiNetworkNamePrefix = "wifiNetworkNamePrefix"
	}
	
	enum TransportType: String {
		case Wifi = "wifi"
		case Bluetooh = "bluetooth"
	}
	
	enum SecurityType: String {
		case Sec0 = "sec0"
		case Sec1 = "sec1"
	}
	
	enum Errors: LocalizedError {
		case optionUndefined(option: String)
		case valueUndefined(value: String?, option: String)
	}
	
	
	private(set) var security: SecurityType = .Sec0
	private(set) var transport: TransportType = .Wifi
	
	func set(_ config: NSDictionary) throws {
		try config.forEach { (key, value) in
			guard let keyStr = key as? String else {
				return
			}
			
			let optionsType = try OptionsType(value: keyStr)
			switch optionsType {
			case .SecurityType:
				self.security = try SecurityType(value: value as? String)
			case .TransportType:
				self.transport = try TransportType(value: value as? String)
			case .BleDeviceNamePrefix:
				BLE_DEVICE_NAME_PREFIX = (value as? String) ?? "PROV_"
			case .WifiBaseUrl:
				WIFI_BASEURL = (value as? String) ?? "192.168.4.1:80"
			case .WifiNetworkNamePrefix:
				WIFI_NETWORKNAME_PREFIX = (value as? String) ?? "mysoftap"
			}
		}
	}
	
	
}

extension EspressifConfig.OptionsType {
	init(value: String) throws {
		switch value {
		case "transportType":
			self = .TransportType
		case "securityType":
			self = .SecurityType
		case "bleDeviceNamePrefix":
			self = .BleDeviceNamePrefix
		case "wifiBaseUrl":
			self = .WifiBaseUrl
		case "wifiNetworkNamePrefix":
			self = .WifiNetworkNamePrefix
		default:
			throw EspressifConfig.Errors.optionUndefined(option: value)
		}
	}
}

extension EspressifConfig.TransportType {
	init(value: String?) throws {
		switch value {
		case "wifi":
			self = .Wifi
		case "bluetooth":
			self = .Bluetooh
		default:
			throw EspressifConfig.Errors.valueUndefined(value: value, option: "TransportType")
		}
	}
}

extension EspressifConfig.SecurityType{
	init(value: String?) throws {
		switch value {
		case "sec0":
			self = .Sec0
		case "sec1":
			self = .Sec1
		default:
			throw EspressifConfig.Errors.valueUndefined(value: value, option: "SecurityType")
		}
	}
}

extension EspressifConfig.Errors {
	var errorDescription: String? {
		return self.localizedDescription
	}
	
	var localizedDescription: String {
		switch self {
		case .optionUndefined(let option):
			return "[RNESPRESSIF] The option: \"\(option)\" is not supported"
		case .valueUndefined(let value, let option):
			if value == nil {
				return "[RNESPRESSIF] The value nil is not supported for \(option)"
			}
			return "[RNESPRESSIF] The value \"\(value!)\" is not supported for \(option)"
		}
	}
}
