// screens/Cadastro.tsx

import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/types';
import PlacaRecognition from './PlacaRecognition';
import { createVehicle, updateVehicle, getVehicleByPlate, storeByPlate } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../themes';

// --- MUDANÇA: Importar o hook de tradução ---
import { useTranslation } from 'react-i18next';

type CadastroScreenNavigationProp = DrawerNavigationProp<DrawerParamList, 'CadastrarVeiculo'>;

export default function CadastroVeiculo() {
  // --- MUDANÇA: Inicializar o hook ---
  const { t } = useTranslation();
  
  const navigation = useNavigation<CadastroScreenNavigationProp>();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [anoFabricacao, setAnoFabricacao] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [chassi, setChassi] = useState('');
  const [tagCode, setTagCode] = useState('TAG01');
  
  const [saving, setSaving] = useState(false);
  const [storing, setStoring] = useState(false);
  
  useLayoutEffect(() => {
    navigation.setOptions({ 
      headerStyle: { backgroundColor: theme.header }, 
      headerTintColor: theme.text 
    });
  }, [navigation, theme]);
  
  const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i;
  
  function validarCampos(): string | null {
    // --- MUDANÇA: Usar traduções para erros ---
    if (!placa || !marca || !modelo || !cor || !anoFabricacao || !anoModelo || !chassi) return t('alerts.fillAllFields');
    if (!placaRegex.test(placa)) return t('cadastro.invalidPlate');
    if (!/^\d{4}$/.test(anoFabricacao) || !/^\d{4}$/.test(anoModelo)) return t('cadastro.invalidYear');
    return null;
  }
  
  async function salvarLocal(novoVeiculo: any) {
    const veiculosSalvos = await AsyncStorage.getItem('@lista_veiculos');
    const lista = veiculosSalvos ? JSON.parse(veiculosSalvos) : [];
    const idx = lista.findIndex((v: any) => (v?.placa||'').toUpperCase() === novoVeiculo.placa.toUpperCase());
    if (idx >= 0) lista[idx] = novoVeiculo; else lista.push(novoVeiculo);
    await AsyncStorage.setItem('@lista_veiculos', JSON.stringify(lista));
  }
  
  async function syncCreateOrUpdate(novoVeiculo: any) {
    let serverOk = false, action = "create";
    try {
      const exists = await getVehicleByPlate(placa.toUpperCase()).catch(()=>null);
      if (exists?.plate) {
        action = "update";
        await updateVehicle(placa.toUpperCase(), {
          brand: marca, model: modelo, color: cor, year_make: anoFabricacao,
          year_model: anoModelo, vin: chassi, tag_code: tagCode || undefined
        });
      } else {
        await createVehicle(novoVeiculo as any);
      }
      const check = await getVehicleByPlate(placa.toUpperCase()).catch(()=>null);
      serverOk = !!check?.plate;
    } catch {}
    return { serverOk, action };
  }
  
  async function salvarVeiculo() {
    const erro = validarCampos(); if (erro) return Alert.alert(t('alerts.errorTitle'), erro);
    const novoVeiculo = { placa, marca, modelo, cor, anoFabricacao, anoModelo, chassi, tag_code: tagCode || undefined };
  
    try {
      setSaving(true);
      await salvarLocal(novoVeiculo);
      const { serverOk, action } = await syncCreateOrUpdate(novoVeiculo);
      
      // --- MUDANÇA: Usar traduções para sucesso ---
      const status = serverOk ? t('cadastro.serverOK') : t('cadastro.serverFail');
      const message = action === "update" ? t('cadastro.vehicleUpdated') : t('cadastro.vehicleCreated');
      Alert.alert(t('alerts.successTitle'), `${message}\n${status}`);

      if (serverOk) { setPlaca(''); setMarca(''); setModelo(''); setCor(''); setAnoFabricacao(''); setAnoModelo(''); setChassi(''); }
    } catch {
      Alert.alert(t('alerts.errorTitle'), t('cadastro.saveError'));
    } finally { setSaving(false); }
  }
  
  async function salvarEArmazenar() {
    const erro = validarCampos(); if (erro) return Alert.alert(t('alerts.errorTitle'), erro);
    const novoVeiculo = { placa, marca, modelo, cor, anoFabricacao, anoModelo, chassi, tag_code: tagCode || undefined };
  
    try {
      setStoring(true);
      await salvarLocal(novoVeiculo);
      const { serverOk, action } = await syncCreateOrUpdate(novoVeiculo);
      const resp = await storeByPlate(placa.toUpperCase());
      const zona = resp?.zone || '-';
      const vaga = resp?.spot || '-';
  
      // --- MUDANÇA: Usar traduções para sucesso de armazenamento ---
      const status = serverOk ? t('cadastro.serverOK') : t('cadastro.serverFail');
      Alert.alert(
        t('cadastro.spotAllocated'),
        `${t('cadastro.spotInfo', { zone: zona, spot: vaga })}\n${status}\n\n${t('cadastro.spotMapInfo')}`
      );
  
      setPlaca(''); setMarca(''); setModelo(''); setCor(''); setAnoFabricacao(''); setAnoModelo(''); setChassi('');
    } catch (e:any) {
      Alert.alert(t('cadastro.storageError'), e?.message || t('cadastro.storageErrorDetail'));
    } finally { setStoring(false); }
  }
  
  const handlePlacaRecognized = (txt: string) => {
    if (txt && placaRegex.test(txt)) {
      setPlaca(txt.toUpperCase());
      Alert.alert(t('cadastro.plateRecognized'), txt.toUpperCase());
    } else {
      Alert.alert(t('cadastro.invalidPlateAlert'), txt || '');
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* --- MUDANÇA: Textos e Placeholders traduzidos --- */}
      <Text style={styles.label}>{t('cadastro.labelPlate')}</Text>
      <TextInput style={styles.input} value={placa} onChangeText={setPlaca} placeholder={t('cadastro.placeholderPlate')} placeholderTextColor={theme.placeholder} autoCapitalize="characters" />
      
      <Text style={styles.label}>{t('cadastro.labelBrand')}</Text>
      <TextInput style={styles.input} value={marca} onChangeText={setMarca} placeholder={t('cadastro.placeholderBrand')} placeholderTextColor={theme.placeholder} />
      
      <Text style={styles.label}>{t('cadastro.labelModel')}</Text>
      <TextInput style={styles.input} value={modelo} onChangeText={setModelo} placeholder={t('cadastro.placeholderModel')} placeholderTextColor={theme.placeholder} />
      
      <Text style={styles.label}>{t('cadastro.labelColor')}</Text>
      <TextInput style={styles.input} value={cor} onChangeText={setCor} placeholder={t('cadastro.placeholderColor')} placeholderTextColor={theme.placeholder} />
      
      <Text style={styles.label}>{t('cadastro.labelYearMake')}</Text>
      <TextInput style={styles.input} value={anoFabricacao} onChangeText={(t) => setAnoFabricacao(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} placeholder={t('cadastro.placeholderYear')} placeholderTextColor={theme.placeholder} />
      
      <Text style={styles.label}>{t('cadastro.labelYearModel')}</Text>
      <TextInput style={styles.input} value={anoModelo} onChangeText={(t) => setAnoModelo(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} placeholder={t('cadastro.placeholderYear')} placeholderTextColor={theme.placeholder} />
      
      <Text style={styles.label}>{t('cadastro.labelVin')}</Text>
      <TextInput style={styles.input} value={chassi} onChangeText={setChassi} placeholder={t('cadastro.placeholderVin')} placeholderTextColor={theme.placeholder} autoCapitalize="characters" />
      
      <Text style={styles.label}>{t('cadastro.labelTag')}</Text>
      <TextInput style={styles.input} value={tagCode} onChangeText={setTagCode} placeholder={t('cadastro.placeholderTag')} placeholderTextColor={theme.placeholder} autoCapitalize="characters" />
      
      <View style={styles.placaRecognitionContainer}><PlacaRecognition onPlacaRecognized={handlePlacaRecognized} /></View>
      
      <View style={{flexDirection:'row', gap:10}}>
        <TouchableOpacity style={[styles.button,{flex:1}]} onPress={salvarVeiculo} disabled={saving||storing}>
          {saving ? <ActivityIndicator color={theme.buttonTextPrimary} /> : <Text style={styles.buttonText}>{t('cadastro.buttonSave')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttonOutline,{flex:1}]} onPress={() => navigation.navigate('ListarVeiculos')} disabled={saving||storing}>
          <Text style={styles.buttonOutlineText}>{t('cadastro.buttonList')}</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.buttonPrimary} onPress={salvarEArmazenar} disabled={saving||storing}>
        {storing ? <ActivityIndicator color={theme.buttonTextPrimary} /> : <Text style={styles.buttonPrimaryText}>{t('cadastro.buttonSaveAndStore')}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// Estilos (sem mudança)
const getStyles = (theme: ThemeType) => StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: theme.background },
  label: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: theme.card, color: theme.text, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 15 : 10, marginBottom: 12, borderRadius: 8, fontSize: 16 },
  placaRecognitionContainer: { marginVertical: 16, alignItems: 'center' },
  button: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: theme.buttonText, fontSize: 16, fontWeight: 'bold' },
  buttonOutline: { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 2, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonOutlineText: { color: theme.primary, fontSize: 16, fontWeight: 'bold' },
  buttonPrimary: { marginTop: 14, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  buttonPrimaryText: { color: theme.buttonTextPrimary, fontWeight: 'bold', fontSize: 16 },
});