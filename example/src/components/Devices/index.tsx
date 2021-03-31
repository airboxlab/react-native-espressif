import React, { useContext } from 'react';
import type { EspressifDevice } from 'react-native-espressif';
import { ScrollView } from 'react-native-gesture-handler';
import { LoggerContext } from '../Logger';
import Item from './item';

interface Props {
  devices: EspressifDevice[];
  onSelected: (device: EspressifDevice) => void;
  setCredentials: (device: EspressifDevice) => void;
}

export default function Devices({
  devices = [],
  onSelected,
  setCredentials,
}: Props) {
  const logger = useContext(LoggerContext);

  const getDeviceInfo = async (device: EspressifDevice) => {
    logger.addText('GET DEVICE INFO');

    const data = await device.getDeviceInfo();
    logger.addText(`Get device info ${JSON.stringify(data, null, 2)}`);
  };

  const scanWifi = async (device: EspressifDevice) => {
    logger.addText('Scan wifi');
    const wifis = await device.scanWifi();

    logger.addText(`Scan wifi finished ${JSON.stringify(wifis, null, 2)}`);
  };

  return (
    <ScrollView style={{ flex: 1, marginTop: 20 }}>
      {devices.map((device) => (
        <Item
          key={device.uuid}
          device={device}
          onSelected={() => onSelected(device)}
          scanWifi={() => scanWifi(device)}
          getDeviceInfo={() => getDeviceInfo(device)}
          setCredentials={() => setCredentials(device)}
        />
      ))}
    </ScrollView>
  );
}
