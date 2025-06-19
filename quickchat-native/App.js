import { WebView } from 'react-native-webview';
import { SafeAreaView, Platform } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: 'https://quickchat-eight.vercel.app' }}
        style={{ marginTop: Platform.OS === 'android' ? 25 : 0 }}
      />
    </SafeAreaView>
  );
}
