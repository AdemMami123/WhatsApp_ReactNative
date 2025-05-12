import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, KeyboardAvoidingView, TouchableOpacity, Alert } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
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
  const [uriImage, setUriImage] = useState("");

  // Load user data if it exists
  useEffect(() => {
    if (currentUserId) {
      const ref_uncompte = ref_listcomptes.child(currentUserId);
      ref_uncompte.once('value', (snapshot) => {
        if (snapshot.exists()) {
          setPseudo(snapshot.val().pseudo || '');
          setNumero(snapshot.val().numero || '');
          setUriImage(snapshot.val().image || '');
        }
      });
    }

    return () => {
      if (currentUserId) {
        const ref_uncompte = ref_listcomptes.child(currentUserId);
        ref_uncompte.off();
      }
    };
  }, [currentUserId]);

  const pickImage = async () => {
    // Request permission to access the media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera roll permissions to upload an image.");
      return;
    }
    
    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUriImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    // Check if currentUserId is valid before proceeding
    if (!currentUserId) {
      console.error("User ID is undefined");
      alert("Error: User ID is missing");
      return;
    }

    const ref_uncompte = ref_listcomptes.child(currentUserId);
    // Update user info with image URL if available
    ref_uncompte.update({ 
      id: currentUserId, 
      pseudo, 
      numero,
      image: uriImage || ""
    });
    alert("Profile updated successfully");
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingBox}>
        <Text variant="headlineMedium" style={styles.title}>
          Settings
        </Text>
        
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={uriImage ? { uri: uriImage } : require("../../assets/settings.png")}
            style={styles.avatar}
          />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
        
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
        
        <View style={styles.buttonGroup}>
          <Button 
            mode="contained" 
            onPress={handleSave} 
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
          >
            Save
          </Button>
          
          <Button
            mode="contained"
            onPress={() => {
              auth.signOut().then(() => {
                navigation.replace("Auth");
              });
            }}
            style={[styles.button, { backgroundColor: "#E53935", marginTop: 10 }]}
          >
            Déconnecter
          </Button>
        </View>
      </View>
    </View>
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
  settingBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    backgroundColor: "#f5f5f5",
  },
  changePhotoText: {
    color: "#6974d6",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    marginBottom: 15,
  },
  buttonGroup: {
    width: "100%",
    marginTop: 10,
  },
  button: {
    width: "100%",
    marginTop: 10,
  },
});