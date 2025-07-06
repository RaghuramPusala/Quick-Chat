// quickchat-native/lib/logoutHelper.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const logoutAndClearHelper = async ({ logout, authUser }) => {
  if (authUser?._id) {
    await AsyncStorage.removeItem(`lastMessages:${authUser._id}`);
  }
  await AsyncStorage.removeItem("token");
  await logout();
};
