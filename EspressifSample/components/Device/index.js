import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  link: {
    color: "rgba(0,122,255,1)",
    height: 50,
    flex: 1,
    textAlign: "center",
    backgroundColor: "lightgrey",
    paddingVertical: 14
  },
  item: {
    backgroundColor: "white",
    padding: 20,
    width: 400,
    borderRadius: 8,
    overflow: "hidden"
  }
});

export default class Device extends React.Component {
  render() {
    const {
      device,
      setCredentials,
      getDeviceInfo,
      scanWifi,
      connectTo
    } = this.props;

    return (
      <View style={{ flex: 1, alignContent: "stretch" }}>
        <TouchableOpacity
          onPress={connectTo}
          style={{
            shadowColor: "black",
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 2,
            shadowOpacity: 0.15
          }}
        >
          <View style={styles.item}>
            <Text
              style={{
                color: "#333333"
              }}
            >
              {device.name}
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: 12
              }}
            >
              {device.uuid}
            </Text>
            <Text
              style={{
                color: "#666666",
                fontSize: 12
              }}
            >
              {device.state}
            </Text>
          </View>
        </TouchableOpacity>
        {device.state === "SESSION_ESTABLISHED" ? (
          <View
            style={{
              flexDirection: "row",
              flex: 1,
              alignContent: "stretch",
              alignItems: "stretch"
            }}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={setCredentials}>
              <Text style={styles.link}>Set credentials</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={getDeviceInfo}>
              <Text style={styles.link}>Get device info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={scanWifi}>
              <Text style={styles.link}>Scan Wifi</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }
}
