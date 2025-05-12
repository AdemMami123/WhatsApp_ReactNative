import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  ImageBackground,
  Alert,
} from "react-native";
import firebase from "../Config";
const auth = firebase.auth();
const database = firebase.database(); // Add database reference

export default function NewAccount({ navigation }) {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [confirmpassword, setconfirmpassword] = useState("");
  
  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/walpaper.jpg")}
    >
      <View
        style={{
          width: 300,
          height: 320,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 7,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            fontStyle: "italic",
            color: "darkgray",
            marginBottom: 10,
          }}
        >
          Create new Account
        </Text>
        <TextInput
          onChangeText={(ch) => {
            setemail(ch);
          }}
          style={styles.input}
          placeholder="Enter your Email"
          keyboardType="email-address"
        />
        <TextInput
          onChangeText={(ch) => {
            setpassword(ch);
          }}
          style={styles.input}
          placeholder="Enter your Password"
          secureTextEntry={true}
        />
        <TextInput
          onChangeText={(ch) => {
            setconfirmpassword(ch);
          }}
          style={styles.input}
          placeholder="Confirm your Password"
          secureTextEntry={true}
        />
        <View style={{ flexDirection: "row", gap: 15 }}>
          <Button
            onPress={() => {
              navigation.goBack();
            }}
            title="Back"
            color="#FF7F7F"
          />
          <Button
            onPress={() => {
              if (password === confirmpassword) {
                auth
                  .createUserWithEmailAndPassword(email, password)
                  .then((userCredential) => {
                    // Get the user ID from the credential
                    const currentUserId = userCredential.user.uid;
                    const userEmail = userCredential.user.email;
                    
                    // Create a reference to ListComptes node
                    const ref_listcomptes = database.ref("ListComptes");
                    
                    // Add the new user to ListComptes with the same UID as in Authentication
                    ref_listcomptes.child(currentUserId).set({
                      id: currentUserId,
                      email: userEmail,
                      pseudo: userEmail ? userEmail.split('@')[0] : 'New User', // Default username from email
                      numero: '' // Empty phone number initially
                      // Removed isOnline field
                    })
                    .then(() => {
                      console.log("User profile created in ListComptes");
                      navigation.replace("Home", {currentUserId});
                    })
                    .catch((dbError) => {
                      console.error("Error creating user profile:", dbError);
                      Alert.alert("Error", "Account created but profile setup failed: " + dbError.message);
                      // Still navigate to Home despite the DB error
                      navigation.replace("Home", {currentUserId});
                    });
                  })
                  .catch((err) => {
                    Alert.alert("Error", err.message);
                  });
              } else {
                Alert.alert("Error", "Passwords do not match");
              }
            }}
            title="Create"
            color="#417cf3"
          />
        </View>
      </View>

      <StatusBar style="light" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    padding: 10,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 5,
    width: 200,
    margin: 10,
  },
});