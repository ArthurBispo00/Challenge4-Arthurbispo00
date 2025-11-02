// App.tsx
import './src/i18n'; // Import síncrono (CORRETO)
import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Platform } from "react-native"; // Adicionado Platform
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
import { useTranslation } from 'react-i18next';


import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';


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
  const { t } = useTranslation(); // 't' para os títulos das telas

  // Componente interno para o conteúdo do Drawer
  const CustomDrawerContent = (props: DrawerContentComponentProps) => {
    const { t: tDrawer, i18n } = useTranslation(); // 'tDrawer' específico para o conteúdo
    const currentYear = new Date().getFullYear();
    const changeLangToPt = () => i18n.changeLanguage('pt');
    const changeLangToEs = () => i18n.changeLanguage('es');

    const handleLogout = () => {
        Alert.alert(
            tDrawer('drawer.logoutAlertTitle'), tDrawer('drawer.logoutAlertMessage'),
            [
                { text: tDrawer('drawer.cancel'), style: "cancel" },
                {
                    text: tDrawer('drawer.confirmLogout'),
                    style: "destructive",
                    onPress: async () => {
                        try { await signOut(auth); }
                        catch (error) { Alert.alert(tDrawer('alerts.errorTitle'), tDrawer('drawer.logoutError')); }
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
          <View style={[styles.languageSwitcher, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={changeLangToPt}>
              <Text style={[styles.langButton, { color: theme.inactive }, i18n.language === 'pt' && { color: theme.primary }]}>PT</Text>
            </TouchableOpacity>
            <Text style={[styles.langSeparator, { color: theme.border }]}>|</Text>
            <TouchableOpacity onPress={changeLangToEs}>
              <Text style={[styles.langButton, { color: theme.inactive }, i18n.language === 'es' && { color: theme.primary }]}>ES</Text>
            </TouchableOpacity>
          </View>
          <DrawerItemList {...props} />
          <DrawerItem
            label={tDrawer('drawer.logoutButton')}
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
  }; // Fim do CustomDrawerContent

  // Definição do Drawer Navigator
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
      
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: t('drawerTitles.home') }} />
      <Drawer.Screen name="OperacoesPorPlaca" component={OperacoesPorPlaca} options={{ title: t('drawerTitles.operacoes') }} />
      <Drawer.Screen name="CadastrarVeiculo" component={Cadastro} options={{ title: t('drawerTitles.cadastrar') }} />
      <Drawer.Screen name="ListarVeiculos" component={Listagem} options={{ title: t('drawerTitles.listar') }} />
      <Drawer.Screen name="MapaDoPatio" component={MapaScreen} options={{ title: t('drawerTitles.mapa') }} />
      <Drawer.Screen name="RadarProximidade" component={RadarProximidade} options={{ title: t('drawerTitles.radar') }} />
      <Drawer.Screen name="Sobre" component={SobreNosScreen} options={{ title: t('drawerTitles.sobre') }} />
    </Drawer.Navigator>
  );
} // Fim do MainNavigator

// Componente de Loading
const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
      <ActivityIndicator size="large" color="#000" />
    </View>
);

// Função para registrar para notificações
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.error('Falha ao obter permissão para notificações push!');
      return;
    }
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
         console.error("projectId não encontrado no app.json (extra.eas.projectId)");
         Alert.alert("Erro de Configuração", "projectId não encontrado para obter o token de notificação.");
         return;
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
       console.error("Erro ao obter o Expo Push Token:", e);
       Alert.alert("Erro Token", "Não foi possível obter o token para notificações.");
    }
  } else {
    console.warn('Deve usar um dispositivo físico para testar Notificações Push');
  }
  return token;
}



// --- Componente App Principal ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined); // Estado para o token

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => { // async aqui
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) {
        console.log("Usuário logado, tentando obter token...");
        const token = await registerForPushNotificationsAsync(); // Chama a função
        if (token) {
           console.log("Token obtido com sucesso:", token);
           setExpoPushToken(token); // Guarda o token
        } else {
           console.log("Não foi possível obter o token.");
        }
      } else {
         console.log("Usuário deslogado, token não será obtido.");
         setExpoPushToken(undefined); // Limpa o token
      }
    });
    return () => { unsubscribeAuth(); };
  }, []); 

  if (loadingAuth) { return <LoadingScreen />; }

  return (
    <ThemeProvider>
      <NavigationContainer>
        {user ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </ThemeProvider>
  );
} // Fim do App

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
  langButtonActive: { /* Cor definida inline */ },
  langSeparator: { fontSize: 16 }
});