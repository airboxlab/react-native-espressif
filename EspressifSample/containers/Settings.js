import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Picker,
  TextInput,
  KeyboardAvoidingView
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { ESPTransportType, ESPSecurityType } from "react-native-espressif";

import Config from "../constants/config";

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  view: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    overflow: "hidden"
  },
  title: {
    fontSize: 20,
    textAlign: "center"
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#999999",
    padding: 5,
    marginHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    color: "black"
  }
});

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const config = Config.get();
    this.setState({
      ...config
    });
  }

  render() {
    const {
      transportType,
      securityType,
      bleDeviceNamePrefix,
      wifiNetworkNamePrefix,
      wifiBaseUrl
    } = this.state;

    return (
      <View style={styles.container}>
        <Text style={{ ...styles.title, fontWeight: "bold" }}>Settings</Text>

        <ScrollView
          style={{
            marginTop: 20,
            flex: 1
          }}
          contentContainerStyle={{
            alignContent: "stretch",
            alignItems: "stretch"
          }}
        >
          <KeyboardAvoidingView behavior="padding">
            <View style={styles.view}>
              <Text style={styles.title}>Transport type</Text>
              <Picker
                selectedValue={transportType}
                onValueChange={transportType => {
                  this.setState({ transportType });
                  Config.setTransportType(transportType);
                }}
              >
                <Picker.Item label="Wifi" value={ESPTransportType.Wifi} />
                <Picker.Item
                  label="Bluetooth"
                  value={ESPTransportType.Bluetooth}
                />
              </Picker>
            </View>
            <View style={styles.view}>
              <Text style={styles.title}>Security type</Text>
              <Picker
                selectedValue={securityType}
                onValueChange={securityType => {
                  this.setState({ securityType });
                  Config.setSecurityType(securityType);
                }}
              >
                <Picker.Item label="Sec0" value={ESPSecurityType.Sec0} />
                <Picker.Item label="Sec1" value={ESPSecurityType.Sec1} />
              </Picker>
            </View>
            <View style={styles.view}>
              <Text style={styles.title}>BLE Device Name prefix</Text>
              <TextInput
                style={styles.input}
                value={bleDeviceNamePrefix}
                onChangeText={bleDeviceNamePrefix => {
                  this.setState({ bleDeviceNamePrefix });
                  Config.setBleDeviceNamePrefix(bleDeviceNamePrefix);
                }}
              />
            </View>
            <View style={styles.view}>
              <Text style={styles.title}>Wifi</Text>
              <Text>Base Url</Text>
              <TextInput
                style={styles.input}
                value={wifiBaseUrl}
                onChangeText={wifiBaseUrl => {
                  this.setState({ wifiBaseUrl });
                  Config.setWifiBaseUrl(wifiBaseUrl);
                }}
              />
              <Text>Network Name prefix</Text>
              <TextInput
                style={styles.input}
                value={wifiNetworkNamePrefix}
                onChangeText={wifiNetworkNamePrefix => {
                  this.setState({ wifiNetworkNamePrefix });
                  Config.setWifiNetworkNamePrefix(wifiNetworkNamePrefix);
                }}
              />
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    );
  }
}
