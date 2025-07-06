import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { ChatContext } from "../contexts/ChatContext";
import axios from "../lib/axios";
import { useNavigation } from "@react-navigation/native";

const SettingsScreen = () => {
  const { authUser, setAuthUser } = useContext(AuthContext);
  const { logoutAndClear } = useContext(ChatContext); // ✅ New: clean logout function
  const navigation = useNavigation();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Name is required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.put("/api/auth/update-profile", { fullName });
      if (res.data.success) {
        setAuthUser(res.data.user);
        setIsEditing(false);
      } else {
        Alert.alert("Failed", res.data.message);
      }
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logoutAndClear(); // ✅ Clears all chat + auth data
          navigation.reset({
            index: 0,
            routes: [{ name: "LoginScreen" }],
          });
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={
            authUser?.profilePic
              ? { uri: authUser.profilePic }
              : require("../assets/default-avatar.png")
          }
          style={styles.avatar}
        />

        {isEditing ? (
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            style={styles.boxInput}
            placeholder="Change Your Username"
            placeholderTextColor="#888"
          />
        ) : (
          <Text style={styles.name}>{authUser?.fullName || "Name"}</Text>
        )}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>751</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>163</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.button}
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
          >
            <Text style={styles.buttonText}>{isEditing ? "Save" : "Edit Profile"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

// ✅ Styles unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    alignItems: "center",
    paddingVertical: 30,
    marginTop: 50,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
  },
  boxInput: {
    width: "80%",
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    marginTop: 12,
    color: "#000",
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "70%",
    marginTop: 24,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  button: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  buttonText: {
    color: "#000",
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: "#000",
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
