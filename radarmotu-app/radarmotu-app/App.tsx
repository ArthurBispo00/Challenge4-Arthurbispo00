// App.tsx
import './src/i18n'; // Import síncrono (CORRETO)
import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // Importado aqui

// Firebase
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "./src/config/firebase";

// --- Telas ---
import LoginScreen from "./src/screens/LoginScreen";
import CadastroUsuario from "./src/screens/CadastroUsuario";
import HomeScreen from "./src/screens/HomeScreen";
import Cadastro from "./src/screens/Cadastro";
import Listagem from "./src/screens/Listagem";
import MapaScreen from "./src/screens/MapaScreen";
import SobreNosScreen from "./src/screens/SobreNosScreen";
import OperacoesPorPlaca from "./src/screens/OperacoesPorPlaca";
import RadarProximidade from "./src/screens/RadarProximidade";

// --- Tipagem ---
export type AuthStackParamList = {
  Login: undefined;
  CadastroUsuario: undefined;
};

export type MainDrawerParamList = {
  Home: undefined;
  OperacoesPorPlaca: undefined;
  CadastrarVeiculo: undefined;
  ListarVeiculos: undefined;
  MapaDoPatio: { plate?: string } | undefined;
  RadarProximidade: { plate?: string; tag?: string } | undefined;
  Sobre: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();

// --- Navegador de Autenticação ---
function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CadastroUsuario" component={CadastroUsuario} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// --- Navegador Principal (Drawer) ---
function MainNavigator() {
  const { theme } = useTheme();
  // --- CORREÇÃO: Chamamos o hook 't' aqui ---
  const { t } = useTranslation();

  const CustomDrawerContent = (props: DrawerContentComponentProps) => {
    // O 't' e 'i18n' para o conteúdo interno do Drawer continuam aqui
    const { t, i18n } = useTranslation();
    const currentYear = new Date().getFullYear();
    const changeLangToPt = () => i18n.changeLanguage('pt');
    const changeLangToEs = () => i18n.changeLanguage('es');

    const handleLogout = () => {
        Alert.alert(
            t('drawer.logoutAlertTitle'), t('drawer.logoutAlertMessage'),
            [
                { text: t('drawer.cancel'), style: "cancel" },
                {
                    text: t('drawer.confirmLogout'),
                    style: "destructive",
                    onPress: async () => {
                        try { await signOut(auth); }
                        catch (error) { Alert.alert(t('alerts.errorTitle'), t('drawer.logoutError')); }
                    }
                }
            ]
        )
    }

    return (
      <View style={{ flex: 1, backgroundColor: theme.card }}>
        <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
          <View style={[styles.drawerHeader, { backgroundColor: theme.header }]}>
            <Image source={require("./assets/radarmotu-logo.png")} style={styles.drawerLogo} />
          </View>

          {/* Seletor de Idioma (correto) */}
          <View style={[styles.languageSwitcher, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={changeLangToPt}>
              <Text style={[styles.langButton, { color: theme.inactive }, i18n.language === 'pt' && [styles.langButtonActive, { color: theme.primary }]]}>PT</Text>
            </TouchableOpacity>
            <Text style={[styles.langSeparator, { color: theme.border }]}>|</Text>
            <TouchableOpacity onPress={changeLangToEs}>
              <Text style={[styles.langButton, { color: theme.inactive }, i18n.language === 'es' && [styles.langButtonActive, { color: theme.primary }]]}>ES</Text>
            </TouchableOpacity>
          </View>

          <DrawerItemList {...props} />
          <DrawerItem
            label={t('drawer.logoutButton')}
            labelStyle={{ color: theme.text, fontWeight: 'bold' }}
            icon={({ color, size }) => ( <MaterialCommunityIcons name="logout" color={theme.text} size={size} /> )}
            onPress={handleLogout}
          />
        </DrawerContentScrollView>
        <View style={[styles.drawerFooter, { backgroundColor: theme.header, borderTopColor: theme.border }]}>
          <Image source={require("./assets/metamind-logo.png")} style={styles.drawerFooterLogo} />
          <Text style={styles.drawerFooterText}>METAMIND SOLUTION</Text>
          <Text style={styles.drawerFooterRightsText}>© {currentYear} Todos os direitos reservados.</Text>
        </View>
      </View>
    );
  };

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.header },
        headerTintColor: theme.text,
        drawerStyle: { backgroundColor: theme.card },
        drawerActiveTintColor: theme.primary,
        drawerInactiveTintColor: theme.text,
        drawerActiveBackgroundColor: "rgba(34,221,68,0.1)",
        drawerLabelStyle: { fontWeight: 'bold' }
      }}
    >
      {/* --- CORREÇÃO: Títulos agora usam o 't' --- */}
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: t('drawerTitles.home') }} />
      <Drawer.Screen name="OperacoesPorPlaca" component={OperacoesPorPlaca} options={{ title: t('drawerTitles.operacoes') }} />
      <Drawer.Screen name="CadastrarVeiculo" component={Cadastro} options={{ title: t('drawerTitles.cadastrar') }} />
      <Drawer.Screen name="ListarVeiculos" component={Listagem} options={{ title: t('drawerTitles.listar') }} />
      <Drawer.Screen name="MapaDoPatio" component={MapaScreen} options={{ title: t('drawerTitles.mapa') }} />
      <Drawer.Screen name="RadarProximidade" component={RadarProximidade} options={{ title: t('drawerTitles.radar') }} />
      <Drawer.Screen name="Sobre" component={SobreNosScreen} options={{ title: t('drawerTitles.sobre') }} />
    </Drawer.Navigator>
  );
}

// Componente de Loading (AGORA SÓ PARA O FIREBASE)
const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
      <ActivityIndicator size="large" color="#000" />
    </View>
);

// --- Componente App Principal ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  if (loadingAuth) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        {user ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </ThemeProvider>
  );
}

// Estilos
const styles = StyleSheet.create({
  drawerHeader: { paddingVertical: 25, paddingHorizontal: 20, alignItems: "center" },
  drawerLogo: { width: 120, height: 60, resizeMode: "contain" },
  drawerFooter: { paddingVertical: 15, paddingHorizontal: 20, alignItems: "center", borderTopWidth: 1 },
  drawerFooterLogo: { width: 100, height: 30, resizeMode: "contain", marginBottom: 8 },
  drawerFooterText: { color: "#B0B0B0", fontSize: 13, fontWeight: "bold", textAlign: "center" },
  drawerFooterRightsText: { color: "#777", fontSize: 10, textAlign: "center", marginTop: 4 },
  languageSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  langButton: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 15,
  },
  langButtonActive: {
    // A cor é definida inline usando o 'theme.primary'
  },
  langSeparator: {
    fontSize: 16,
  }
});