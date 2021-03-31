import Espressif, {
  ESPBluetoothState,
  ESPEventState,
  EspressifConfig,
  EspressifDevice,
  ESPSecurityType,
  ESPTransportType,
} from 'react-native-espressif';

const espressif = Espressif();

export const load = async (cb: (bluetoothState: ESPBluetoothState) => void) => {
  try {
    const config: EspressifConfig = {
      transportType: ESPTransportType.Bluetooth,
      securityType: ESPSecurityType.Sec1,
      bleDeviceNamePrefix: 'FoobotSat_',
      bleSessionUuid: '6563FF51-6564-5F62-616C-786F62726961',
      bleConfigUuid: '6563FF52-6564-5F62-616C-786F62726961',
      bleServiceUuid: '65636976-6564-5F62-616C-786F62726961',
    };

    console.info('set config', config);
    await espressif.setConfig(config);

    return espressif.addBluetoothStatusListener(cb);
  } catch (e) {
    console.error(e);
    // this.setState({ status: 'Error' });
  }
  return null;
};

export const scanDevices = (
  cb: (state: ESPEventState, devices: EspressifDevice[]) => void
) => {
  let listener = espressif.addDevicesListListener(cb);
  espressif.scanDevices();
  return listener;
};
