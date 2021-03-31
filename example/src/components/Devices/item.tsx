import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ESPDeviceState, EspressifDevice } from 'react-native-espressif';

const styles = StyleSheet.create({
  link: {
    color: 'rgba(0,122,255,1)',
    height: 50,
    flex: 1,
    textAlign: 'center',
    backgroundColor: 'lightgrey',
    paddingVertical: 14,
  },
  item: {
    backgroundColor: 'white',
    padding: 20,
    // width: 400,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    margin: 10,
  },
});

interface Props {
  device: EspressifDevice;
  onSelected: () => void;
  setCredentials: () => void;
  getDeviceInfo: () => void;
  scanWifi: () => void;
  startNetworkStatus: () => void;
}

export default function Item({
  device,
  onSelected,
  setCredentials,
  getDeviceInfo,
  scanWifi,
  startNetworkStatus,
}: Props) {
  return (
    <View style={{ flex: 1, alignContent: 'stretch' }}>
      <TouchableOpacity
        onPress={onSelected}
        style={{
          shadowColor: 'black',
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 2,
          shadowOpacity: 0.15,
          elevation: 7,
        }}
      >
        <View style={styles.item}>
          <Text
            style={{
              color: '#333333',
            }}
          >
            {device.name}
          </Text>
          <Text
            style={{
              color: '#666666',
              fontSize: 12,
            }}
          >
            {device.uuid}
          </Text>
          <Text
            style={{
              color: '#666666',
              fontSize: 12,
            }}
          >
            {device.state}
          </Text>
        </View>
      </TouchableOpacity>
      {device.state !== ESPDeviceState.Disconnected && device.state !== ESPDeviceState.NotConfigured ? (
        <View
          style={{
            flexDirection: 'row',
            flex: 1,
            justifyContent: 'space-between',
            alignContent: 'stretch',
            alignItems: 'stretch',
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
          <TouchableOpacity style={{ flex: 1 }} onPress={startNetworkStatus}>
            <Text style={styles.link}>Network test</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
