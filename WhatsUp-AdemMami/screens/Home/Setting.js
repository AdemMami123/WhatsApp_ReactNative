import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, KeyboardAvoidingView } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import firebase from "../../Config/index";
const auth = firebase.auth();

const database = firebase.database();
const ref_database = database.ref();
const ref_listcomptes = ref_database.child("ListComptes");

export default function Setting({ navigation, route }) {
  // Get current user ID from route params
  const currentUserId = route.params?.currentUserId;

  const [pseudo, setPseudo] = useState("");
  const [numero, setNumero] = useState("");

  // Load user data if it exists
  useEffect(() => {
    if (currentUserId) {
      const ref_uncompte = ref_listcomptes.child(currentUserId);
      ref_uncompte.once('value', (snapshot) => {
        if (snapshot.exists()) {
          setPseudo(snapshot.val().pseudo || '');
          setNumero(snapshot.val().numero || '');
        }
      });
    }
  }, [currentUserId]);

  const handleSave = () => {
    // Check if currentUserId is valid before proceeding
    if (!currentUserId) {
      console.error("User ID is undefined");
      alert("Error: User ID is missing");
      return;
    }

    const ref_uncompte = ref_listcomptes.child(currentUserId);
    // Update user info without online status
    ref_uncompte.update({ 
      id: currentUserId, 
      pseudo, 
      numero
    });
    alert("Profile updated successfully");
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Settings
      </Text>
      <Image
        source={require("../../assets/settings.png")}
        style={styles.profileImage}
      />
      <TextInput
        label="Pseudo"
        mode="outlined"
        value={pseudo}
        onChangeText={setPseudo}
        style={styles.input}
      />
      <TextInput
        label="Numéro"
        mode="outlined"
        keyboardType="phone-pad"
        value={numero}
        onChangeText={setNumero}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleSave} style={styles.button}>
        Save
      </Button>
      <Button
        mode="outlined"
        onPress={() => {
          // Simply sign out without updating online status
          auth.signOut().then(() => {
            navigation.replace("Auth"); // Changed to replace
          });
        }}
        style={styles.logoutButton}
      >
        Déconnecter
      </Button>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 30,
  },
  input: {
    width: "100%",
    marginBottom: 15,
  },
  button: {
    width: "70%",
    marginTop: 10,
  },
  logoutButton: {
    width: "70%",
    marginTop: 10,
  },
});