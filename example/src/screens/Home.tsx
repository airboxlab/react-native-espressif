import React, { useContext, useEffect, useState } from 'react';
import { EmitterSubscription, StyleSheet, Text, View } from 'react-native';
import {
  ESPBluetoothState,
  ESPDeviceState,
  EspressifDevice,
} from 'react-native-espressif';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { load, scanDevices } from '../actions';
import { Logger } from '../components';
import Devices from '../components/Devices';
import { LoggerContext } from '../components/Logger';
import CredentialsModal from './CredentialsModal';

export default function Home() {
  const [bluetoothStatus, setBluetoothStatus] = useState(
    ESPBluetoothState.Unknown
  );
  const [selected, setSelected] = useState<EspressifDevice | null>(null);
  const [devices, setDevices] = useState<EspressifDevice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const logger = useContext(LoggerContext);

  /**
   * Function to scan nearest devices
   */
  const scan = () => {
    logger?.addText('Start scanning devices');

    let devicesListListener = scanDevices((state, devices) => {
      logger?.addText(`STATE [${state}]`);

      setDevices(devices);
      devicesListListener.remove();
    });
  };

  /**
   * Function to connect to a chosen device
   * - The Session must be established before doing anything else
   * @param {EspressifDevice} device
   */
  const selectedDevice = (device: EspressifDevice) => {
    device.onStatusChanged = async (device) => {
      logger?.addText(
        `Device status changed ${
          device ? JSON.stringify(device, null, 2) : null
        }`
      );

      switch (device.state) {
        case ESPDeviceState.NotConfigured:
          logger?.addText('Start session');
          await device.startSession();
          break;
        case ESPDeviceState.SessionEstablished:
          logger?.addText('Session established');
          break;
      }
    };

    logger?.addText(`Connect to ${device.uuid}`);
    device.connect();
    setSelected(device);
  };

  const setCredentials = async (ssid: string, passphrase: string) => {
    try {
      console.info('SET_CREDNETIALS', { ssid, passphrase, selected });
      setModalVisible(false);
      await selected?.setCredentials(ssid, passphrase);
      logger?.addText(`Credentials successfully changed`);
    } catch (e) {
      console.info(e);
      logger?.addText(e);
    }
  };

  useEffect(() => {
    logger?.addText('Initialize');

    let bluetoothStatusSubscription: EmitterSubscription | null = null;

    load(setBluetoothStatus).then((subscription) => {
      logger?.addText('Loaded');
      bluetoothStatusSubscription = subscription;
    });

    return () => {
      console.info('UNMOUNT');
      bluetoothStatusSubscription?.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <CredentialsModal
        isVisible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={setCredentials}
      />
      <View style={{ flex: 2 }}>
        <Text style={styles.welcome}>Espressif example</Text>
        <Text style={styles.instructions}>STATUS: {bluetoothStatus}</Text>

        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity onPress={scan}>
            <Text style={styles.scanDevices}>Scan devices</Text>
          </TouchableOpacity>
        </View>
        <Devices
          devices={devices}
          onSelected={selectedDevice}
          setCredentials={(device) => {
            setSelected(device);
            setModalVisible(true);
          }}
        />
      </View>

      <Logger />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  scanDevices: {
    backgroundColor: '#00A86B',
    fontSize: 18,
    fontWeight: '100',
    padding: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    marginTop: 20,
  },
});
