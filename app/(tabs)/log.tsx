import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/context/FitnessContext";
import FoodModal from "@/components/FoodModal";
import WorkoutModal from "@/components/WorkoutModal";

const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { today, getDayLog, getDayCalories, addFood, removeFood, addWorkout, removeWorkout } = useFitness();
  const [foodModal, setFoodModal] = useState(false);
  const [workoutModal, setWorkoutModal] = useState(false);
  const [tab, setTab] = useState<"food" | "workout">("food");

  const log = getDayLog(today);
  const cal = getDayCalories(today);

  const foodsByMeal = MEAL_ORDER.map((meal) => ({
    meal,
    entries: log.foods.filter((f) => f.mealType === meal),
  })).filter((g) => g.entries.length > 0);

  function confirmRemoveFood(id: string, name: string) {
    if (Platform.OS === "web") {
      removeFood(today, id);
      return;
    }
    Alert.alert("Remove Entry", `Remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { removeFood(today, id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } },
    ]);
  }

  function confirmRemoveWorkout(id: string, name: string) {
    if (Platform.OS === "web") {
      removeWorkout(today, id);
      return;
    }
    Alert.alert("Remove Entry", `Remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { removeWorkout(today, id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } },
    ]);
  }

  const s = makeStyles(colors);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <>
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: topPad + 16 }]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Today's Log</Text>
          <TouchableOpacity
            style={[s.addFab, { backgroundColor: tab === "food" ? colors.primary : colors.accent }]}
            onPress={() => tab === "food" ? setFoodModal(true) : setWorkoutModal(true)}
          >
            <Feather name="plus" size={20} color={tab === "food" ? "#fff" : colors.accentForeground} />
          </TouchableOpacity>
        </View>

        {/* Summary bar */}
        <View style={[s.summaryBar, { backgroundColor: colors.card }]}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.primary }]}>{cal.consumed}</Text>
            <Text style={s.summaryLabel}>eaten</Text>
          </View>
          <View style={[s.sumDivider, { backgroundColor: colors.border }]} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.accent }]}>{cal.burned}</Text>
            <Text style={s.summaryLabel}>burned</Text>
          </View>
          <View style={[s.sumDivider, { backgroundColor: colors.border }]} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryVal, { color: colors.foreground }]}>{cal.net}</Text>
            <Text style={s.summaryLabel}>net</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[s.tabBar, { backgroundColor: colors.secondary }]}>
          <TouchableOpacity
            style={[s.tabBtn, { backgroundColor: tab === "food" ? colors.card : "transparent" }]}
            onPress={() => setTab("food")}
          >
            <Feather name="coffee" size={15} color={tab === "food" ? colors.primary : colors.mutedForeground} />
            <Text style={[s.tabText, { color: tab === "food" ? colors.foreground : colors.mutedForeground }]}>
              Food
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tabBtn, { backgroundColor: tab === "workout" ? colors.card : "transparent" }]}
            onPress={() => setTab("workout")}
          >
            <Feather name="activity" size={15} color={tab === "workout" ? colors.accent : colors.mutedForeground} />
            <Text style={[s.tabText, { color: tab === "workout" ? colors.foreground : colors.mutedForeground }]}>
              Workouts
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        >
          {tab === "food" && (
            <>
              {foodsByMeal.length === 0 ? (
                <View style={s.empty}>
                  <Feather name="coffee" size={40} color={colors.border} />
                  <Text style={[s.emptyTitle, { color: colors.foreground }]}>No meals logged</Text>
                  <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Tap + to add your first meal</Text>
                  <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setFoodModal(true)}>
                    <Text style={s.emptyBtnText}>Add Food</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                foodsByMeal.map(({ meal, entries }) => {
                  const mealTotal = entries.reduce((s, f) => s + f.calories * f.quantity, 0);
                  return (
                    <View key={meal} style={s.mealGroup}>
                      <View style={s.mealGroupHeader}>
                        <Text style={s.mealGroupTitle}>{meal}</Text>
                        <Text style={[s.mealGroupCal, { color: colors.primary }]}>{Math.round(mealTotal)} kcal</Text>
                      </View>
                      <View style={[s.listCard, { backgroundColor: colors.card }]}>
                        {entries.map((f, i) => (
                          <View key={f.id}>
                            {i > 0 && <View style={[s.sep, { backgroundColor: colors.border }]} />}
                            <View style={s.entryRow}>
                              <View style={s.entryInfo}>
                                <Text style={s.entryName} numberOfLines={1}>{f.name}</Text>
                                <Text style={s.entrySub}>{f.servingSize} × {f.quantity} · P:{Math.round(f.protein * f.quantity)}g C:{Math.round(f.carbs * f.quantity)}g F:{Math.round(f.fat * f.quantity)}g</Text>
                              </View>
                              <Text style={[s.entryCal, { color: colors.primary }]}>{Math.round(f.calories * f.quantity)}</Text>
                              <TouchableOpacity style={s.removeBtn} onPress={() => confirmRemoveFood(f.id, f.name)}>
                                <Feather name="trash-2" size={15} color={colors.destructive} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {tab === "workout" && (
            <>
              {log.workouts.length === 0 ? (
                <View style={s.empty}>
                  <Feather name="activity" size={40} color={colors.border} />
                  <Text style={[s.emptyTitle, { color: colors.foreground }]}>No workouts logged</Text>
                  <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Log a workout to track your burn</Text>
                  <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.accent }]} onPress={() => setWorkoutModal(true)}>
                    <Text style={[s.emptyBtnText, { color: colors.accentForeground }]}>Log Workout</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={[s.listCard, { backgroundColor: colors.card }]}>
                    {log.workouts.map((w, i) => (
                      <View key={w.id}>
                        {i > 0 && <View style={[s.sep, { backgroundColor: colors.border }]} />}
                        <View style={s.entryRow}>
                          <View style={[s.workoutIcon, { backgroundColor: colors.accent + "20" }]}>
                            <Feather name="activity" size={16} color={colors.accent} />
                          </View>
                          <View style={s.entryInfo}>
                            <Text style={s.entryName}>{w.name}</Text>
                            <Text style={s.entrySub}>{w.duration} min</Text>
                          </View>
                          <Text style={[s.entryCal, { color: colors.accent }]}>-{w.caloriesBurned}</Text>
                          <TouchableOpacity style={s.removeBtn} onPress={() => confirmRemoveWorkout(w.id, w.name)}>
                            <Feather name="trash-2" size={15} color={colors.destructive} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                  <View style={[s.totalWorkout, { backgroundColor: colors.accent + "15" }]}>
                    <Text style={[s.totalWorkoutText, { color: colors.accent }]}>Total burned today</Text>
                    <Text style={[s.totalWorkoutCal, { color: colors.accent }]}>{cal.burned} kcal</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>

      <FoodModal visible={foodModal} onClose={() => setFoodModal(false)} onAdd={(e) => addFood(today, e)} />
      <WorkoutModal visible={workoutModal} onClose={() => setWorkoutModal(false)} onAdd={(e) => addWorkout(today, e)} />
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: -0.5 },
    addFab: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    summaryBar: { flexDirection: "row", borderRadius: 14, padding: 14, marginBottom: 14 },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
    summaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    sumDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
    tabBar: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 16 },
    tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10 },
    tabText: { fontSize: 14, fontFamily: "Inter_500Medium" },
    scroll: { paddingBottom: 40 },
    mealGroup: { marginBottom: 16 },
    mealGroupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingHorizontal: 4 },
    mealGroupTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5 },
    mealGroupCal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    listCard: { borderRadius: 16, overflow: "hidden" },
    entryRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8 },
    entryInfo: { flex: 1 },
    entryName: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    entrySub: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    entryCal: { fontSize: 14, fontFamily: "Inter_600SemiBold", minWidth: 36, textAlign: "right" },
    removeBtn: { padding: 6 },
    sep: { height: StyleSheet.hairlineWidth, marginLeft: 12 },
    workoutIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    totalWorkout: { marginTop: 10, borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    totalWorkoutText: { fontSize: 14, fontFamily: "Inter_500Medium" },
    totalWorkoutCal: { fontSize: 18, fontFamily: "Inter_700Bold" },
    empty: { alignItems: "center", gap: 8, paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    emptyBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });
}
