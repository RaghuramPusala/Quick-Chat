import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ChatContext } from "../contexts/ChatContext";
import { AuthContext } from "../contexts/AuthContext";
import UnreadBanner from "./UnreadBanner";

const ChatScreen = () => {
  const { authUser, socket } = useContext(AuthContext);
  const {
    selectedUser, messages, sendMessage, getMessages,
    onlineUsers, firstUnreadMessageIds
  } = useContext(ChatContext);

  const navigation = useNavigation();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const [unreadIndex, setUnreadIndex] = useState(null);
  const isOnline = onlineUsers.includes(selectedUser?._id);

  useEffect(() => {
    const fetchMsgs = async () => {
      setLoading(true);
      await getMessages(selectedUser._id);
      setTimeout(() => setLoading(false), 100);
    };
    if (selectedUser) fetchMsgs();
  }, [selectedUser]);

  useEffect(() => {
    if (!messages?.length || !selectedUser) return;

    const unreadId = firstUnreadMessageIds?.[selectedUser._id];
    if (!unreadId) return;

    const index = messages.findIndex((msg) => msg._id === unreadId);
    if (index !== -1) {
      setUnreadIndex(messages.length - 1 - index);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: messages.length - 1 - index, animated: true });
      }, 300);
    }
  }, [messages]);

  // ✅ Emit "typing" when input changes
  useEffect(() => {
    if (!selectedUser || !socket) return;
    const timeout = setTimeout(() => {
      socket.emit("typing", { to: selectedUser._id });
    }, 150);
    return () => clearTimeout(timeout);
  }, [text]);

  // ✅ Listen for "typing" from other user
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTyping = ({ from }) => {
      if (from === selectedUser._id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on("typing", handleTyping);
    return () => socket.off("typing", handleTyping);
  }, [socket, selectedUser]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage({ text });
    setText("");
  };

  const renderItem = ({ item, index }) => {
    const isOwn = item.senderId === authUser._id;
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const showUnreadBanner = index === unreadIndex;

    return (
      <>
        {showUnreadBanner && <UnreadBanner />}
        <View style={{ flexDirection: isOwn ? "row-reverse" : "row", alignItems: "flex-end", marginBottom: 12 }}>
          {!isOwn && (
            <Image
              source={selectedUser?.profilePic ? { uri: selectedUser.profilePic } : require("../assets/default-avatar.png")}
              style={styles.chatAvatar}
            />
          )}
          <View style={[styles.messageBubble, isOwn ? styles.myBubble : styles.otherBubble]}>
            {item.text && <Text style={isOwn ? styles.myText : styles.otherText}>{item.text}</Text>}
            {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
            <Text style={styles.timeText}>{time}</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Image
          source={selectedUser?.profilePic ? { uri: selectedUser.profilePic } : require("../assets/default-avatar.png")}
          style={styles.avatar}
        />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{selectedUser?.fullName || "User"}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? "green" : "gray" }]} />
            <Text style={styles.statusText}>{isOnline ? "Online" : "Offline"}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="small" color="#000" style={styles.spinner} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            inverted
            keyExtractor={(item, index) => `${item._id || index}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesContainer}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            onScrollToIndexFailed={() => {}}
            ListFooterComponent={
              !selectedUser || selectedUser._id === authUser._id || !isTyping ? null : (
                <View style={styles.typingContainer}>
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingDots}>
                      <Text style={styles.dot}>.</Text>
                      <Text style={[styles.dot, { marginLeft: 2 }]}>.</Text>
                      <Text style={[styles.dot, { marginLeft: 2 }]}>.</Text>
                    </Text>
                  </View>
                </View>
              )
            }
          />
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity>
            <Ionicons name="add" size={24} color="gray" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity onPress={handleSend}>
            <View style={styles.sendBtn}>
              <Ionicons name="send" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", paddingTop: 3, paddingBottom: 10,
    paddingHorizontal: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#e0e0e0"
  },
  backButton: { marginRight: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  nameContainer: { marginLeft: 10 },
  name: { fontSize: 16, fontWeight: "600", color: "#000" },
  statusContainer: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: "#555" },
  messagesContainer: { padding: 10, paddingBottom: 90 },
  messageBubble: { padding: 10, borderRadius: 12, marginBottom: 4, maxWidth: "80%" },
  myBubble: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  otherBubble: { alignSelf: "flex-start", backgroundColor: "#f0f0f0" },
  myText: { color: "#000", fontSize: 16 },
  otherText: { color: "#000", fontSize: 16 },
  timeText: { fontSize: 9.5, color: "#999", marginTop: 4, alignSelf: "flex-end" },
  messageImage: { width: 200, height: 150, borderRadius: 5, marginTop: 4 },
  inputBar: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#e0e0e0"
  },
  input: {
    flex: 1, backgroundColor: "#f1f1f1", borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, marginHorizontal: 10,
    fontSize: 16, color: "#000"
  },
  sendBtn: { backgroundColor: "#007AFF", padding: 10, borderRadius: 20 },
  chatAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  spinnerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  spinner: { transform: [{ scale: 1.5 }] },

  // ✅ Typing Indicator
  typingContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  typingBubble: {
    backgroundColor: "#f0f0f0", paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, alignSelf: "flex-start"
  },
  typingDots: { fontSize: 20, color: "#666", letterSpacing: 2 },
  dot: { fontSize: 20, color: "#888" },
});
