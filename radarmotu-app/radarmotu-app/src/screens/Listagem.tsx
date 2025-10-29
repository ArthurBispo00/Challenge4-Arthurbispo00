// screens/Listagem.tsx 

import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../themes';


import { useTranslation } from 'react-i18next';

interface Veiculo {
  placa: string; marca: string; modelo: string; cor: string;
  anoFabricacao: string; anoModelo: string; chassi: string;
}

type ListagemScreenNavigationProp = DrawerNavigationProp<DrawerParamList, 'ListarVeiculos'>;

export default function Listagem() {
  
  const { t } = useTranslation();

  const navigation = useNavigation<ListagemScreenNavigationProp>();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ 
      headerStyle: { backgroundColor: theme.header }, 
      headerTintColor: theme.text 
    });
  }, [navigation, theme]);

  useFocusEffect(React.useCallback(() => { carregarVeiculos(); }, []));

  async function carregarVeiculos() {
    setIsLoading(true);
    try {
      const listaVeiculosJson = await AsyncStorage.getItem('@lista_veiculos');
      const listaVeiculos = listaVeiculosJson ? JSON.parse(listaVeiculosJson) : [];
      setVeiculos(listaVeiculos);
    } catch (error) {
      console.error('Erro ao carregar os veículos:', error);
     
      Alert.alert(t('alerts.errorTitle'), t('listagem.loadError'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(placa: string) {
    Alert.alert(
      
      t('listagem.deleteTitle'), 
      t('listagem.deleteMessage', { placa: placa }), // Passando a placa para a tradução
      [
        { text: t('drawer.cancel'), style: "cancel" }, // Reutilizando a tradução do drawer
        { 
          text: t('listagem.deleteButton'), 
          style: "destructive", 
          onPress: async () => {
            try {
              // await deleteVehicle(placa); 
              Alert.alert(t('alerts.successTitle'), t('listagem.deleteSuccess'));
              carregarVeiculos();
            } catch (error) {
              Alert.alert(t('alerts.errorTitle'), t('listagem.deleteError'));
            }
          }
        }
      ]
    );
  }

  const renderItem = ({ item }: { item: Veiculo }) => (
    <View style={styles.itemContainer}>
      {/* --- MUDANÇA: Usar traduções para labels --- */}
      <Text style={styles.itemTitle}>{item.placa} - {item.modelo}</Text>
      <Text style={styles.itemText}>{t('listagem.labelBrand')}: {item.marca}</Text>
      <Text style={styles.itemText}>{t('listagem.labelColor')}: {item.cor}</Text>
      <Text style={styles.itemText}>{t('listagem.labelYear')}: {item.anoFabricacao}/{item.anoModelo}</Text>
      <Text style={styles.itemText}>{t('listagem.labelVin')}: {item.chassi}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => navigation.navigate('CadastrarVeiculo', { veiculo: item } as any)}
        >
          <Text style={styles.editButtonText}>{t('listagem.buttonEdit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item.placa)}
        >
          <Text style={styles.deleteButtonText}>{t('listagem.deleteButton')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
        {/* --- Usar tradução para texto de loading --- */}
        <Text style={styles.loadingText}>{t('listagem.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- Usar tradução para título --- */}
      <Text style={styles.heading}>{t('listagem.title')}</Text>
      <FlatList
        data={veiculos}
        keyExtractor={(item, index) => item.placa + index}
        renderItem={renderItem}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={
          <View style={styles.emptyListComponent}>
            {/* --- Usar traduções para lista vazia --- */}
            <Text style={styles.emptyListText}>{t('listagem.emptyList')}</Text>
            <Text style={styles.emptyListSubText}>{t('listagem.emptyListSub')}</Text>
          </View>
        }
      />
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('CadastrarVeiculo')}>
        {/* --- Usar tradução para botão --- */}
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('listagem.buttonNew')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos
const getStyles = (theme: ThemeType) => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15, paddingTop: 20, paddingBottom: 10, backgroundColor: theme.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: theme.text },
  heading: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 20, textAlign: 'center' },
  listContentContainer: { paddingBottom: 10 },
  itemContainer: { backgroundColor: theme.card, padding: 18, borderRadius: 10, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  itemTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  itemText: { fontSize: 15, color: theme.text, lineHeight: 22, marginBottom: 3 },
  emptyListComponent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyListText: { fontSize: 18, color: theme.text, marginBottom: 10 },
  emptyListSubText: { fontSize: 14, color: theme.inactive },
  button: { backgroundColor: theme.primary, paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 15, marginBottom: 10 },
  buttonText: { color: theme.buttonTextPrimary, fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 2 },
  secondaryButtonText: { color: theme.primary },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 15 },
  editButton: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, marginRight: 10 },
  editButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  deleteButton: { backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6 },
  deleteButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
});