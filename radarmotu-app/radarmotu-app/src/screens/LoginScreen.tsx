// src/screens/LoginScreen.tsx
// (Esta é a versão LIMPA, sem o seletor de idioma)

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../themes';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // A tradução ainda está aqui

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation(); // O hook t() ainda é usado
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert(t('alerts.errorTitle'), t('alerts.fillAllFields'));
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (error: any) {
      let friendlyMessage = t('alerts.genericError');
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          friendlyMessage = t('alerts.invalidCredentials');
          break;
        case 'auth/too-many-requests':
          friendlyMessage = t('alerts.tooManyRequests');
          break;
        case 'auth/network-request-failed':
          friendlyMessage = t('alerts.networkError');
          break;
      }
      Alert.alert(t('alerts.loginErrorTitle'), friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      {/* O seletor flutuante FOI REMOVIDO daqui */}

      <Text style={styles.title}>{t('login.title')}</Text>
      <TextInput
        placeholder={t('login.emailPlaceholder')}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.placeholder}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder={t('login.passwordPlaceholder')}
          style={styles.passwordInput}
          secureTextEntry={!isPasswordVisible}
          value={senha}
          onChangeText={setSenha}
          placeholderTextColor={theme.placeholder}
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.eyeIcon}
        >
          <Feather
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={22}
            color={theme.inactive}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{t('login.loginButton')}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('CadastroUsuario')}>
        <Text style={styles.link}>{t('login.signupLink')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos (versão limpa, sem os estilos do seletor)
const getStyles = (theme: ThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: theme.text,
    },
    input: {
      backgroundColor: theme.card,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 15,
      paddingVertical: 12,
      marginBottom: 12,
      borderRadius: 8,
      fontSize: 16,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      marginBottom: 12,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
    },
    eyeIcon: {
      padding: 10,
    },
    button: {
      backgroundColor: theme.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: { color: theme.buttonTextPrimary, fontWeight: 'bold' },
    link: {
      marginTop: 15,
      textAlign: 'center',
      color: theme.primary,
      fontWeight: '600',
    },
  });