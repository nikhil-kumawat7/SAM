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
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { WORKOUT_TYPES, WORKOUT_CATEGORIES, WorkoutType } from "@/constants/workouts";
import { WorkoutEntry, useFitness } from "@/context/FitnessContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface WorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: WorkoutEntry) => void;
}

export default function WorkoutModal({ visible, onClose, onAdd }: WorkoutModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useFitness();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<WorkoutType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<WorkoutType | null>(null);
  const [duration, setDuration] = useState("30");

  const weightLbs = profile ? (profile.unit === 'metric' ? profile.weight * 2.20462 : profile.weight) : 160;

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
        const res = await fetch(`https://api.api-ninjas.com/v1/caloriesburned?activity=${encodeURIComponent(debouncedSearch)}&weight=${weightLbs}`, {
          headers: { "X-Api-Key": "ktQng7BSbamSMXvpkieyOEmlFOAcezq8cteOYbGm" }
        });
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const results: WorkoutType[] = data.map((w: any, index) => {
            return {
              id: `api-${index}-${w.name.replace(/\s+/g, '-')}`,
              name: w.name,
              caloriesPerMinute: (w.calories_per_hour || 0) / 60,
              category: "API Result",
              icon: "activity"
            };
          });
          setSearchResults(results);
        }
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsLoading(false);
      }
    }

    searchApi();
  }, [debouncedSearch, weightLbs]);

  const filtered = useMemo(() => {
    if (search.length > 0) {
      return searchResults;
    }
    return WORKOUT_TYPES.filter((w) => category === "All" || w.category === category);
  }, [search, searchResults, category]);

  const caloriesBurned = selected
    ? Math.round(selected.caloriesPerMinute * (parseInt(duration) || 0))
    : 0;

  function handleSelect(w: WorkoutType) {
    Haptics.selectionAsync();
    setSelected(w);
  }

  function handleAdd() {
    if (!selected) return;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    onAdd({
      id,
      workoutId: selected.id,
      name: selected.name,
      duration: parseInt(duration) || 0,
      caloriesBurned,
      timestamp: Date.now(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  }

  function handleClose() {
    setSearch("");
    setCategory("All");
    setSelected(null);
    setDuration("30");
    onClose();
  }

  const s = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[s.container, { paddingTop: Platform.OS === "web" ? insets.top + 20 : 20 }]}>
        <View style={s.header}>
          <Text style={s.title}>{selected ? selected.name : "Log Workout"}</Text>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {!selected ? (
          <>
            <View style={s.searchRow}>
              <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder="Search workouts..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={WORKOUT_CATEGORIES}
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
                  style={[s.catChip, { backgroundColor: category === item ? colors.accent : colors.secondary }]}
                >
                  <Text style={[s.catText, { color: category === item ? colors.accentForeground : colors.mutedForeground }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            {isLoading && (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={colors.accent} />
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={(w) => w.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.workoutItem} onPress={() => handleSelect(item)}>
                  <View style={[s.iconBox, { backgroundColor: colors.accent + "20" }]}>
                    <Feather name={item.icon as any} size={18} color={colors.accent} />
                  </View>
                  <View style={s.workoutInfo}>
                    <Text style={s.workoutName}>{item.name}</Text>
                    <Text style={s.workoutCategory}>{item.category}</Text>
                  </View>
                  <View style={s.burnRate}>
                    <Text style={[s.burnValue, { color: colors.accent }]}>{item.caloriesPerMinute.toFixed(1)}</Text>
                    <Text style={s.burnUnit}>kcal/min</Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: colors.border }]} />}
            />
          </>
        ) : (
          <View style={s.detailContainer}>
            <View style={[s.burnCard, { backgroundColor: colors.accent + "15" }]}>
              <Text style={[s.burnBig, { color: colors.accent }]}>{caloriesBurned}</Text>
              <Text style={[s.burnCardLabel, { color: colors.accent }]}>kcal burned</Text>
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Duration (minutes)</Text>
              <View style={s.durationRow}>
                {[15, 20, 30, 45, 60, 90].map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDuration(d.toString())}
                    style={[s.durationChip, { backgroundColor: duration === d.toString() ? colors.accent : colors.secondary }]}
                  >
                    <Text style={[s.durationText, { color: duration === d.toString() ? colors.accentForeground : colors.mutedForeground }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.customDurationRow}>
                <TextInput
                  style={[s.customDurationInput, { backgroundColor: colors.secondary, color: colors.foreground }]}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                  placeholder="Custom"
                  placeholderTextColor={colors.mutedForeground}
                />
                <Text style={[s.minLabel, { color: colors.mutedForeground }]}>min</Text>
              </View>
            </View>

            <View style={[s.rateRow, { backgroundColor: colors.secondary }]}>
              <Text style={[s.rateLabel, { color: colors.mutedForeground }]}>Burn rate</Text>
              <Text style={[s.rateValue, { color: colors.foreground }]}>{selected.caloriesPerMinute.toFixed(1)} kcal/min</Text>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity style={s.backBtn} onPress={() => setSelected(null)}>
                <Feather name="arrow-left" size={18} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.accent }]} onPress={handleAdd}>
                <Text style={[s.addBtnText, { color: colors.accentForeground }]}>Log Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
    title: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground },
    closeBtn: { padding: 4 },
    searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
    searchInput: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
    catList: { marginBottom: 8, maxHeight: 40 },
    catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, height: 32, justifyContent: "center" },
    catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    workoutItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    workoutInfo: { flex: 1 },
    workoutName: { fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground },
    workoutCategory: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    burnRate: { alignItems: "flex-end" },
    burnValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    burnUnit: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    sep: { height: StyleSheet.hairlineWidth },
    detailContainer: { flex: 1, paddingHorizontal: 16 },
    burnCard: { borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 28 },
    burnBig: { fontSize: 56, fontFamily: "Inter_700Bold", letterSpacing: -2 },
    burnCardLabel: { fontSize: 15, fontFamily: "Inter_500Medium", marginTop: 4 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
    durationChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    durationText: { fontSize: 14, fontFamily: "Inter_500Medium" },
    customDurationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    customDurationInput: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
    minLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
    rateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 20 },
    rateLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
    rateValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    actionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: "auto" as any, paddingBottom: 20 },
    backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
    addBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    addBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
