import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  StatusBar
} from "react-native";
import { Text, TextInput, Divider, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import firebase from "../../Config/index";
const auth = firebase.auth();

const database = firebase.database();
const ref_database = database.ref();
const ref_listcomptes = ref_database.child("ListComptes");

export default function Setting({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;

  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [numero, setNumero] = useState("");
  const [uriImage, setUriImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      const ref_uncompte = ref_listcomptes.child(currentUserId);
      ref_uncompte.once('value', (snapshot) => {
        if (snapshot.exists()) {
          setEmail(snapshot.val().email || '');
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
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photos");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUriImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      Alert.alert("Error", "User ID is missing");
      return;
    }
    
    if (!pseudo || pseudo.trim().length < 3) {
      Alert.alert("Validation Error", "Username must be at least 3 characters");
      return;
    }
    
    setSaving(true);
    
    try {
      const ref_uncompte = ref_listcomptes.child(currentUserId);
      await ref_uncompte.update({ 
        id: currentUserId, 
        email,
        pseudo, 
        numero,
        image: uriImage || ""
      });
      
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: () => {
            auth.signOut().then(() => {
              navigation.replace("Auth");
            });
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#075e54" barStyle="light-content" />
      
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {uriImage ? (
            <Image source={{ uri: uriImage }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <MaterialCommunityIcons name="account" size={80} color="#fff" />
            </View>
          )}
          <View style={styles.cameraIconContainer}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.settingsSection}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-edit" size={22} color="#128C7E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Profile Information</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            mode="flat"
            value={pseudo}
            onChangeText={setPseudo}
            style={styles.input}
            underlineColor="#ddd"
            activeUnderlineColor="#128C7E"
            error={pseudo.trim().length > 0 && pseudo.trim().length < 3}
            right={<TextInput.Affix text={`${pseudo.length}/25`} />}
            maxLength={25}
          />
          <Text style={styles.inputHelper}>
            This name will be visible to your contacts
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            mode="flat"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            underlineColor="#ddd"
            activeUnderlineColor="#128C7E"
            keyboardType="email-address"
            disabled={true}
            right={<TextInput.Icon icon="lock" color="#888" />}
          />
          <Text style={styles.inputHelper}>
            Email cannot be changed
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            mode="flat"
            value={numero}
            onChangeText={setNumero}
            style={styles.input}
            underlineColor="#ddd"
            activeUnderlineColor="#128C7E"
            keyboardType="phone-pad"
          />
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.savingButton]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#FF5252" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>WhatsUp v1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  profileHeader: {
    backgroundColor: "#075e54",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    position: "relative",
    marginTop: 60,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  defaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#128C7E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#25D366",
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  settingsSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 15,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "transparent",
    fontSize: 16,
  },
  inputHelper: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: "#128C7E",
    marginHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 10,
  },
  savingButton: {
    backgroundColor: "#94D3CC",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingVertical: 10,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutText: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "500",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  versionText: {
    color: "#999",
    fontSize: 14,
  },
});