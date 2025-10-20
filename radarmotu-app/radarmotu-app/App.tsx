// App.tsx

import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Firebase
import { onAuthStateChanged, signOut } from "firebase/auth";
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
export type DrawerParamList = {
  Login: undefined;
  CadastroUsuario: undefined;
  Home: undefined;
  OperacoesPorPlaca: undefined;
  CadastrarVeiculo: undefined;
  ListarVeiculos: undefined;
  MapaDoPatio: { plate?: string } | undefined;
  RadarProximidade: { plate?: string; tag?: string } | undefined;
  Sobre: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

// --- Componente Principal de Navegação ---
function AppNavigator() {
  const { theme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const CustomDrawerContent = (props: DrawerContentComponentProps) => {

    const filteredRoutes = props.state.routes.filter((route) => {
      const authRoutes = ["Login", "CadastroUsuario"];
      return isLoggedIn ? !authRoutes.includes(route.name) : authRoutes.includes(route.name);
    });

    const currentRouteName = props.state.routes[props.state.index]?.name;
    let newIndex = filteredRoutes.findIndex(route => route.name === currentRouteName);
    if (newIndex === -1) { newIndex = 0; }

    const newProps = { ...props, state: { ...props.state, routes: filteredRoutes, index: newIndex } };

    
    const currentYear = new Date().getFullYear();

    const handleLogout = () => {
        Alert.alert(
            "Sair da Conta", "Tem certeza que deseja sair?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                  text: "Sair", 
                  style: "destructive", 
                  onPress: async () => {
                      try {
                          await signOut(auth);
                          props.navigation.reset({
                              index: 0,
                              routes: [{ name: 'Login' }],
                          });
                      } catch (error) {
                          Alert.alert("Erro", "Não foi possível sair.");
                      }
                  }
                }
            ]
        )
    }

    return (
      <View style={{ flex: 1, backgroundColor: theme.card }}>
        <DrawerContentScrollView {...newProps} contentContainerStyle={{ paddingTop: 0 }}>
          <View style={[styles.drawerHeader, { backgroundColor: theme.header }]}>
            <Image source={require("./assets/radarmotu-logo.png")} style={styles.drawerLogo} />
          </View>
          <DrawerItemList {...newProps} />
          {isLoggedIn && (
            <DrawerItem
              label="Sair"
              labelStyle={{ color: theme.text, fontWeight: 'bold' }}
              icon={({ color, size }) => (
                <MaterialCommunityIcons name="logout" color={theme.text} size={size} />
              )}
              onPress={handleLogout}
            />
          )}
        </DrawerContentScrollView>
        <View style={[styles.drawerFooter, { backgroundColor: theme.header, borderTopColor: theme.border }]}>
          <Image source={require("./assets/metamind-logo.png")} style={styles.drawerFooterLogo} />
          <Text style={styles.drawerFooterText}>METAMIND SOLUTION</Text>
          <Text style={styles.drawerFooterRightsText}>© {currentYear} Todos os direitos reservados.</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background}}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Drawer.Navigator
      initialRouteName={isLoggedIn ? "Home" : "Login"}
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
      <Drawer.Screen name="Login" component={LoginScreen} options={{ headerShown: false, drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="CadastroUsuario" component={CadastroUsuario} options={{ headerShown: false, drawerItemStyle: { display: "none" } }} />
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: "Início" }} />
      <Drawer.Screen name="OperacoesPorPlaca" component={OperacoesPorPlaca} options={{ title: "Operações por Placa (OCR)" }} />
      <Drawer.Screen name="CadastrarVeiculo" component={Cadastro} options={{ title: "Cadastrar Veículo" }} />
      <Drawer.Screen name="ListarVeiculos" component={Listagem} options={{ title: "Veículos Cadastrados" }} />
      <Drawer.Screen name="MapaDoPatio" component={MapaScreen} options={{ title: "Mapa do Pátio" }} />
      <Drawer.Screen name="RadarProximidade" component={RadarProximidade} options={{ title: "Radar de Proximidade" }} />
      <Drawer.Screen name="Sobre" component={SobreNosScreen} options={{ title: "Sobre Nós" }} />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppNavigator />
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
});