import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    flex: 0,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  label: {},
  input: {
    borderColor: '#E5E5E5',
    borderWidth: 1,
    padding: 5,
    width: 200,
    borderRadius: 8,
    marginBottom: 20,
    color: 'black',
  },
  button: {
    backgroundColor: 'rgba(52, 199, 89, 1)',
    color: 'white',
    padding: 10,
    flex: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

type Props = {
  isVisible: boolean;
  onCancel: () => void;
  onSubmit: (ssid: string, passphrase: string) => Promise<void>;
};

export default function CredentialsModal({
  onCancel,
  onSubmit,
  isVisible,
}: Props) {
  const [ssid, setSsid] = useState('');
  const [passphrase, setPassphrase] = useState('');

  return (
    <Modal animationType="slide" transparent visible={isVisible}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.label}>SSID</Text>
          <TextInput style={styles.input} value={ssid} onChangeText={setSsid} />
          <Text style={styles.label}>Passphrase</Text>
          <TextInput
            secureTextEntry
            style={styles.input}
            value={passphrase}
            onChangeText={setPassphrase}
          />

          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={{ ...styles.button, backgroundColor: '#00A86B' }}>
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
