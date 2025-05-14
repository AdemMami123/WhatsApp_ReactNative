import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ImageBackground,
  BackHandler,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useState } from "react";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import firebase from "../Config";
const auth = firebase.auth();
const database = firebase.database();

export default function Auth({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const currentUserId = userCredential.user.uid;
      const userEmail = userCredential.user.email;
      const ref_listcomptes = database.ref("ListComptes");

      await ref_listcomptes.child(currentUserId).once("value")
        .then(snapshot => {
          if (!snapshot.exists()) {
            console.log("Creating new ListComptes entry for user:", currentUserId);
            return ref_listcomptes.child(currentUserId).set({
              id: currentUserId,
              email: userEmail,
              pseudo: userEmail ? userEmail.split('@')[0] : 'New User',
              numero: ''
            });
          }
          return Promise.resolve();
        });
        
      navigation.replace("Home", {currentUserId});
    } catch (error) {
      Alert.alert("Login Failed", error.message);
      setIsLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ImageBackground
        style={styles.container}
        source={require("../assets/walpaper.jpg")}
      >
        <StatusBar style="light" />
        
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
            <Text style={styles.welcomeText}>Welcome back</Text>
            
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
            
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Connecting..." : "Connect"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => {
                BackHandler.exitApp();
              }}
            >
              <Text style={styles.exitButtonText}>Exit App</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => navigation.navigate("NewAccount")}
            >
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerLink}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: "center",
    justifyContent: "center",
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
  button: {
    backgroundColor: "#128C7E",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#94D3CC",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  exitButton: {
    marginTop: 15,
    alignItems: "center",
  },
  exitButtonText: {
    color: "#E53935",
    fontSize: 16,
  },
  registerText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 14,
  },
  registerLink: {
    color: "#128C7E",
    fontWeight: "bold",
  },
});