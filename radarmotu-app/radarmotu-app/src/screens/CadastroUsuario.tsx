// src/screens/CadastroUsuario.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useTheme } from "../contexts/ThemeContext";
import { ThemeType } from "../themes";

// ---  Importar o hook de tradução ---
import { useTranslation } from "react-i18next";

export default function CadastroUsuario({ navigation }: any) {
  // ---  Inicializar o hook ---
  const { t } = useTranslation();

  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    // --- Usar traduções para alertas ---
    if (!email || !senha || !confirmarSenha) {
      Alert.alert(t('alerts.errorTitle'), t('alerts.fillAllFields'));
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert(t('alerts.errorTitle'), t('cadastroUsuario.passwordsNoMatch'));
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      Alert.alert(t('alerts.successTitle'), t('cadastroUsuario.accountCreated'));
      navigation.navigate("Login");
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(t('cadastroUsuario.errorTitle'), t('cadastroUsuario.emailInUse'));
      } else if (error.code === 'auth/weak-password') {
        Alert.alert(t('cadastroUsuario.errorTitle'), t('cadastroUsuario.weakPassword'));
      } else {
        Alert.alert(t('cadastroUsuario.errorTitle'), t('cadastroUsuario.checkDataError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* --- Textos e Placeholders traduzidos --- */}
      <Text style={styles.title}>{t('cadastroUsuario.title')}</Text>
      <TextInput
        placeholder={t('login.emailPlaceholder')} // Reutilizando a tradução do login
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.placeholder}
      />
      <TextInput
        placeholder={t('login.passwordPlaceholder')} // Reutilizando a tradução do login
        style={styles.input}
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        placeholderTextColor={theme.placeholder}
      />
      <TextInput
        placeholder={t('cadastroUsuario.placeholderConfirmPassword')}
        style={styles.input}
        secureTextEntry
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        placeholderTextColor={theme.placeholder}
      />
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleCadastro}>
          <Text style={styles.buttonText}>{t('cadastroUsuario.buttonRegister')}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>{t('cadastroUsuario.linkLogin')}</Text>
      </TouchableOpacity>
    </View> 
  );
}

// Estilos 
const getStyles = (theme: ThemeType) => StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: theme.background },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: theme.text },
  input: {
    backgroundColor: theme.card,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: theme.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: theme.buttonTextPrimary, fontWeight: "bold" },
  link: { marginTop: 15, textAlign: "center", color: theme.primary, fontWeight: '600' },
});