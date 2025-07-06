import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { ChatContext } from "../contexts/ChatContext";

const ChatsScreen = () => {
  const navigation = useNavigation();
  const {
    users,
    getUsers,
    setSelectedUser,
    unseenMessages,
    lastMessages,
  } = useContext(ChatContext);

  const [search, setSearch] = useState("");

  useEffect(() => {
    getUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSelectedUser(null);
      getUsers();
    }, [])
  );

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const lastMsg = lastMessages[item._id];
    const unreadCount = unseenMessages[item._id] || 0;

    const timeDisplay = lastMsg?.createdAt
      ? moment(lastMsg.createdAt).calendar(null, {
          sameDay: "LT",
          lastDay: "[Yesterday]",
          lastWeek: "ddd",
          sameElse: "L",
        })
      : "";

    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => {
          setSelectedUser(item);
          navigation.navigate("ChatScreen");
        }}
      >
        <Image
          source={
            item.profilePic
              ? { uri: item.profilePic }
              : require("../assets/default-avatar.png")
          }
          style={styles.avatar}
        />

        <View style={styles.chatInfo}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, unreadCount > 0 && styles.unread]}>
              {item.fullName}
            </Text>
            {lastMsg?.createdAt && (
              <Text style={styles.time}>{timeDisplay}</Text>
            )}
          </View>

          <View style={styles.rowBottom}>
            <Text
              style={styles.lastMessage}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {lastMsg?.text || "No messages yet"}
            </Text>

            {unreadCount > 0 && (
              <View style={styles.unreadContainer}>
                <Text style={styles.unreadLabel}>Unread message</Text>
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Chats</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Settings")}
          style={{ marginLeft: "auto" }}
        >
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Search"
        style={styles.search}
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 15,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
  },
  search: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
    color: "#000",
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 0.4,
    borderColor: "#eee",
    paddingBottom: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
    maxWidth: "75%",
  },
  unread: {
    color: "#000",
    fontWeight: "bold",
  },
  time: {
    fontSize: 12,
    color: "gray",
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    color: "gray",
    fontSize: 14,
    flex: 1,
    marginRight: 6,
  },
  unreadContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unreadLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#25D366",
  },
  unreadBadge: {
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 24,
  },
  unreadText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
});
