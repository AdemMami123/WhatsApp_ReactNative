import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import firebase from "../../Config";

const database = firebase.database();
const ref_listcomptes = database.ref("ListComptes");

export default function ListUsers({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;
  const [data, setData] = useState([]);

  // Update user's online status on mount
  useEffect(() => {
    if (currentUserId) {
      ref_listcomptes.child(currentUserId).update({ isOnline: true });
    }

    // Set up listener for other users
    ref_listcomptes.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach(un_compte => {
        if (un_compte.val().id !== currentUserId) {
          d.push(un_compte.val());
        }
      });
      setData(d);
    });

    // Clean up on unmount
    return () => {
      if (currentUserId) {
        // Don't update online status on unmount, as this might just be navigating to chat
        // Only update status on logout (in Settings screen)
      }
      ref_listcomptes.off("value");
    };
  }, [currentUserId]);

  return (
    <ImageBackground
      source={require("../../assets/walpaper.jpg")}
      style={styles.container}
    >
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={() => navigation.navigate("Chat", { 
                currentUserId, 
                secondUserId: item.id 
              })}>
                <Image source={require("../../assets/favicon.png")} style={styles.avatar} />
              </TouchableOpacity>
              <View style={[styles.statusIndicator, { backgroundColor: item.isOnline ? '#4CAF50' : '#9E9E9E' }]} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.pseudo}>{item.pseudo || 'User'}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (item.numero) {
                    const telUrl = Platform.OS === "android"
                      ? `tel:${item.numero}`
                      : `telprompt:${item.numero}`;
                    Linking.openURL(telUrl);
                  }
                }}
              >
                <Text style={styles.numero}>{item.numero || 'No phone number'}</Text>
              </TouchableOpacity>
              <Text style={styles.statusText}>
                {item.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate("Chat", { 
                currentUserId,
                secondUserId: item.id 
              })}
            >
              <MaterialIcons name="chevron-right" size={30} color="#6974d6" />
            </TouchableOpacity>
          </View>
        )}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    paddingTop: 50,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  textContainer: {
    flex: 1,
  },
  pseudo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  numero: {
    fontSize: 16,
    color: "#007bff",
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#616161',
    marginTop: 2,
  },
  messageButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});