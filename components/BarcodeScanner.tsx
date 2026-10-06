import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ScannedProduct {
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  barcode: string;
}

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onProduct: (product: ScannedProduct) => void;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    serving_size?: string;
    nutriments?: {
      "energy-kcal_serving"?: number;
      "energy-kcal_100g"?: number;
      "proteins_serving"?: number;
      "proteins_100g"?: number;
      "carbohydrates_serving"?: number;
      "carbohydrates_100g"?: number;
      "fat_serving"?: number;
      "fat_100g"?: number;
    };
  };
}

async function fetchProductByBarcode(barcode: string): Promise<ScannedProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { "User-Agent": "ApexFitnessTracker/1.0" } }
    );
    if (!res.ok) return null;
    const data: OpenFoodFactsResponse = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};
    const hasPer100 = n["energy-kcal_100g"] != null;

    const calories = n["energy-kcal_serving"] ?? (hasPer100 ? n["energy-kcal_100g"]! : 0);
    const protein = n["proteins_serving"] ?? (n["proteins_100g"] ?? 0);
    const carbs = n["carbohydrates_serving"] ?? (n["carbohydrates_100g"] ?? 0);
    const fat = n["fat_serving"] ?? (n["fat_100g"] ?? 0);

    return {
      name: p.product_name || "Unknown Product",
      brand: p.brands || "",
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      servingSize: p.serving_size || (hasPer100 ? "100g" : "1 serving"),
      barcode,
    };
  } catch {
    return null;
  }
}

type ScanState = "scanning" | "fetching" | "found" | "not_found" | "error";

