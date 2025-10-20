// screens/OperacoesPorPlaca.tsx 

import React, { useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import PlacaRecognition from "./PlacaRecognition";
import { storeByPlate, releaseByPlate } from "../services/api";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from '../contexts/ThemeContext';
import { ThemeType } from '../themes';

export default function OperacoesPorPlaca() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const nav = useNavigation<any>();

  const [plate, setPlate] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const last = useRef<string>("");
  
  const onPlacaRecognized = useCallback((t: string) => {
    const re = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i;
    if (!t || !re.test(t)) { Alert.alert("Placa inválida", t||""); return; }
    const p = t.toUpperCase();
    if (p === last.current) return;
    last.current = p;
    setPlate(p);
    Alert.alert("Placa", p);
  }, []);
  
  const doStore = async () => {
    if (!plate) return Alert.alert("Escaneie a placa");
    try { 
      setBusy(true);
      const r = await storeByPlate(plate);
      Alert.alert("Alocada", `Zona: ${r.zone || "-"}\nVaga: ${r.spot || "-"}`);
    } catch(e:any){ Alert.alert("Erro", e?.message||"Falha"); }
    finally{ setBusy(false); }
  };
  
  const doRelease = async () => {
    if (!plate) return Alert.alert("Escaneie a placa");
    try { 
      setBusy(true);
      await releaseByPlate(plate);
      Alert.alert("Liberada", "Vaga liberada.");
    } catch(e:any){ Alert.alert("Erro", e?.message||"Falha"); }
    finally{ setBusy(false); }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Operações por Placa (OCR)</Text>
      <View style={styles.card}>
        <PlacaRecognition onPlacaRecognized={onPlacaRecognized} />
        <View style={styles.row}>
          <Text style={styles.label}>Placa:</Text>
          <Text style={styles.plate}>{plate||"—"}</Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={doStore} disabled={busy||!plate}>
            {busy? <ActivityIndicator color={theme.buttonTextPrimary}/> : <Text style={styles.btnTextPrimary}>Armazenar</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={()=>nav.navigate("MapaDoPatio", { plate })} disabled={!plate}>
            <Text style={styles.btnTextSecondary}>Buscar (Mapa)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.info]} onPress={()=>nav.navigate("RadarProximidade", { plate })} disabled={!plate}>
            <Text style={styles.btnTextInfo}>Radar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.warning]} onPress={doRelease} disabled={busy||!plate}>
            <Text style={styles.btnTextWarning}>Liberar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme: ThemeType) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 16 },
  title: { color: theme.text, fontWeight: "bold", fontSize: 18, marginBottom: 12 },
  card: { backgroundColor: theme.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: theme.border },
  row: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: 'center' },
  label: { color: theme.inactive },
  plate: { color: theme.text, fontWeight: "bold", fontSize: 16 },
  buttons: { flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" },
  btn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, minWidth: 120, alignItems: "center", justifyContent: 'center' },
  
  primary: { backgroundColor: theme.primary },
  btnTextPrimary: { color: theme.buttonTextPrimary, fontWeight: "bold" },
  
  secondary: { borderWidth: 2, borderColor: theme.primary },
  btnTextSecondary: { color: theme.primary, fontWeight: "bold" },
  
  info: { backgroundColor: theme.info },
  btnTextInfo: { color: theme.buttonText, fontWeight: "bold" },
  
  warning: { backgroundColor: theme.warning },
  btnTextWarning: { color: theme.buttonTextPrimary, fontWeight: "bold" },
});