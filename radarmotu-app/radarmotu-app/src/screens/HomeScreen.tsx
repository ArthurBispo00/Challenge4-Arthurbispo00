// screens/HomeScreen.tsx 

import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../themes';

// --- Importar o hook de tradução ---
import { useTranslation } from 'react-i18next';

type HomeScreenNavigationProp = DrawerNavigationProp<DrawerParamList, 'Home'>;

export default function HomeScreen() {
  // ---  Inicializar o hook ---
  const { t } = useTranslation();

  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const currentYear = new Date().getFullYear();

  useLayoutEffect(() => {
    navigation.setOptions({ 
      headerStyle: { backgroundColor: theme.header }, 
      headerTintColor: theme.text 
    });
  }, [navigation, theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContent}>
        {/* --- Textos traduzidos --- */}
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        
        <TouchableOpacity style={styles.styledButton} onPress={() => navigation.navigate('OperacoesPorPlaca')}>
          <Text style={styles.buttonText}>{t('home.buttonOcr')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.styledButton} onPress={() => navigation.navigate('ListarVeiculos')}>
          <Text style={styles.buttonText}>{t('home.buttonList')}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.screenFooter}>
        {/* ---  Textos traduzidos --- */}
        <Text style={styles.screenFooterText}>{t('home.footerApp')}</Text>
        <Text style={styles.screenFooterText}>{t('home.footerRights', { year: currentYear })}</Text>
      </View>
    </SafeAreaView>
  );
}

// Estilos 
const getStyles = (theme: ThemeType) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: theme.text, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: theme.inactive, marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
  styledButton: { backgroundColor: theme.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 8, marginVertical: 10, width: '90%', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  buttonText: { color: theme.buttonText, fontSize: 16, fontWeight: 'bold' },
  screenFooter: { paddingVertical: 15, paddingHorizontal: 20, backgroundColor: theme.header, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: theme.border },
  screenFooterText: { fontSize: 12, color: theme.inactive, textAlign: 'center', marginVertical: 2 },
});