export default function BarcodeScanner({ visible, onClose, onProduct }: BarcodeScannerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanState("scanning");
      setProduct(null);
      setLastScanned(null);
      startScanLineAnimation();
    }
  }, [visible]);

  function startScanLineAnimation() {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }

  async function handleBarcodeScan(result: BarcodeScanningResult) {
    if (scanState !== "scanning") return;
    const code = result.data;
    if (code === lastScanned) return;
    setLastScanned(code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanState("fetching");

    const found = await fetchProductByBarcode(code);
    if (found) {
      setProduct(found);
      setScanState("found");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setScanState("not_found");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleReset() {
    setProduct(null);
    setLastScanned(null);
    setScanState("scanning");
  }

  function handleConfirm() {
    if (product) {
      onProduct(product);
      onClose();
    }
  }

  const s = makeStyles(colors);

  if (!visible) return null;

  if (Platform.OS === "web") {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[s.container, { paddingTop: insets.top + 20, backgroundColor: colors.background }]}>
          <View style={s.header}>
            <Text style={[s.title, { color: colors.foreground }]}>Scan Barcode</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={s.webUnsupported}>
            <View style={[s.webIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="camera-off" size={36} color={colors.primary} />
            </View>
            <Text style={[s.webTitle, { color: colors.foreground }]}>Camera not available on web</Text>
            <Text style={[s.webSub, { color: colors.mutedForeground }]}>
              Use the Expo Go app on your phone to scan barcodes
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={[s.container, { backgroundColor: "#000" }]}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
          <View style={s.header}>
            <Text style={[s.title, { color: colors.foreground }]}>Camera Access</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={s.permissionBox}>
            <View style={[s.webIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="camera" size={36} color={colors.primary} />
            </View>
            <Text style={[s.webTitle, { color: colors.foreground }]}>Camera permission needed</Text>
            <Text style={[s.webSub, { color: colors.mutedForeground }]}>
              Allow camera access to scan food barcodes
            </Text>
            <TouchableOpacity
              style={[s.permissionBtn, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={s.permissionBtnText}>Allow Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={s.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanState === "scanning" ? handleBarcodeScan : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
          }}
        />

        {/* Dark overlay with viewfinder cutout */}
        <View style={s.overlay}>
          {/* Top dark area */}
          <View style={[s.overlayDark, { paddingTop: insets.top + 16 }]}>
            <View style={s.header}>
              <Text style={s.cameraTitle}>Scan Barcode</Text>
              <TouchableOpacity onPress={onClose} style={[s.closeBtn, s.closeBtnCamera]}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={s.cameraSubtitle}>Point at a food product barcode</Text>
          </View>

          {/* Viewfinder row */}
          <View style={s.viewfinderRow}>
            <View style={s.overlayDarkSide} />
            <View style={s.viewfinder}>
              {/* Corner brackets */}
              <View style={[s.corner, s.cornerTL, { borderColor: colors.primary }]} />
              <View style={[s.corner, s.cornerTR, { borderColor: colors.primary }]} />
              <View style={[s.corner, s.cornerBL, { borderColor: colors.primary }]} />
              <View style={[s.corner, s.cornerBR, { borderColor: colors.primary }]} />

              {/* Scan line animation */}
              {scanState === "scanning" && (
                <Animated.View
                  style={[s.scanLine, { backgroundColor: colors.primary, transform: [{ translateY: scanLineY }] }]}
                />
              )}

              {/* State overlays */}
              {scanState === "fetching" && (
                <View style={s.stateOverlay}>
                  <ActivityIndicator color="#fff" size="large" />
                  <Text style={s.stateText}>Looking up product...</Text>
                </View>
              )}
              {scanState === "not_found" && (
                <View style={s.stateOverlay}>
                  <Feather name="alert-circle" size={32} color="#FF453A" />
                  <Text style={s.stateText}>Product not found</Text>
                  <TouchableOpacity style={s.retryBtn} onPress={handleReset}>
                    <Text style={[s.retryText, { color: colors.primary }]}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={s.overlayDarkSide} />
          </View>

          {/* Bottom area */}
          <View style={s.overlayDarkBottom}>
            {scanState === "found" && product ? (
              <View style={s.productCard}>
                <View style={s.productInfo}>
                  <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
                  {product.brand.length > 0 && (
                    <Text style={s.productBrand}>{product.brand}</Text>
                  )}
                  <Text style={s.productServing}>Per {product.servingSize}</Text>
                  <View style={s.macroRow}>
                    <View style={s.macroChip}>
                      <Text style={[s.macroVal, { color: colors.primary }]}>{product.calories}</Text>
                      <Text style={s.macroKey}>kcal</Text>
                    </View>
                    <View style={s.macroChip}>
                      <Text style={[s.macroVal, { color: "#4C9BE8" }]}>{product.protein}g</Text>
                      <Text style={s.macroKey}>protein</Text>
                    </View>
                    <View style={s.macroChip}>
                      <Text style={[s.macroVal, { color: colors.primary }]}>{product.carbs}g</Text>
                      <Text style={s.macroKey}>carbs</Text>
                    </View>
                    <View style={s.macroChip}>
                      <Text style={[s.macroVal, { color: "#30D158" }]}>{product.fat}g</Text>
                      <Text style={s.macroKey}>fat</Text>
                    </View>
                  </View>
                </View>
                <View style={s.productActions}>
                  <TouchableOpacity style={s.actionScanAgain} onPress={handleReset}>
                    <Feather name="refresh-cw" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionAdd, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
                    <Feather name="plus" size={18} color="#fff" />
                    <Text style={s.actionAddText}>Add Food</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={s.hint}>
                <Feather name="zap" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={s.hintText}>Supports EAN-13, UPC-A, UPC-E, and more</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    cameraContainer: { flex: 1, backgroundColor: "#000" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    closeBtn: { padding: 4 },
    closeBtnCamera: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 8 },
    webUnsupported: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
    permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
    webIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
    webTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
    webSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
    permissionBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, marginTop: 8 },
    permissionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
    overlay: { ...StyleSheet.absoluteFillObject, flexDirection: "column" },
    overlayDark: { backgroundColor: "rgba(0,0,0,0.65)" },
    cameraTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
    cameraSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", paddingHorizontal: 16, marginBottom: 16 },
    viewfinderRow: { flexDirection: "row", height: 240 },
    overlayDarkSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
    viewfinder: { width: 260, height: 240, position: "relative", overflow: "hidden" },
    corner: { position: "absolute", width: 24, height: 24, borderWidth: 3 },
    cornerTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
    cornerTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
    cornerBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
    cornerBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },
    scanLine: { position: "absolute", left: 0, right: 0, height: 2, opacity: 0.8 },
    stateOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", gap: 10 },
    stateText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#fff", textAlign: "center" },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", marginTop: 4 },
    retryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    overlayDarkBottom: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end", paddingBottom: 40 },
    hint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    hintText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
    productCard: { backgroundColor: "rgba(28,28,30,0.97)", borderRadius: 20, marginHorizontal: 16, padding: 16, gap: 14 },
    productInfo: { gap: 4 },
    productName: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
    productBrand: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
    productServing: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 2 },
    macroRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    macroChip: { flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, padding: 8, alignItems: "center", gap: 2 },
    macroVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
    macroKey: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
    productActions: { flexDirection: "row", gap: 10 },
    actionScanAgain: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
    actionAdd: { flex: 1, height: 48, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    actionAddText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });
}
