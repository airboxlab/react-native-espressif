import React from "react";
import {
  View,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet
} from "react-native";

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.2)",
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center"
  },
  modal: {
    backgroundColor: "white",
    flex: 0,
    borderRadius: 8,
    padding: 20,
    alignItems: "center"
  },
  label: {},
  input: {
    borderColor: "#E5E5E5",
    borderWidth: 1,
    padding: 5,
    width: 200,
    borderRadius: 8,
    marginBottom: 20,
    color: "black"
  },
  button: {
    backgroundColor: "rgba(52, 199, 89, 1)",
    color: "white",
    padding: 10,
    flex: 0,
    borderRadius: 8,
    overflow: "hidden"
  }
});

export default class CredentialsModal extends React.Component {
  state = {
    ssid: "",
    passphrase: ""
  };

  render() {
    const { ssid, passphrase } = this.state;
    const { isVisible = false, onSubmit, onCancel } = this.props;

    return (
      <Modal animationType="slide" transparent visible={isVisible}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.label}>SSID</Text>
            <TextInput
              style={styles.input}
              value={ssid}
              onChangeText={ssid => {
                this.setState({ ssid });
              }}
            />
            <Text style={styles.label}>Passphrase</Text>
            <TextInput
              style={styles.input}
              value={passphrase}
              onChangeText={passphrase => {
                this.setState({ passphrase });
              }}
            />

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={async () => {
                  onCancel();
                }}
              >
                <Text style={{ ...styles.button, backgroundColor: "#00A86B" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  await onSubmit(ssid, passphrase);
                }}
              >
                <Text style={styles.button}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}
