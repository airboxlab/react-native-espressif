import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  DrawerActions,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import * as React from 'react';
import { Image, SafeAreaView, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import menuIcon from '../assets/menu.png';
import { LoggerContext } from './components/Logger';
import { Home } from './screens';

const Drawer = createDrawerNavigator();

const MenuButton = ({
  navigation,
}: {
  navigation: React.MutableRefObject<NavigationContainerRef>;
}) => (
  <View style={styles.menuButton}>
    <TouchableOpacity
      onPress={() => navigation.current.dispatch(DrawerActions.toggleDrawer())}
    >
      <Image
        resizeMode="contain"
        style={styles.menuButtonIcon}
        source={menuIcon}
      />
    </TouchableOpacity>
  </View>
);

export default function App() {
  const containerRef = React.useRef<NavigationContainerRef>();

  const [texts, setTexts] = React.useState<string[]>([]);

  const addText = (text: string) => {
    setTexts((oldTexts) => [
      ...oldTexts,
      `[${new Date().toISOString().substr(11, 8)}] - ${text}`,
    ]);
  };

  return (
    <LoggerContext.Provider value={{ texts, addText }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5FCFF' }}>
        <MenuButton navigation={containerRef} />
        <NavigationContainer ref={containerRef}>
          <Drawer.Navigator initialRouteName="Home">
            <Drawer.Screen name="Home" component={Home} />
          </Drawer.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </LoggerContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  menuButton: {
    position: 'absolute',
    top: 25,
    left: 10,
    zIndex: 1,
  },
  menuButtonIcon: {
    width: 30,
  },
});
