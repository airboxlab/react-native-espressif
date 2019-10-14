import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from "react-native";
import Espressif, {
  ESPDeviceState,
  ESPSecurityType,
  ESPTransportType,
  ESPEventState
} from "react-native-espressif";
import { ScrollView } from "react-native-gesture-handler";

import Logger from "../components/Logger";

import CredentialsModal from "../CredentialsModal";

import ESPConfig from "../constants/config";

import Device from "../components/Device";

export default class App extends Component {
  constructor(props) {
    super(props);

    this.loggerRef = React.createRef();

    this.state = {
      status: "Initializing",
      devices: [],
      displayCredentialsModal: false,
      selectedDevice: null
    };

    this.espressif = new Espressif();

    this.scanDevices = this.scanDevices.bind(this);
    this.load = this.load.bind(this);
    this.deviceStatusChanged = this.deviceStatusChanged.bind(this);
  }

  componentDidMount() {
    this.props.navigation.addListener("willFocus", this.load);
  }

  async deviceStatusChanged(device) {
    const { devices } = this.state;

    let index = devices.findIndex(temp => temp.uuid === device.uuid);
    devices[index] = device;

    this.loggerRef.addLine(
      `Device status changed ${device ? JSON.stringify(device, null, 2) : null}`
    );

    switch (device.state) {
      case ESPDeviceState.Configured:
        this.loggerRef.addLine("Start session");
        await device.startSession();
        break;
      case ESPDeviceState.SessionEstablished:
        this.loggerRef.addLine("Session established");
        this.setState({ selectedDevice: device });
      default:
        break;
    }

    this.setState({ devices: [...devices] });
  }

  async load() {
    try {
      await this.espressif.setConfig(ESPConfig.get());

      this.loggerRef.addLine(
        `RNEspressif is starting with ${JSON.stringify(
          ESPConfig.get(),
          null,
          2
        )}`
      );

      this.espressif.OnStateChanged = (state, devices) => {
        this.loggerRef.addLine(`STATE [${state}]`);
        this.setState({ devices });

        devices.forEach(device => {
          if (!device.onStatusChanged) {
            device.onStatusChanged = this.deviceStatusChanged;
          }
        });
      };

      this.setState({ status: "Ready" });

      this.loggerRef.addLine("RNEspressif is configured");
    } catch (e) {
      console.error(e);
      this.setState({ status: "Error" });
    }
  }

  scanDevices() {
    this.espressif.scanDevices();
    this.loggerRef.addLine("Start scanning devices");
  }

  render() {
    const {
      status,
      devices = [],
      displayCredentialsModal,
      selectedDevice
    } = this.state;

    return (
      <View style={styles.container}>
        <CredentialsModal
          isVisible={displayCredentialsModal}
          onCancel={() => {
            this.setState({ displayCredentialsModal: false });
          }}
          onSubmit={async (ssid, passphrase) => {
            try {
              this.setState({ displayCredentialsModal: false });

              await selectedDevice.setCredentials(ssid, passphrase);

              this.loggerRef.addLine(`Credentials successfully changed`);
            } catch (e) {
              console.info(e);
              this.loggerRef.addLine(e);
            }
          }}
        />
        <Text style={styles.welcome}>Espressif example</Text>
        <Text style={styles.instructions}>STATUS: {status}</Text>

        <View style={{ alignItems: "center" }}>
          <TouchableOpacity onPress={this.scanDevices}>
            <Text style={styles.scanDevices}>Scan devices</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list}>
          {(devices || []).map(device => (
            <Device
              key={device.uuid}
              device={device}
              connectTo={() => {
                this.loggerRef.addLine(`Connect to ${device.uuid}`);
                device.connect();
              }}
              setCredentials={() => {
                this.setState({ displayCredentialsModal: true });
              }}
              getDeviceInfo={async () => {
                try {
                  this.loggerRef.addLine("GET DEVICE INFO");
                  const data = await this.espressif.getDeviceInfo();
                  this.loggerRef.addLine(
                    `Get device info ${JSON.stringify(
                      JSON.parse(data),
                      null,
                      2
                    )}`
                  );
                } catch (e) {
                  console.error(e);
                  this.loggerRef.addLine(`ERROR ${JSON.stringify(e, null, 2)}`);
                }
              }}
              scanWifi={async () => {
                try {
                  const wifis = await device.scanWifi();

                  this.loggerRef.addLine(
                    `Scan wifi finished ${JSON.stringify(
                      JSON.parse(wifis),
                      null,
                      2
                    )}`
                  );
                } catch (e) {
                  console.info(e);
                  // this.loggerRef.addLine(`ERROR ${JSON.stringify(e, null, 2)}`);
                }
              }}
            />
          ))}
        </ScrollView>
        <Logger onRef={ref => (this.loggerRef = ref)} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  },
  scanDevices: {
    backgroundColor: "#00A86B",
    fontSize: 18,
    fontWeight: "100",
    padding: 20,
    borderRadius: 8,
    overflow: "hidden"
  },
  list: {
    flex: 1,
    marginTop: 20
  }
});
