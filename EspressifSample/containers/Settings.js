import React from "react";
import { View, Text, StyleSheet, Picker } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { ESPTransportType, ESPSecurityType } from "react-native-espressif";

import Config from "../constants/config";

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  title: {
    fontSize: 20,
    textAlign: "center"
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
    const { transportType, securityType } = this.state;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>

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
          <View>
            <Text>Transport type</Text>
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
          <View>
            <Text>Security type</Text>
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
        </ScrollView>
      </View>
    );
  }
}
