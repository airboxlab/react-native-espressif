import React from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignContent: "stretch",
    alignItems: "stretch",
    padding: 10
  },
  text: {
    color: "white",
    paddingVertical: 10
  }
});

export default class Logger extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      texts: []
    };

    if (props.onRef) props.onRef(this);
    this.addLine = this.addLine.bind(this);
  }

  addLine(text) {
    const { texts } = this.state;
    this.setState({
      texts: [...texts, text]
    });
  }

  render() {
    const { texts } = this.state;
    return (
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          ref={ref => (this.scrollView = ref)}
          onContentSizeChange={(contentWidth, contentHeight) => {
            this.scrollView.scrollToEnd({ animated: true });
          }}
        >
          {texts.map((text, index) => (
            <Text key={index} style={styles.text}>
              - {text}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  }
}
