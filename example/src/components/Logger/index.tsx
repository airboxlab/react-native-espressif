import React, { createContext, useContext, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignContent: 'stretch',
    alignItems: 'stretch',
    padding: 10,
  },
  text: {
    color: 'white',
    paddingVertical: 5,
  },
});

export interface LoggerProviver {
  texts: string[];
  addText: (text: string) => void;
}

export const LoggerContext = createContext<LoggerProviver | null>(null);

export default function Logger() {
  const scrollView = useRef<ScrollView>();

  const { texts = [] } = useContext(LoggerContext) ?? {};

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        ref={scrollView}
        onContentSizeChange={() => {
          scrollView.current?.scrollToEnd({ animated: true });
        }}
      >
        {texts.map((text, index) => (
          <Text key={index} style={styles.text}>
            {text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
