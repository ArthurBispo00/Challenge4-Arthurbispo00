// screens/Cadastro.tsx

import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

import { DrawerParamList } from '../navigation/types'; 

import PlacaRecognition from './PlacaRecognition';
import { createVehicle, updateVehicle, getVehicleByPlate, storeByPlate } from '../services/api'; // <--- Chamadas de API INTACTAS
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../themes';
import { useTranslation } from 'react-i18next'; // 


import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';




async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: object) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data || {},
  };
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    console.log("Notificação enviada com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
}



type CadastroScreenNavigationProp = DrawerNavigationProp<DrawerParamList, 'CadastrarVeiculo'>;

export default function CadastroVeiculo() {
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

 
  useLayoutEffect(() => { navigation.setOptions({ headerStyle: { backgroundColor: theme.header }, headerTintColor: theme.text }); }, [navigation, theme]);

  const placaRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i; // INTACTO

  
  function validarCampos(): string | null {
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
    } catch (e) {
      
      console.error("Erro em syncCreateOrUpdate:", e);
     
    }
    return { serverOk, action };
  }

  // --- FUNÇÃO salvarVeiculo
  async function salvarVeiculo() {
    const erro = validarCampos(); if (erro) return Alert.alert(t('alerts.errorTitle'), erro);
    const novoVeiculo = { placa, marca, modelo, cor, anoFabricacao, anoModelo, chassi, tag_code: tagCode || undefined };
    let success = false;
    let vehicleDataForNotification = { plate: placa.toUpperCase(), model: modelo };

    try {
      setSaving(true);
      await salvarLocal(novoVeiculo); 
      const { serverOk, action } = await syncCreateOrUpdate(novoVeiculo); 
      const status = serverOk ? t('cadastro.serverOK') : t('cadastro.serverFail'); 
      const message = action === "update" ? t('cadastro.vehicleUpdated') : t('cadastro.vehicleCreated'); // INTACTO
      Alert.alert(t('alerts.successTitle'), `${message}\n${status}`); 
      success = true; 

      if (serverOk) { setPlaca(''); setMarca(''); setModelo(''); setCor(''); setAnoFabricacao(''); setAnoModelo(''); setChassi(''); } // INTACTO
    } catch (e_save) { 
      console.error("Erro em salvarVeiculo (try block):", e_save);
      Alert.alert(t('alerts.errorTitle'), t('cadastro.saveError'));
    } finally {
      setSaving(false); 
      
      if (success) { 
        console.log("[Cadastro] Operação concluída. Tentando enviar notificação...");
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;
          if (Device.isDevice && projectId) {
             const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
             if (tokenData.data) {
                console.log("[Cadastro] Token obtido para envio:", tokenData.data);
                await sendPushNotification(
                  tokenData.data,
                  "Veículo Cadastrado", // Título Fixo PT-BR
                  `Veículo ${vehicleDataForNotification.model} com placa ${vehicleDataForNotification.plate} cadastrado.` // Corpo Fixo PT-BR (simplificado)
                );
             } else { console.warn("[Cadastro] Não foi possível obter token para enviar notificação.") }
          } else { console.warn("[Cadastro] Não é um dispositivo físico ou projectId não encontrado, notificação não enviada.") }
        } catch (e_notify) { 
           console.error("[Cadastro] Erro ao tentar obter token/enviar notificação:", e_notify);
           
        }
      } else {
         console.log("[Cadastro] Operação não foi bem sucedida, notificação não será enviada.");
      }
      
    }
  }

  // --- FUNÇÃO salvarEArmazenar 
  async function salvarEArmazenar() {
    const erro = validarCampos(); if (erro) return Alert.alert(t('alerts.errorTitle'), erro);
    const novoVeiculo = { placa, marca, modelo, cor, anoFabricacao, anoModelo, chassi, tag_code: tagCode || undefined };
    let success = false;
    let vehicleDataForNotification = { plate: placa.toUpperCase(), model: modelo };
    let spotInfoForNotification = { zone: '-', spot: '-'};

    try {
      setStoring(true);
      await salvarLocal(novoVeiculo); 
      const { serverOk, action } = await syncCreateOrUpdate(novoVeiculo);
      if (!serverOk) {
          console.warn("[Armazenamento] syncCreateOrUpdate falhou, mas tentando alocar vaga mesmo assim.");
      }
      
      const resp = await storeByPlate(placa.toUpperCase()); 
      spotInfoForNotification.zone = resp?.zone || '-'; 
      spotInfoForNotification.spot = resp?.spot || '-'; 
      const status = serverOk ? t('cadastro.serverOK') : t('cadastro.serverFail'); 
      Alert.alert( 
        t('cadastro.spotAllocated'),
        `${t('cadastro.spotInfo', { zone: spotInfoForNotification.zone, spot: spotInfoForNotification.spot })}\n${status}\n\n${t('cadastro.spotMapInfo')}`
      );
      success = true; 

      setPlaca(''); setMarca(''); setModelo(''); setCor(''); setAnoFabricacao(''); setAnoModelo(''); setChassi(''); // INTACTO
    } catch (e_store) { // Capturar erro específico do try
      console.error("Erro em salvarEArmazenar (try block):", e_store);
      Alert.alert(t('cadastro.storageError'), (e_store as any)?.message || t('cadastro.storageErrorDetail')); // INTACTO (melhoria na msg de erro)
    } finally {
      setStoring(false); 
      
      if (success) { // Só envia se o try completou sem erro
        console.log("[Armazenamento] Operação concluída. Tentando enviar notificação...");
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;
           if (Device.isDevice && projectId) {
             const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
             if (tokenData.data) {
                console.log("[Armazenamento] Token obtido para envio:", tokenData.data);
                await sendPushNotification(
                  tokenData.data,
                  "Veículo Armazenado", // Título Fixo PT-BR
                  `Veículo ${vehicleDataForNotification.plate} alocado na Zona ${spotInfoForNotification.zone} Vaga ${spotInfoForNotification.spot}.` // Corpo Fixo PT-BR
                );
             } else { console.warn("[Armazenamento] Não foi possível obter token para enviar notificação.") }
           } else { console.warn("[Armazenamento] Não é um dispositivo físico ou projectId não encontrado, notificação não enviada.") }
        } catch (e_notify) { // Capturar erro específico da notificação
           console.error("[Armazenamento] Erro ao tentar obter token/enviar notificação:", e_notify);
        }
      } else {
         console.log("[Armazenamento] Operação não foi bem sucedida, notificação não será enviada.");
      }
     
    }
  } // Fim salvarEArmazenar

  // handlePlacaRecognized 
  const handlePlacaRecognized = (txt: string) => {
    if (txt && placaRegex.test(txt)) {
      setPlaca(txt.toUpperCase());
      Alert.alert(t('cadastro.plateRecognized'), txt.toUpperCase());
    } else {
      Alert.alert(t('cadastro.invalidPlateAlert'), txt || '');
    }
  };

  // return JSX 
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
       <Text style={styles.label}>{t('cadastro.labelPlate')}</Text>
       <TextInput style={styles.input} value={placa} onChangeText={setPlaca} placeholder={t('cadastro.placeholderPlate')} placeholderTextColor={theme.placeholder} autoCapitalize="characters" />
       <Text style={styles.label}>{t('cadastro.labelBrand')}</Text>
       <TextInput style={styles.input} value={marca} onChangeText={setMarca} placeholder={t('cadastro.placeholderBrand')} placeholderTextColor={theme.placeholder} />
       <Text style={styles.label}>{t('cadastro.labelModel')}</Text>
       <TextInput style={styles.input} value={modelo} onChangeText={setModelo} placeholder={t('cadastro.placeholderModel')} placeholderTextColor={theme.placeholder} />
       <Text style={styles.label}>{t('cadastro.labelColor')}</Text>
       <TextInput style={styles.input} value={cor} onChangeText={setCor} placeholder={t('cadastro.placeholderColor')} placeholderTextColor={theme.placeholder} />
       <Text style={styles.label}>{t('cadastro.labelYearMake')}</Text>
       <TextInput style={styles.input} value={anoFabricacao} onChangeText={(t_val) => setAnoFabricacao(t_val.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} placeholder={t('cadastro.placeholderYear')} placeholderTextColor={theme.placeholder} />
       <Text style={styles.label}>{t('cadastro.labelYearModel')}</Text>
       <TextInput style={styles.input} value={anoModelo} onChangeText={(t_val) => setAnoModelo(t_val.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} placeholder={t('cadastro.placeholderYear')} placeholderTextColor={theme.placeholder} />
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

// Estilos 
const getStyles = (theme: ThemeType) => StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: theme.background },
  label: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: theme.card, color: theme.text, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 15 : 10, marginBottom: 12, borderRadius: 8, fontSize: 16 },
  placaRecognitionContainer: { marginVertical: 16, alignItems: 'center' },
  button: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: theme.buttonTextPrimary, fontSize: 16, fontWeight: 'bold' }, 
  buttonOutline: { backgroundColor: 'transparent', borderColor: theme.primary, borderWidth: 2, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonOutlineText: { color: theme.primary, fontSize: 16, fontWeight: 'bold' },
  buttonPrimary: { marginTop: 14, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  buttonPrimaryText: { color: theme.buttonTextPrimary, fontWeight: 'bold', fontSize: 16 },
});