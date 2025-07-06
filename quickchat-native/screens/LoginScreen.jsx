import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import isoLanguages from '../lib/languages';

const LoginScreen = () => {
  const [currState, setCurrState] = useState('Sign up');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('Hi there');
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [language, setLanguage] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, signup } = useContext(AuthContext);

  const handleSubmit = async () => {
    if (currState === 'Sign up' && !isDataSubmitted) {
      if (!username.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
      setIsDataSubmitted(true);
      return;
    }

    if (currState === 'Sign up' && isDataSubmitted && !language) {
      Alert.alert('Error', 'Please select your language');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));

      if (currState === 'Sign up') {
        const res = await signup({
          fullName: username,
          email,
          password,
          bio,
          language,
        });
        if (!res.success) {
          Alert.alert('Signup failed', res.message || 'Try again');
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          Alert.alert('Login failed', res.message || 'Try again');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <View style={styles.logoBox}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {currState === 'Sign up' && !isDataSubmitted && (
            <TextInput
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
            />
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          {currState === 'Sign up' && isDataSubmitted && (
            <>
              <TextInput
                placeholder="Write a short bio"
                placeholderTextColor="#999"
                value={bio}
                onChangeText={setBio}
                multiline
                style={[styles.input, { height: 80 }]}
              />

              <TouchableOpacity
                onPress={() => setShowLangPicker(!showLangPicker)}
                style={styles.languageBox}
              >
                <Text style={styles.languageBoxText}>
                  {language
                    ? `Selected: ${isoLanguages.find((l) => l.code === language)?.name}`
                    : 'Select your language'}
                </Text>
              </TouchableOpacity>

              {showLangPicker && (
                <ScrollView
                  style={styles.languageList}
                  nestedScrollEnabled
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {isoLanguages.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => {
                        setLanguage(lang.code);
                        setShowLangPicker(false);
                      }}
                      style={[
                        styles.languageLineItem,
                        language === lang.code && styles.languageLineItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.languageLineText,
                          language === lang.code && styles.languageLineTextSelected,
                        ]}
                      >
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.warning}>
                {"⚠️ "}You cannot change your language later
              </Text>
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {currState === 'Sign up'
                  ? isDataSubmitted
                    ? 'Finish Signup'
                    : 'Create Account'
                  : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setCurrState(currState === 'Sign up' ? 'Login' : 'Sign up');
              setIsDataSubmitted(false);
              setShowLangPicker(false);
              setLanguage('');
            }}
          >
            <Text style={styles.toggleText}>
              {currState === 'Sign up'
                ? 'Already have an account? Login'
                : 'Don’t have an account? Sign up'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#fff',
    color: '#000',
  },
  languageBox: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 12,
  },
  languageBoxText: {
    color: '#000',
    fontWeight: '500',
  },
  languageList: {
    width: '100%',
    maxHeight: 200,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  languageLineItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  languageLineItemSelected: {
    backgroundColor: '#7e3ff2',
  },
  languageLineText: {
    fontSize: 15,
    color: '#000',
  },
  languageLineTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  warning: {
    fontSize: 12,
    color: 'orange',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  button: {
    backgroundColor: '#7e3ff2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toggleText: {
    marginTop: 14,
    color: '#666',
    fontSize: 13,
  },
});

export default LoginScreen;
