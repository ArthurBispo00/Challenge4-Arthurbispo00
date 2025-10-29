// screens/SobreNosScreen.tsx

import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../themes';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

// --- MUDANÇA: Importar useTranslation ---
import { useTranslation } from 'react-i18next';

export default function SobreNosScreen() {
  // --- MUDANÇA: Inicializar useTranslation ---
  const { t } = useTranslation();

  const nav = useNavigation<any>();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  useLayoutEffect(() => {
    nav.setOptions?.({
      headerStyle: { backgroundColor: theme.header },
      headerTintColor: theme.text
    });
  }, [nav, theme]);

  const handleLogout = () => {
    // --- MUDANÇA: Usar traduções para o Alert ---
    // Reutilizando as chaves do drawer/alerts
      Alert.alert(
          t('drawer.logoutAlertTitle'),
          t('drawer.logoutAlertMessage'),
          [
              { text: t('drawer.cancel'), style: "cancel" },
              {
                  text: t('drawer.confirmLogout'),
                  style: "destructive",
                  onPress: async () => {
                      try {
                          await signOut(auth);
                          // A navegação agora é controlada pelo App.tsx
                      } catch (error) {
                          console.error("Erro ao fazer logout:", error);
                          Alert.alert(t('alerts.errorTitle'), t('drawer.logoutError'));
                      }
                  }
              }
          ]
      )
  }

  return (
    <View style={styles.container}>
      {/* --- MUDANÇA: Textos traduzidos --- */}
      <Text style={styles.title}>{t('sobre.title')}</Text>
      <Text style={styles.paragraph}>
        {t('sobre.paragraph')}
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => Linking.openURL('https://github.com/AntonioCarvalhoFIAP/challenge-3-ArthurBispo00/tree/main')}>
        <Text style={styles.buttonText}>{t('sobre.buttonGithub')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
        <Text style={styles.themeButtonText}>
          {/* Usando ternário para escolher a chave correta */}
          {isDarkMode ? t('sobre.buttonThemeLight') : t('sobre.buttonThemeDark')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('sobre.buttonLogout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos (sem mudança)
const getStyles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 20
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12
  },
  paragraph: {
    color: theme.text,
    fontSize: 16,
    lineHeight: 24
  },
  button: {
    marginTop: 20,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  buttonText: {
    color: theme.buttonTextPrimary,
    fontWeight: 'bold',
    fontSize: 15
  },
  themeButton: {
    marginTop: 30,
    backgroundColor: theme.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.border,
  },
  themeButtonText: {
    color: theme.text,
    fontWeight: 'bold',
    fontSize: 15
  },
  logoutButton: {
      marginTop: 16,
      backgroundColor: theme.danger,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignSelf: 'flex-start'
  },
  logoutButtonText: {
      color: theme.buttonTextDanger,
      fontWeight: 'bold',
      fontSize: 15
  }
});