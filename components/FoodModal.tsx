import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { FOODS, FOOD_CATEGORIES, Food } from "@/constants/foods";
import { FoodEntry } from "@/context/FitnessContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BarcodeScanner, { ScannedProduct } from "@/components/BarcodeScanner";

interface FoodModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: FoodEntry) => void;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

export default function FoodModal({ visible, onClose, onAdd }: FoodModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState("All");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [quantity, setQuantity] = useState("1");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }

    async function searchApi() {
      setIsLoading(true);
      try {
        const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(debouncedSearch)}&search_simple=1&action=process&json=1&page_size=20`, {
          headers: { "User-Agent": "ApexFitnessTracker/1.0" }
        });
        const data = await res.json();
        
        if (data.products) {
          const results: Food[] = data.products.map((p: any) => {
            const n = p.nutriments ?? {};
            const hasPer100 = n["energy-kcal_100g"] != null;

            const calories = n["energy-kcal_serving"] ?? (hasPer100 ? n["energy-kcal_100g"] : 0);
            const protein = n["proteins_serving"] ?? (n["proteins_100g"] ?? 0);
            const carbs = n["carbohydrates_serving"] ?? (n["carbohydrates_100g"] ?? 0);
            const fat = n["fat_serving"] ?? (n["fat_100g"] ?? 0);

            return {
              id: `api-${p.code || p.id || Math.random().toString()}`,
              name: p.product_name || "Unknown Product",
              calories: Math.round(calories || 0),
              protein: Math.round((protein || 0) * 10) / 10,
              carbs: Math.round((carbs || 0) * 10) / 10,
              fat: Math.round((fat || 0) * 10) / 10,
              servingSize: p.serving_size || (hasPer100 ? "100g" : "1 serving"),
              category: "API Result"
            };
          });
          setSearchResults(results.filter((r) => r.name !== "Unknown Product"));
        }
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsLoading(false);
      }
    }

    searchApi();
  }, [debouncedSearch]);

  const filtered = useMemo(() => {
    if (search.length > 0) {
      return searchResults;
    }
    return FOODS.filter((f) => category === "All" || f.category === category);
  }, [search, searchResults, category]);

  function handleSelectFood(food: Food) {
    Haptics.selectionAsync();
    setSelectedFood(food);
    setQuantity("1");
  }

  function handleScannedProduct(product: ScannedProduct) {
    setScannedProduct(product);
    setQuantity("1");
  }

  function handleAddScanned() {
    if (!scannedProduct) return;
    const qty = parseFloat(quantity) || 1;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    onAdd({
      id,
      foodId: `barcode-${scannedProduct.barcode}`,
      name: scannedProduct.name,
      calories: scannedProduct.calories,
      protein: scannedProduct.protein,
      carbs: scannedProduct.carbs,
      fat: scannedProduct.fat,
      servingSize: scannedProduct.servingSize,
      quantity: qty,
      mealType,
      timestamp: Date.now(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  }

  function handleAdd() {
    if (scannedProduct) { handleAddScanned(); return; }
    if (!selectedFood) return;
    const qty = parseFloat(quantity) || 1;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    onAdd({
      id,
      foodId: selectedFood.id,
      name: selectedFood.name,
      calories: selectedFood.calories,
      protein: selectedFood.protein,
      carbs: selectedFood.carbs,
      fat: selectedFood.fat,
      servingSize: selectedFood.servingSize,
      quantity: qty,
      mealType,
      timestamp: Date.now(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  }

  function handleClose() {
    setSearch("");
    setCategory("All");
    setSelectedFood(null);
    setScannedProduct(null);
    setQuantity("1");
    onClose();
  }

  const s = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[s.container, { paddingTop: Platform.OS === "web" ? insets.top + 20 : 20 }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{selectedFood ? selectedFood.name : "Add Food"}</Text>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {!selectedFood && !scannedProduct ? (
          <>
            {/* Scan barcode button */}
            <TouchableOpacity
              style={[s.scanBarcodeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => setScannerOpen(true)}
            >
              <View style={[s.scanIconBox, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="camera" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.scanBtnLabel, { color: colors.foreground }]}>Scan Barcode</Text>
                <Text style={[s.scanBtnSub, { color: colors.mutedForeground }]}>Point camera at food packaging</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={s.orDivider}>
              <View style={[s.orLine, { backgroundColor: colors.border }]} />
              <Text style={[s.orText, { color: colors.mutedForeground }]}>or search manually</Text>
              <View style={[s.orLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Search */}
            <View style={s.searchRow}>
              <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder="Search foods..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Categories */}
            <FlatList
              data={FOOD_CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(c) => c}
              style={s.catList}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCategory(item);
                    if (item !== "All") {
                      setSearch(item);
                    } else {
                      setSearch("");
                    }
                  }}
                  style={[s.catChip, { backgroundColor: category === item ? colors.primary : colors.secondary }]}
                >
                  <Text style={[s.catText, { color: category === item ? "#fff" : colors.mutedForeground }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            {isLoading && (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}

            {/* Food List */}
            <FlatList
              data={filtered}
              keyExtractor={(f) => f.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.foodItem} onPress={() => handleSelectFood(item)}>
                  <View style={s.foodInfo}>
                    <Text style={s.foodName}>{item.name}</Text>
                    <Text style={s.foodServing}>{item.servingSize}</Text>
                  </View>
                  <View style={s.foodMacros}>
                    <Text style={[s.foodCal, { color: colors.primary }]}>{item.calories}</Text>
                    <Text style={s.foodCalLabel}> kcal</Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: colors.border }]} />}
            />
          </>
        ) : (() => {
          const activeFood = scannedProduct ?? selectedFood!;
          const isScanned = !!scannedProduct;
          return (
            <View style={s.detailContainer}>
              {/* Scanned badge */}
              {isScanned && (
                <View style={[s.scannedBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="check-circle" size={13} color={colors.primary} />
                  <Text style={[s.scannedBadgeText, { color: colors.primary }]}>Scanned from barcode</Text>
                  {scannedProduct!.brand.length > 0 && (
                    <Text style={[s.scannedBrand, { color: colors.mutedForeground }]}>· {scannedProduct!.brand}</Text>
                  )}
                </View>
              )}

              {/* Macro pills */}
              <View style={s.macroPills}>
                <View style={[s.pill, { backgroundColor: "#4C9BE820" }]}>
                  <Text style={[s.pillLabel, { color: "#4C9BE8" }]}>P</Text>
                  <Text style={[s.pillValue, { color: "#4C9BE8" }]}>{activeFood.protein}g</Text>
                </View>
                <View style={[s.pill, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[s.pillLabel, { color: colors.primary }]}>C</Text>
                  <Text style={[s.pillValue, { color: colors.primary }]}>{activeFood.carbs}g</Text>
                </View>
                <View style={[s.pill, { backgroundColor: colors.accent + "20" }]}>
                  <Text style={[s.pillLabel, { color: colors.accent }]}>F</Text>
                  <Text style={[s.pillValue, { color: colors.accent }]}>{activeFood.fat}g</Text>
                </View>
              </View>

              <Text style={s.servingNote}>Per {activeFood.servingSize}</Text>

              {/* Quantity */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Servings</Text>
                <View style={s.qtyRow}>
                  <TouchableOpacity
                    style={s.qtyBtn}
                    onPress={() => {
                      const v = Math.max((parseFloat(quantity) || 1) - 0.5, 0.5);
                      setQuantity(v.toString());
                    }}
                  >
                    <Feather name="minus" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                  <TextInput
                    style={s.qtyInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity
                    style={s.qtyBtn}
                    onPress={() => {
                      const v = (parseFloat(quantity) || 1) + 0.5;
                      setQuantity(v.toString());
                    }}
                  >
                    <Feather name="plus" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total calories */}
              <View style={[s.totalRow, { backgroundColor: colors.secondary }]}>
                <Text style={s.totalLabel}>Total calories</Text>
                <Text style={[s.totalValue, { color: colors.primary }]}>
                  {Math.round(activeFood.calories * (parseFloat(quantity) || 1))} kcal
                </Text>
              </View>

              {/* Meal type */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Meal</Text>
                <View style={s.mealRow}>
                  {MEAL_TYPES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMealType(m)}
                      style={[s.mealChip, { backgroundColor: mealType === m ? colors.primary : colors.secondary }]}
                    >
                      <Text style={[s.mealText, { color: mealType === m ? "#fff" : colors.mutedForeground }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Back + Add */}
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={s.backBtn}
                  onPress={() => { setSelectedFood(null); setScannedProduct(null); }}
                >
                  <Feather name="arrow-left" size={18} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
                  <Text style={s.addBtnText}>Add Food</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </View>

      <BarcodeScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProduct={(p) => { handleScannedProduct(p); setScannerOpen(false); }}
      />
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
    title: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground },
    closeBtn: { padding: 4 },
    scanBarcodeBtn: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 4, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, gap: 12 },
    scanIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    scanBtnLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    scanBtnSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
    orDivider: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginVertical: 12, gap: 8 },
    orLine: { flex: 1, height: StyleSheet.hairlineWidth },
    orText: { fontSize: 12, fontFamily: "Inter_400Regular" },
    scannedBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 14 },
    scannedBadgeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    scannedBrand: { fontSize: 12, fontFamily: "Inter_400Regular" },
    searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
    searchInput: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
    catList: { marginBottom: 8, maxHeight: 40 },
    catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, height: 32, justifyContent: "center" },
    catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    foodItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
    foodInfo: { flex: 1 },
    foodName: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground },
    foodServing: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    foodMacros: { flexDirection: "row", alignItems: "baseline" },
    foodCal: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    foodCalLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    sep: { height: StyleSheet.hairlineWidth },
    detailContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
    macroPills: { flexDirection: "row", gap: 8, marginBottom: 8 },
    pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
    pillLabel: { fontSize: 12, fontFamily: "Inter_700Bold" },
    pillValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    servingNote: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 24 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    qtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    qtyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
    qtyInput: { flex: 1, textAlign: "center", fontSize: 22, fontFamily: "Inter_600SemiBold", color: colors.foreground, backgroundColor: colors.secondary, borderRadius: 12, paddingVertical: 10 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 12, marginBottom: 20 },
    totalLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground },
    totalValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
    mealRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    mealChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    mealText: { fontSize: 14, fontFamily: "Inter_500Medium" },
    actionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: "auto" as any, paddingBottom: 20 },
    backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
    addBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    addBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });
}
