// screens/SobreNosScreen.tsx (AJUSTADO)

import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../themes';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

export default function SobreNosScreen() {
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
      Alert.alert(
          "Sair da Conta",
          "Tem certeza que deseja sair?",
          [
              { text: "Cancelar", style: "cancel" },
              { 
                text: "Sair", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        await signOut(auth);
                        nav.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    } catch (error) {
                        console.error("Erro ao fazer logout:", error);
                        Alert.alert("Erro", "Não foi possível sair.");
                    }
                }
              }
          ]
      )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Radar Motu</Text>
      <Text style={styles.paragraph}>
        Este aplicativo foi desenvolvido como parte da disciplina de Mobile Application Development.
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={() => Linking.openURL('https://github.com/AntonioCarvalhoFIAP/challenge-3-ArthurBispo00/tree/main')}>
        <Text style={styles.buttonText}>Ver no GitHub</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
        <Text style={styles.themeButtonText}>
          Mudar para Tema {isDarkMode ? 'Claro' : 'Escuro'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sair (Logout)</Text>
      </TouchableOpacity>
    </View>
  );
}

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