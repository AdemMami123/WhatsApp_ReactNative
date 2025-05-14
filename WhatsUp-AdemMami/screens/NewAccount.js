import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import firebase from "../Config";
const auth = firebase.auth();
const database = firebase.database();

export default function NewAccount({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const currentUserId = userCredential.user.uid;
      const userEmail = userCredential.user.email;
      
      const ref_listcomptes = database.ref("ListComptes");
      
      await ref_listcomptes.child(currentUserId).set({
        id: currentUserId,
        email: userEmail,
        pseudo: userEmail ? userEmail.split('@')[0] : 'New User',
        numero: ''
      });
      
      navigation.replace("Home", {currentUserId});
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        style={styles.container}
        source={require("../assets/walpaper.jpg")}
      >
        <StatusBar style="light" />
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.overlay}>
            <View style={styles.logoContainer}>
              <Image 
                source={require("../assets/icon.png")} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appTitle}>WhatsUp</Text>
            </View>
            
            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>Create Account</Text>
              
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#075e54" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#075e54" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry={hidePassword}
                />
                <TouchableOpacity onPress={() => setHidePassword(!hidePassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons
                    name={hidePassword ? "eye-off" : "eye"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color="#075e54" style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  secureTextEntry={hideConfirmPassword}
                />
                <TouchableOpacity onPress={() => setHideConfirmPassword(!hideConfirmPassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons
                    name={hideConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.createButton, isLoading && styles.buttonDisabled]}
                  onPress={handleCreateAccount}
                  disabled={isLoading}
                >
                  <Text style={styles.createButtonText}>
                    {isLoading ? "Creating..." : "Create"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                onPress={() => navigation.navigate("Auth")}
              >
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginLink}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#075e54",
    marginTop: 10,
  },
  formContainer: {
    width: "85%",
    maxWidth: 350,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "500",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 5,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  backButtonText: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "bold",
  },
  createButton: {
    flex: 1,
    backgroundColor: "#128C7E",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#94D3CC",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 14,
  },
  loginLink: {
    color: "#128C7E",
    fontWeight: "bold",
  },
});