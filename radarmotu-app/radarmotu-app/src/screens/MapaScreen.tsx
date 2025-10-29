// screens/MapaScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { RADAR_API_BASE, WS_URL } from "../config/env";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { BleManager, State as BleState, Device } from "react-native-ble-plx";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { Magnetometer } from "expo-sensors";

// --- Importar o hook de tradução ---
import { useTranslation } from "react-i18next"; 

// Constantes e Funções Utilitárias 
const W = 320, H = 220;
type Anchor = { x: number; y: number };
type Anchors = Record<string, Anchor>;
type Pos = { x: number; y: number };
const DEFAULT_TX_POWER = -61;
const DEFAULT_N_PATH = 2.5;
async function tryGetJSON(url: string) { /* ... */ }
const toRad = (deg:number)=>deg*Math.PI/180;
const toDeg = (rad:number)=>rad*180/Math.PI;
const clamp = (v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function rssiToMeters(rssi: number | null, TX: number, NP: number) { /* ... */ }
function headingFromMag({ x, y }: { x: number; y: number }) { /* ... */ }
function pointToRectDistance(p: Pos, minX: number, minY: number, maxX: number, maxY: number) { /* ... */ }
function vecToNorthClockwiseDeg(dx:number, dy:number){ /* ... */ }
type MapScale = { scaleX: number; scaleY: number; minX: number; minY: number; padding: number; spanX: number; spanY: number; };
function computeScale(a: Anchors): MapScale { /* ... */ }
type Affine = { ax:number; bx:number; ay:number; by:number; active:boolean; samples:number; spanTx:number; spanTy:number };
function makeIdentity(): Affine { return { ax:1, bx:0, ay:1, by:0, active:false, samples:0, spanTx:0, spanTy:0 }; }
function fitAffineFromBBoxes(tagMinX:number, tagMaxX:number, tagMinY:number, tagMaxY:number, areaMinX:number, areaMaxX:number, areaMinY:number, areaMaxY:number): Affine { /* ... */ }
function applyAffine(p:Pos, A:Affine): Pos { /* ... */ }


// --- MiniRadarArea ---
function MiniRadarArea({ meters, angleDeg, maxMeters = 20, title: propTitle }:{
  meters:number; angleDeg:number; maxMeters?:number; title?:string;
}) {
  const { t } = useTranslation(); 
  // Usa o título passado como prop OU o título padrão traduzido
  const title = propTitle || t('mapa.approachArea'); 

  const SIZE = 120, R = SIZE/2, SWEEP_SPEED = 120;
  const [sweep, setSweep] = useState(0);
  useEffect(()=>{ 
    let raf:number; let last=Date.now();
    const tick=()=>{ const now=Date.now(); const dt=(now-last)/1000; last=now;
      setSweep(p=>(p+SWEEP_SPEED*dt)%360); raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick); return ()=>cancelAnimationFrame(raf);
   },[]);
  
  const rel = clamp(meters / maxMeters, 0, 1);
  const rPx = 8 + rel * (R - 12);
  const x = R + rPx * Math.sin(toRad(angleDeg));
  const y = R - rPx * Math.cos(toRad(angleDeg));
  
  return (
    <View style={s.radarCard}>
      <Text style={s.radarTitle}>{title}</Text>
      <Svg width={SIZE} height={SIZE}>
         <Circle cx={R} cy={R} r={R} fill="#0F131A" stroke="#273244" strokeWidth={2}/>
         {[2,5,10].map(m=>(
           <React.Fragment key={m}>
             <Circle cx={R} cy={R} r={R*(m/maxMeters)} fill="none" stroke="#263142" strokeWidth={1}/>
             <SvgText x={R+5} y={R-(R*(m/maxMeters))+12} fill="#7A8BAF" fontSize="10" textAnchor="start">{`${m}m`}</SvgText>
           </React.Fragment>
         ))}
         <Circle cx={R} cy={R} r={R} fill="none" stroke="#263142" strokeWidth={1}/>
         <SvgText x={R+5} y={15} fill="#7A8BAF" fontSize="10" textAnchor="start">{`${maxMeters}m`}</SvgText>
         {(()=>{ const x2=R+(R-4)*Math.sin(toRad(sweep)); const y2=R-(R-4)*Math.cos(toRad(sweep));
           return <Line x1={R} y1={R} x2={x2} y2={y2} stroke="#38BDF8" strokeOpacity={0.85} strokeWidth={3} strokeLinecap="round"/>;
         })()}
         <Circle cx={x} cy={y} r={7} fill="#22DD44" stroke="#0F131A" strokeWidth={2}/>
         <SvgText x={x} y={y-10} fill="#E5E7EB" fontSize="10" fontWeight="bold" textAnchor="middle">📍</SvgText>
         <Circle cx={R} cy={R} r={4} fill="#F59E0B"/>
      </Svg>
      {/* --- Texto traduzido --- */}
      <Text style={s.radarMeters}>{t('mapa.metersToArea', { distance: meters.toFixed(1) })}</Text>
    </View>
  );
}


export default function MapaScreen() {
  // --- Inicializar o hook ---
  const { t } = useTranslation();

  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const plate: string | undefined = (route.params?.plate || "").toUpperCase();

  const [positionRaw, setPositionRaw] = useState<Pos | null>(null);
  const [phoneRaw, setPhoneRaw] = useState<Pos | null>(null);
  const [position, setPosition] = useState<Pos | null>(null);
  const [phonePos, setPhonePos] = useState<Pos | null>(null);
  const [phoneDistanceToTag, setPhoneDistanceToTag] = useState<number | null>(null);
  const [phoneHeading, setPhoneHeading] = useState<number>(0);
  const [phonePositionByTag, setPhonePositionByTag] = useState<Pos | null>(null);
  const [isPhoneBleScanning, setIsPhoneBleScanning] = useState(false);
  const [anchors, setAnchors] = useState<Anchors>({});
  const [mapScale, setMapScale] = useState<MapScale>({ scaleX:1, scaleY:1, minX:0, minY:0, padding:16, spanX:1, spanY:1 });

  // --- Status inicial traduzido ---
  const [status, setStatus] = useState(t('mapa.connecting')); 
  const [tagCode, setTagCode] = useState<string | null>(null);
  const [locInfo, setLocInfo] = useState<any>(null);
  const [bleScanning, setBleScanning] = useState(false);
  const [insideByBle, setInsideByBle] = useState<null | boolean>(null);

  const ARef = useRef<Affine>(makeIdentity());
  const tagSamplesRef = useRef<Pos[]>([]);
  const AUTO_MIN_SAMPLES = 12;
  const MIN_SPAN_TO_SCALE = 0.50;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<{ timer: any; tries: number }>({ timer: null, tries: 0 });
  const bleRef = useRef(new BleManager());
  const lastPhoneSeenRef = useRef<number>(0);
  const PHONE_STALE_MS = 8000;
  
  useEffect(() => {
    if (!plate) {
      // --- Alertas traduzidos ---
      Alert.alert(t('mapa.invalidAccess'), t('mapa.invalidAccessSub'));
      nav.goBack();
    }
  }, [plate, t, nav]); 

  useEffect(() => {
    let mounted = true;
    async function boot() {
      const v = await tryGetJSON(`${RADAR_API_BASE}/api/vehicles/by-plate/${encodeURIComponent(plate)}`);
      if (mounted) setTagCode(v?.tag_code || null);
      const loc = await tryGetJSON(`${RADAR_API_BASE}/api/locate/${encodeURIComponent(plate)}`);
      if (mounted && loc) setLocInfo(loc);
    }
    if (plate) boot();
    return () => { mounted = false; };
  }, [plate]);

  useEffect(() => {
    let mounted = true;
    async function loadAnch(a: Anchors) {
      if (!mounted) return;
      setAnchors(a);
      setMapScale(computeScale(a));
    }
    (async () => {
      const a1 = await tryGetJSON(`${RADAR_API_BASE}/api/anchors`);
      if (a1) return loadAnch(a1);
      const a2 = await tryGetJSON(`${RADAR_API_BASE}/anchors.json`);
      if (a2) return loadAnch(a2);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!plate) return;
    if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
    let closedByUs = false;
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        // --- Status traduzido ---
        setStatus(t('mapa.connected')); 
        if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
        reconnectRef.current.tries = 0;
      };
      ws.onclose = () => {
        // --- Status traduzido ---
        setStatus(t('mapa.disconnected')); 
        wsRef.current = null;
        if (!closedByUs) { 
          const t_retry = Math.min(5000, 500 * Math.pow(2, reconnectRef.current.tries++));
          reconnectRef.current.timer = setTimeout(connect, t_retry);
        }
      };
      ws.onerror = () => {};
      ws.onmessage = (event) => { 
        try {
          const data = JSON.parse(event.data);
          if (data?.type === "initial_setup") {
            const backendAnchors: Anchors = data.payload?.anchors || {};
            const initialTag: Pos | null = data.payload?.initial_pos || data.payload?.position || null;
            const initialPhone: Pos | null = data.payload?.phone_pos || data.payload?.phone?.position || null;
            if (Object.keys(backendAnchors).length) {
              setAnchors(backendAnchors);
              setMapScale(computeScale(backendAnchors));
            }
            if (initialTag) setPositionRaw(initialTag);
            if (initialPhone) { setPhoneRaw(initialPhone); lastPhoneSeenRef.current = Date.now(); }
            return;
          }
          const tagId = (data?.payload?.id ?? data?.id ?? "").toString().toUpperCase();
          const tagPos: Pos | null = data?.payload?.pos ?? data?.payload?.position ?? data?.pos ?? data?.position ?? null;
          if (tagPos) {
            if (!tagCode || (tagId && tagId === (tagCode || "TAG01").toUpperCase())) setPositionRaw(tagPos);
            else if (!positionRaw) setPositionRaw(tagPos);
          }
          const phone: Pos | null = data?.payload?.phone_pos ?? data?.payload?.phone?.position ?? data?.phone_pos ?? null;
          if (phone) { setPhoneRaw(phone); lastPhoneSeenRef.current = Date.now(); }
          if (data?.anchors) { setAnchors(data.anchors); setMapScale(computeScale(data.anchors)); }
        } catch {}
       };
    };
    connect();
    return () => { 
      closedByUs = true;
      if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
     };
  }, [plate, tagCode, t]); 

  useEffect(() => {
    const sub = Magnetometer.addListener((d) => {
      const h = headingFromMag({ x: d.x ?? 0, y: d.y ?? 0 });
      setPhoneHeading(h);
    });
    Magnetometer.setUpdateInterval(200);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (!tagCode) return;
    let stopScanTimer: any;
    const bleManager = bleRef.current;
    const startScan = async () => {
      const permissionsOk = await ensureBlePermissions(); 
      if (!permissionsOk) return;
      const state = await bleManager.state();
      if (state !== BleState.PoweredOn) return;

      setIsPhoneBleScanning(true);
      bleManager.startDeviceScan(null, { allowDuplicates: true }, (err, dev) => {
        if (err || !dev) return;
        const name = (dev.localName || dev.name || "").toUpperCase();
        if (name === tagCode.toUpperCase() && dev.rssi) {
          const distance = rssiToMeters(dev.rssi, DEFAULT_TX_POWER, DEFAULT_N_PATH); 
          setPhoneDistanceToTag(distance);
        }
      });
      stopScanTimer = setTimeout(() => {
        bleManager.stopDeviceScan();
        setIsPhoneBleScanning(false);
      }, 8000); 
    };
    startScan();
    const scanInterval = setInterval(startScan, 10000);
    return () => {
      try { bleManager.stopDeviceScan(); } catch {}
      if (stopScanTimer) clearTimeout(stopScanTimer);
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [tagCode, t]); 

  useEffect(() => {
    if (position && phoneDistanceToTag != null && phoneHeading != null) {
      const angleRad = toRad(phoneHeading);
      const dx = phoneDistanceToTag * Math.sin(angleRad);
      const dy = phoneDistanceToTag * Math.cos(angleRad);
      setPhonePositionByTag({ x: position.x + dx, y: position.y - dy });
    } else {
      setPhonePositionByTag(null);
    }
  }, [position, phoneDistanceToTag, phoneHeading]);

  const onBuzz = async () => {
    try {
      const tag = (tagCode || "TAG01").toUpperCase();
      await fetch(`${RADAR_API_BASE}/api/tags/${encodeURIComponent(tag)}/alarm`, { method: "POST" });
      Alert.alert(t('mapa.commandSent'), `TOGGLE_BUZZER → ${tag}`);
    } catch { Alert.alert(t('alerts.errorTitle'), t('mapa.commandError')); }
  };
  
  const areaBBox = useMemo(() => { 
      const vals = Object.values(anchors);
      if (!vals.length) return null;
      const xs = vals.map(v=>v.x), ys = vals.map(v=>v.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      return { minX, maxX, minY, maxY };
   }, [anchors]);

  useEffect(() => { 
      if (!positionRaw || !areaBBox) return;
      tagSamplesRef.current.push({ x: positionRaw.x, y: positionRaw.y });
      if (tagSamplesRef.current.length > 200) tagSamplesRef.current.shift();
      const xs = tagSamplesRef.current.map(p=>p.x);
      const ys = tagSamplesRef.current.map(p=>p.y);
      const tMinX = Math.min(...xs), tMaxX = Math.max(...xs);
      const tMinY = Math.min(...ys), tMaxY = Math.max(...ys);
      const sX = tMaxX - tMinX, sY = tMaxY - tMinY;
      if (tagSamplesRef.current.length >= AUTO_MIN_SAMPLES && (sX >= MIN_SPAN_TO_SCALE || sY >= MIN_SPAN_TO_SCALE)) {
        const A = fitAffineFromBBoxes(tMinX, tMaxX, tMinY, tMaxY, areaBBox.minX, areaBBox.maxX, areaBBox.minY, areaBBox.maxY);
        A.samples = tagSamplesRef.current.length;
        ARef.current = A;
      }
      setPosition(applyAffine(positionRaw, ARef.current));
      if (phoneRaw) setPhonePos(applyAffine(phoneRaw, ARef.current));
   }, [positionRaw, phoneRaw, areaBBox]);
  
  async function ensureBlePermissions() {
    try {
      if (Platform.OS === "android") {
         if (Platform.Version >= 31) {
             const p1 = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
             const p2 = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
             if (p1 !== RESULTS.GRANTED || p2 !== RESULTS.GRANTED) throw new Error(t('alerts.bluetoothDenied')); // Traduzido
         } else {
             const p = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
             if (p !== RESULTS.GRANTED) throw new Error(t('alerts.locationDenied')); // Traduzido
         }
       } else {
         await request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL as any);
       }
       return true;
     } catch (e:any) {
       Alert.alert(t('alerts.permissionsTitle'), e?.message || t('alerts.permissionDenied')); // Traduzido
       return false;
     }
   }

  useEffect(() => {
    let stopTimer: any;
    (async () => {
      if (phonePos) return;
      const ok = await ensureBlePermissions(); if (!ok) return; 
      const st = await bleRef.current.state();
      if (st !== BleState.PoweredOn) return;
      setBleScanning(true);
      setInsideByBle(null);
      const anchorNames = Object.keys(anchors).length ? Object.keys(anchors).map(k=>k.toUpperCase()) : ["A1","A2","A3","A4"];
      const strongSeen: Record<string, number> = {};
      const RSSI_LIMIT = -75;
      bleRef.current.startDeviceScan(null, { allowDuplicates: true }, (error, device: Device | null) => {
        if (error) { setBleScanning(false); return; }
        if (!device) return;
        const name = (device.localName || device.name || "").toUpperCase();
        if (!name || !anchorNames.includes(name) || typeof device.rssi !== "number") return;
        if (device.rssi > RSSI_LIMIT) {
          strongSeen[name] = device.rssi;
          if (Object.keys(strongSeen).length >= 2) setInsideByBle(true);
        }
      });
      stopTimer = setTimeout(() => {
        try { bleRef.current.stopDeviceScan(); } catch {}
        setBleScanning(false);
        if (insideByBle !== true) setInsideByBle(false);
      }, 6000);
    })();
    return () => {
      try { bleRef.current.stopDeviceScan(); } catch {}
      if (stopTimer) clearTimeout(stopTimer);
      setBleScanning(false);
    };
  }, [anchors, phonePos, t]); 
  
  const phoneStale = useMemo(() => { 
      if (!phonePos) return true;
      return (Date.now() - lastPhoneSeenRef.current) > PHONE_STALE_MS;
   }, [phonePos]);

  const area = useMemo(() => { 
      const vals = Object.values(anchors);
      if (!vals.length) return null;
      const xs = vals.map(v=>v.x), ys = vals.map(v=>v.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const spanX = maxX - minX, spanY = maxY - minY;
      const cx = minX + spanX/2, cy = minY + spanY/2;
      const diag = Math.hypot(spanX, spanY);
      return { minX, minY, maxX, maxY, spanX, spanY, cx, cy, diag };
   }, [anchors]);

  const phoneInsideFinal: boolean | null = useMemo(() => { 
      if (!area) return null;
      if (phonePos) {
        return (phonePos.x >= area.minX && phonePos.x <= area.maxX && phonePos.y >= area.minY && phonePos.y <= area.maxY);
      }
      return insideByBle;
   }, [area, phonePos, insideByBle]);

  const areaGuide = useMemo(() => { 
      if (!area || !phonePos) return null;
      const { meters, nearest } = pointToRectDistance(phonePos, area.minX, area.minY, area.maxX, area.maxY);
      const dx = nearest.x - phonePos.x, dy = nearest.y - phonePos.y;
      const angleDeg = vecToNorthClockwiseDeg(dx, dy);
      return { meters, angleDeg };
   }, [area, phonePos]);
  
  const MAX_AREA_GUIDE_METERS = 20;

  // ---  Textos do Banner traduzidos ---
  const bannerText = useMemo(() => {
    if (!area) return t('mapa.loadingArea');
    if (phoneInsideFinal) return t('mapa.insideArea');
    if (phoneDistanceToTag != null) {
      return t('mapa.distanceToTag', { distance: phoneDistanceToTag.toFixed(1) });
    }
    return isPhoneBleScanning ? t('mapa.searchingTag') : t('mapa.approachTag');
  }, [area, phoneInsideFinal, phoneDistanceToTag, isPhoneBleScanning, t]); 

  const bannerStyle = useMemo(() => { 
      if (phoneInsideFinal) return s.reachOK;
      if (phoneDistanceToTag != null && phoneDistanceToTag < (area?.diag ?? 20) / 2) return s.reachOK;
      return s.reachWarn;
   }, [phoneInsideFinal, phoneDistanceToTag, area]);

  const RADAR_ENABLE_DISTANCE_METERS = 10.0;
  const radarDisabled = useMemo(() => { 
      if (phoneInsideFinal === true) return false;
      if (phoneDistanceToTag != null && phoneDistanceToTag < RADAR_ENABLE_DISTANCE_METERS) return false;
      return true;
   }, [phoneInsideFinal, phoneDistanceToTag]);

  const proj = (p: {x:number;y:number}) => ({ x: mapScale.padding + (p.x - mapScale.minX) * mapScale.scaleX, y: mapScale.padding + (p.y - mapScale.minY) * mapScale.scaleY });
  function clampPx(val:number, min:number, max:number){ return Math.max(min, Math.min(max, val)); }
  function clampToMap(x:number, y:number){
    const left = mapScale.padding, top = mapScale.padding;
    const right = mapScale.padding + mapScale.spanX * mapScale.scaleX;
    const bottom = mapScale.padding + mapScale.spanY * mapScale.scaleY;
    const cx = clampPx(x, left, right);
    const cy = clampPx(y, top, bottom);
    const onEdge = (x < left || x > right || y < top || y > bottom);
    const dx = x - cx, dy = y - cy;
    const ang = Math.atan2(dy, dx);
    return { cx, cy, onEdge, ang };
  }
  
  return (
    <View style={s.container}>
      {/* --- Textos traduzidos --- */}
      <Text style={s.title}>{t('mapa.title')}</Text>
      <Text style={s.info}>{t('mapa.status')} {status}</Text>
      <Text style={s.info}>{t('mapa.labelPlate')} {plate}{tagCode ? `   |   ${t('mapa.labelTag')} ${tagCode}` : ""}</Text>
      <Text style={s.info}>
         {area ? t('mapa.areaInfo', { spanX: area.spanX.toFixed(2), spanY: area.spanY.toFixed(2), diag: area.diag.toFixed(2)}) : `${t('mapa.labelArea')} —`}
       </Text>
      <Text style={s.info}>
         {locInfo ? `${t('mapa.labelZone')} ${locInfo.zone || "-"}   |   ${t('mapa.labelSpot')} ${locInfo.spot || "-"}` : t('mapa.noSpotInfo')}
       </Text>

      <View style={[s.reachBanner, bannerStyle]}>
        <Text style={s.reachText}>{bannerText}</Text>
      </View>

      <View style={s.map}>
         {area && ( <View style={{ position: "absolute", left: mapScale.padding, top: mapScale.padding, width: mapScale.spanX * mapScale.scaleX, height: mapScale.spanY * mapScale.scaleY, borderWidth: 1.5, borderColor: "#2f3b4f", borderRadius: 4 }} /> )}
         {Object.entries(anchors).map(([id, pos]) => { const p = proj(pos); return ( <View key={id} style={[s.dotAnchor, { left: p.x - 8, top: p.y - 8 }]}><Text style={s.anchorText}>{id}</Text></View> ); })}
         {position && (()=>{ const p = proj(position); const { cx, cy, onEdge, ang } = clampToMap(p.x, p.y); return ( <> <View style={[s.dotTag, { left: cx - 6, top: cy - 6 }]} /> {onEdge && ( <View style={[s.edgeArrow, { left: cx - 8, top: cy - 8, transform: [{ rotate: `${(ang*180/Math.PI)+90}deg` }] }]} /> )} </> ); })()}
         {!phonePos && phonePositionByTag && (()=>{ const p = proj(phonePositionByTag); const { cx, cy, onEdge, ang } = clampToMap(p.x, p.y); return ( <> <View style={[s.dotPhone, { left: cx - 6, top: cy - 6 }]} /> {onEdge && ( <View style={[s.edgeArrowGreen, { left: cx - 8, top: cy - 8, transform: [{ rotate: `${(ang*180/Math.PI)+90}deg` }] }]} /> )} </> ); })()}
         {phonePos && !phoneStale && (()=>{ const p = proj(phonePos); const { cx, cy, onEdge, ang } = clampToMap(p.x, p.y); return ( <> <View style={[s.dotPhone, { left: cx - 6, top: cy - 6 }]} /> {onEdge && ( <View style={[s.edgeArrowGreen, { left: cx - 8, top: cy - 8, transform: [{ rotate: `${(ang*180/Math.PI)+90}deg` }] }]} /> )} </> ); })()}
      </View>

      {area && phonePos && !phoneStale && phoneInsideFinal === false && areaGuide && areaGuide.meters <= MAX_AREA_GUIDE_METERS && (
        <MiniRadarArea meters={areaGuide.meters} angleDeg={areaGuide.angleDeg} maxMeters={MAX_AREA_GUIDE_METERS} title={t('mapa.approachArea')} />
      )}
      
      {/* --- Botões traduzidos --- */}
      <TouchableOpacity style={s.btn} onPress={onBuzz}>
        <Text style={s.btnT}>{t('mapa.buttonBuzzer')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={radarDisabled}
        style={[s.btn, { backgroundColor: radarDisabled ? "#6B7280" : "#3B82F6", marginTop: 10 }]}
        onPress={() => nav.navigate("RadarProximidade", { plate, tag: tagCode })}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          {radarDisabled ? t('mapa.buttonApproachRadar') : t('mapa.buttonOpenRadar')}
        </Text>
      </TouchableOpacity>

      {/* --- Textos de Debug --- */}
      <View style={s.debugBox}>
        <Text style={s.debugT}>TAG(norm): {position ? `${position.x.toFixed(2)}, ${position.y.toFixed(2)}` : "—"}</Text>
        <Text style={s.debugT}>PHONE(anchor): {phonePos ? `${phonePos.x.toFixed(2)}, ${phonePos.y.toFixed(2)}` : "—"}</Text>
        <Text style={s.debugT}>
          {`PHONE(ble): dist: ${phoneDistanceToTag?.toFixed(1) ?? 'N/A'}m | head: ${phoneHeading?.toFixed(0) ?? 'N/A'}° | pos: ${phonePositionByTag ? `${phonePositionByTag.x.toFixed(1)}, ${phonePositionByTag.y.toFixed(1)}` : 'N/A'}`}
        </Text>
        {(!phonePos) && <Text style={s.debugT}>BLE fallback (anchors): {insideByBle===null? "checking..." : insideByBle? "INSIDE" : "OUTSIDE"}</Text>} 
      </View>
    </View>
  );
}

// Estilos 
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1D21", padding: 16 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  info: { color: "#E0E0E0", marginBottom: 6 },
  map: { width: W, height: H, backgroundColor: "#23272A", borderRadius: 8, borderWidth: 1, borderColor: '#444', position: "relative", overflow: "hidden", alignSelf: "center", marginTop: 8 },
  dotAnchor: { position: "absolute", width: 16, height: 16, borderRadius: 4, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  anchorText: { color: "#fff", fontSize: 8, fontWeight: "bold" },
  dotTag: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#EF4444", borderWidth: 1, borderColor: "#fff" },
  dotPhone: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#22DD44", borderWidth: 1, borderColor: "#0a0a0a" },
  edgeArrow: { position:'absolute', width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#EF4444' },
  edgeArrowGreen: { position:'absolute', width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#22DD44' },
  btn: { padding: 15, borderRadius: 8, marginTop: 20, alignItems: "center", backgroundColor: "#22DD44" },
  btnT: { color: "#000", fontWeight: "bold" },
  reachBanner: { alignSelf: "center", minWidth: W, paddingVertical: 8, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: "#333", alignItems: "center" },
  reachText: { color: "#E5E7EB", fontWeight: "600" },
  reachNeutral: { backgroundColor: "#2B3138" },
  reachOK: { backgroundColor: "#173A2A", borderColor: "#1F6F4A" },
  reachWarn: { backgroundColor: "#352C18", borderColor: "#6B5B2C" },
  radarCard: { alignSelf: "center", marginTop: 12, width: W, backgroundColor: "#161B22", borderRadius: 12, borderWidth: 1, borderColor: "#30363D", padding: 12 },
  radarTitle: { color: "#E5E7EB", fontWeight: "bold", marginBottom: 8 },
  radarMeters: { color:"#E5E7EB", marginTop: 8, textAlign:"center" },
  debugBox:{ marginTop:12, padding:8, borderRadius:8, borderWidth:1, borderColor:'#374151', backgroundColor:'#0f172a' },
  debugT:{ color:'#9ca3af', fontSize:12 },
});