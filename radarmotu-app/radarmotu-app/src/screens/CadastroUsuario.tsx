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

export default function CadastroUsuario({ navigation }: any) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    if (!email || !senha || !confirmarSenha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      Alert.alert("Sucesso", "Conta criada com sucesso!");
      navigation.navigate("Login");
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Erro no Cadastro", "Este e-mail já foi cadastrado por outro usuário.");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Erro no Cadastro", "A senha é muito fraca. Tente uma com pelo menos 6 caracteres.");
      } else {
        Alert.alert("Erro no Cadastro", "Ocorreu um erro. Verifique os dados e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Usuário</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.placeholder}
      />
      <TextInput
        placeholder="Senha"
        style={styles.input}
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        placeholderTextColor={theme.placeholder}
      />
      <TextInput
        placeholder="Confirmar Senha"
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
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Já tem conta? Faça login</Text>
      </TouchableOpacity>
    </View> 
  );
}

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