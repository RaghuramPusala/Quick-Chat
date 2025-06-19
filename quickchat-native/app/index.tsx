import { WebView } from 'react-native-webview';
import { SafeAreaView, Platform, StatusBar } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <WebView
        source={{ uri: 'https://quickchat-eight.vercel.app' }}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}
