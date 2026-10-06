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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/context/FitnessContext";
import { fetchTargetSpecificExercises } from "@/lib/api";
import CalorieRing from "@/components/CalorieRing";
import MacroBars from "@/components/MacroBars";
import FoodModal from "@/components/FoodModal";
import WorkoutModal from "@/components/WorkoutModal";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function Dashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, today, getDayLog, getDayCalories, getDayMacros, addFood, addWorkout } = useFitness();
  const [foodModal, setFoodModal] = useState(false);
  const [workoutModal, setWorkoutModal] = useState(false);

  const cal = getDayCalories(today);
  const macros = getDayMacros(today);
  const log = getDayLog(today);
  const recentFoods = log.foods.slice(-4).reverse();
  const recentWorkouts = log.workouts.slice(-3).reverse();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleApiDemo = async () => {
    setIsDemoLoading(true);
    try {
      const results = await fetchTargetSpecificExercises("abdominal head of the pectoralis major");
      Alert.alert(
        "API Success!",
        `Found ${results.length} exercises.\n\n` + JSON.stringify(results, null, 2)
      );
    } catch (e: any) {
      Alert.alert("API Error", e.message + "\n\nNote: Deploy the AWS SAM template first!");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const s = makeStyles(colors);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[s.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()},</Text>
            <Text style={s.name}>{profile?.name ?? "Athlete"}</Text>
          </View>
          <View style={[s.calGoalBadge, { backgroundColor: colors.card }]}>
            <Feather name="target" size={13} color={colors.primary} />
            <Text style={[s.calGoalText, { color: colors.mutedForeground }]}>
              {(profile?.goalCalories ?? 2000).toLocaleString()} goal
            </Text>
          </View>
        </View>

        <Text style={s.dateText}>{formatDate(today)}</Text>

        {/* Calorie Ring */}
        <View style={s.ringContainer}>
          <CalorieRing
            consumed={cal.consumed}
            burned={cal.burned}
            goal={profile?.goalCalories ?? 2000}
            size={220}
          />
        </View>

        {/* Net cal summary */}
        <View style={[s.netRow, { backgroundColor: colors.card }]}>
          <View style={s.netItem}>
            <Text style={[s.netValue, { color: colors.foreground }]}>{profile?.goalCalories ?? 2000}</Text>
            <Text style={s.netLabel}>Goal</Text>
          </View>
          <View style={[s.netDivider, { backgroundColor: colors.border }]} />
          <View style={s.netItem}>
            <Text style={[s.netValue, { color: colors.primary }]}>{cal.consumed}</Text>
            <Text style={s.netLabel}>Food</Text>
          </View>
          <View style={[s.netDivider, { backgroundColor: colors.border }]} />
          <View style={s.netItem}>
            <Text style={[s.netValue, { color: colors.accent }]}>{cal.burned}</Text>
            <Text style={s.netLabel}>Exercise</Text>
          </View>
          <View style={[s.netDivider, { backgroundColor: colors.border }]} />
          <View style={s.netItem}>
            <Text style={[s.netValue, { color: cal.net > (profile?.goalCalories ?? 2000) ? colors.destructive : colors.foreground }]}>
              {cal.net}
            </Text>
            <Text style={s.netLabel}>Net</Text>
          </View>
        </View>

        {/* Macros */}
        <Text style={s.sectionTitle}>Macros</Text>
        <MacroBars
          protein={macros.protein}
          carbs={macros.carbs}
          fat={macros.fat}
          goalProtein={profile?.goalProtein ?? 150}
          goalCarbs={profile?.goalCarbs ?? 200}
          goalFat={profile?.goalFat ?? 65}
        />

        {/* Quick actions */}
        <View style={s.quickActions}>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: colors.primary }]}
            onPress={() => setFoodModal(true)}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={s.quickBtnText}>Add Food</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: colors.accent }]}
            onPress={() => setWorkoutModal(true)}
          >
            <Feather name="activity" size={16} color={colors.accentForeground} />
            <Text style={[s.quickBtnText, { color: colors.accentForeground }]}>Log Workout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Professor Demo Action */}
        <View style={[s.quickActions, { marginTop: 10 }]}>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: colors.secondary }]}
            onPress={handleApiDemo}
            disabled={isDemoLoading}
          >
            <Feather name="cloud" size={16} color={colors.foreground} />
            <Text style={[s.quickBtnText, { color: colors.foreground }]}>
              {isDemoLoading ? "Loading..." : "Test Epic 1 API"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent meals */}
        {recentFoods.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Recent Meals</Text>
            <View style={[s.listCard, { backgroundColor: colors.card }]}>
              {recentFoods.map((f, i) => (
                <View key={f.id}>
                  {i > 0 && <View style={[s.sep, { backgroundColor: colors.border }]} />}
                  <View style={s.logItem}>
                    <View style={[s.mealDot, { backgroundColor: colors.primary + "30" }]}>
                      <Feather name="coffee" size={14} color={colors.primary} />
                    </View>
                    <View style={s.logInfo}>
                      <Text style={s.logName} numberOfLines={1}>{f.name}</Text>
                      <Text style={s.logSub}>{f.mealType} · {f.servingSize} × {f.quantity}</Text>
                    </View>
                    <Text style={[s.logCal, { color: colors.primary }]}>
                      {Math.round(f.calories * f.quantity)} kcal
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recent workouts */}
        {recentWorkouts.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Recent Workouts</Text>
            <View style={[s.listCard, { backgroundColor: colors.card }]}>
              {recentWorkouts.map((w, i) => (
                <View key={w.id}>
                  {i > 0 && <View style={[s.sep, { backgroundColor: colors.border }]} />}
                  <View style={s.logItem}>
                    <View style={[s.mealDot, { backgroundColor: colors.accent + "30" }]}>
                      <Feather name="zap" size={14} color={colors.accent} />
                    </View>
                    <View style={s.logInfo}>
                      <Text style={s.logName}>{w.name}</Text>
                      <Text style={s.logSub}>{w.duration} min</Text>
                    </View>
                    <Text style={[s.logCal, { color: colors.accent }]}>-{w.caloriesBurned} kcal</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {recentFoods.length === 0 && recentWorkouts.length === 0 && (
          <View style={s.emptyState}>
            <Feather name="sunrise" size={36} color={colors.border} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Start your day by logging a meal</Text>
          </View>
        )}
      </ScrollView>

      <FoodModal visible={foodModal} onClose={() => setFoodModal(false)} onAdd={(e) => addFood(today, e)} />
      <WorkoutModal visible={workoutModal} onClose={() => setWorkoutModal(false)} onAdd={(e) => addWorkout(today, e)} />
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    scroll: { paddingHorizontal: 16 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
    greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    name: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: -0.5 },
    calGoalBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    calGoalText: { fontSize: 12, fontFamily: "Inter_500Medium" },
    dateText: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 20 },
    ringContainer: { alignItems: "center", marginBottom: 20 },
    netRow: { flexDirection: "row", borderRadius: 16, padding: 16, marginBottom: 20 },
    netItem: { flex: 1, alignItems: "center", gap: 4 },
    netDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
    netValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
    netLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 10, marginTop: 20 },
    quickActions: { flexDirection: "row", gap: 10, marginTop: 20 },
    quickBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 14 },
    quickBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
    listCard: { borderRadius: 16, overflow: "hidden" },
    logItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
    mealDot: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    logInfo: { flex: 1 },
    logName: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    logSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    logCal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    sep: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
    emptyState: { alignItems: "center", gap: 12, paddingVertical: 40 },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  });
}
