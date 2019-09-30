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
  render() {
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
              selectedValue={Config.transportType}
              onValueChange={itemValue => (Config.transportType = itemValue)}
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
              selectedValue={Config.securityType}
              onValueChange={itemValue => (Config.securityType = itemValue)}
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
