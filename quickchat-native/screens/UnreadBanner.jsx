import React from "react";
import { View, Text, StyleSheet } from "react-native";

const UnreadBanner = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Unread Messages</Text>
    </View>
  );
};

export default UnreadBanner;

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 8,
  },
  text: {
    color: "#000",
    fontWeight: "600",
    fontSize: 13,
  },
});
