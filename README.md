React Natine Package of BluFi for ESP32 network configurator BluFi. This app sends to a ESP32 device the SSID and passphrase to which the IoT device will connect to. Goal of this package is to ease integration of ESP32 network configuration in your React Native app. 

# react-native-espressif

## References

1. BluFi documentation: https://docs.espressif.com/projects/esp-idf/en/latest/api-guides/blufi.html
2. BluFi reference iOS app: https://apps.apple.com/us/app/espblufi/id1450614082
3. BluFi iOS source: https://github.com/EspressifApp/EspBlufiForiOS
4. BluFi Android source: https://github.com/EspressifApp/EspBlufiForAndroid

## Requierements

TODO

## Getting started

`$ npm install react-native-espressif --save`

### Mostly automatic installation

`$ react-native link react-native-espressif`

### Manual installation

#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-espressif` and add `Espressif.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libEspressif.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)

#### Android

⚠ `react-native-espressif` is not supported on Android for now, contributions welcome.

~~1. Open up `android/app/src/main/java/[...]/MainApplication.java`~~
  ~~- Add `import com.reactlibrary.EspressifPackage;` to the imports at the top of the file~~
  ~~- Add `new EspressifPackage()` to the list returned by the `getPackages()` method~~
~~2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-espressif'
  	project(':react-native-espressif').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-espressif/android')
  	```~~
~~3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-espressif')
  	```~~

### 

## Usage
```javascript
import Espressif from 'react-native-espressif';

// TODO: What to do with the module?
Espressif;
```
