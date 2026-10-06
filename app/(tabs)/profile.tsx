import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness, UserProfile } from "@/context/FitnessContext";
import { supabase } from "@/lib/supabase";

const GOALS = [
  { id: "lose", label: "Lose Weight", calories: 1600, protein: 120, carbs: 160, fat: 53 },
  { id: "maintain", label: "Maintain", calories: 2000, protein: 150, carbs: 200, fat: 65 },
  { id: "gain", label: "Gain Muscle", calories: 2500, protein: 188, carbs: 250, fat: 83 },
  { id: "performance", label: "Performance", calories: 2800, protein: 210, carbs: 350, fat: 78 },
];

function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.statValue, { color }]}>{value}<Text style={[styles.statUnit, { color: colors.mutedForeground }]}>{unit}</Text></Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, setProfile, logs, getDayCalories } = useFitness();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserProfile>(profile ?? {
    name: "Athlete", age: 25, weight: 75, height: 175,
    goalCalories: 2000, goalProtein: 150, goalCarbs: 200, goalFat: 65, unit: "metric",
  });

  // Weekly stats
  const weekDays: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    weekDays.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  const weekCal = weekDays.reduce((s, d) => s + getDayCalories(d).consumed, 0);
  const weekBurned = weekDays.reduce((s, d) => s + getDayCalories(d).burned, 0);
  const activeDays = weekDays.filter((d) => {
    const l = logs[d];
    return l && (l.foods.length > 0 || l.workouts.length > 0);
  }).length;

  const totalDays = Object.keys(logs).length;
  const totalCal = Object.keys(logs).reduce((s, d) => s + getDayCalories(d).consumed, 0);

  async function saveProfile() {
    await setProfile(form);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(false);
  }

  function applyGoal(g: typeof GOALS[0]) {
    setForm((f) => ({ ...f, goalCalories: g.calories, goalProtein: g.protein, goalCarbs: g.carbs, goalFat: g.fat }));
  }

  const bmi = profile ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : "–";

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
        <View style={s.profileHeader}>
          <View style={[s.avatar, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[s.avatarText, { color: colors.primary }]}>
              {(profile?.name ?? "A").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{profile?.name ?? "Athlete"}</Text>
            <Text style={[s.profileSub, { color: colors.mutedForeground }]}>
              {profile?.age}y · {profile?.weight}kg · {profile?.height}cm
            </Text>
          </View>
          <TouchableOpacity
            style={[s.editBtn, { backgroundColor: colors.secondary }]}
            onPress={() => { setForm(profile ?? form); setEditing(true); }}
          >
            <Feather name="edit-2" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.editBtn, { backgroundColor: colors.secondary }]}
            onPress={() => supabase.auth.signOut()}
          >
            <Feather name="log-out" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* BMI + stats row */}
        <View style={s.statsRow}>
          <StatCard label="BMI" value={bmi} color={colors.primary} />
          <StatCard label="Goal" value={(profile?.goalCalories ?? 2000).toLocaleString()} unit=" kcal" color={colors.accent} />
          <StatCard label="Total Days" value={totalDays} color={colors.foreground} />
        </View>

        {/* Weekly summary */}
        <Text style={s.sectionTitle}>This Week</Text>
        <View style={[s.weekCard, { backgroundColor: colors.card }]}>
          <View style={s.weekRow}>
            <View style={s.weekStat}>
              <Text style={[s.weekVal, { color: colors.primary }]}>{weekCal.toLocaleString()}</Text>
              <Text style={[s.weekLabel, { color: colors.mutedForeground }]}>kcal eaten</Text>
            </View>
            <View style={[s.weekDiv, { backgroundColor: colors.border }]} />
            <View style={s.weekStat}>
              <Text style={[s.weekVal, { color: colors.accent }]}>{weekBurned.toLocaleString()}</Text>
              <Text style={[s.weekLabel, { color: colors.mutedForeground }]}>kcal burned</Text>
            </View>
            <View style={[s.weekDiv, { backgroundColor: colors.border }]} />
            <View style={s.weekStat}>
              <Text style={[s.weekVal, { color: colors.foreground }]}>{activeDays}/7</Text>
              <Text style={[s.weekLabel, { color: colors.mutedForeground }]}>active days</Text>
            </View>
          </View>

          {/* Day activity bar */}
          <View style={s.dayBars}>
            {weekDays.map((d, i) => {
              const dayCal = getDayCalories(d).consumed;
              const height = Math.max(Math.min((dayCal / (profile?.goalCalories ?? 2000)) * 40, 44), 4);
              const dayName = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][new Date(d + "T00:00:00").getDay()];
              const isToday = i === 6;
              return (
                <View key={d} style={s.dayBar}>
                  <View style={[s.dayBarTrack, { backgroundColor: colors.border }]}>
                    <View style={[s.dayBarFill, {
                      height,
                      backgroundColor: dayCal > 0 ? (isToday ? colors.primary : colors.primary + "70") : "transparent",
                    }]} />
                  </View>
                  <Text style={[s.dayBarLabel, { color: isToday ? colors.primary : colors.mutedForeground }]}>{dayName}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Targets */}
        <Text style={s.sectionTitle}>Daily Targets</Text>
        <View style={[s.targetsCard, { backgroundColor: colors.card }]}>
          {[
            { label: "Calories", value: `${profile?.goalCalories ?? 2000} kcal`, color: colors.primary },
            { label: "Protein", value: `${profile?.goalProtein ?? 150}g`, color: "#4C9BE8" },
            { label: "Carbs", value: `${profile?.goalCarbs ?? 200}g`, color: colors.primary },
            { label: "Fat", value: `${profile?.goalFat ?? 65}g`, color: colors.accent },
          ].map((t, i) => (
            <View key={t.label}>
              {i > 0 && <View style={[s.sep, { backgroundColor: colors.border }]} />}
              <View style={s.targetRow}>
                <Text style={[s.targetLabel, { color: colors.foreground }]}>{t.label}</Text>
                <Text style={[s.targetValue, { color: t.color }]}>{t.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* All-time stats */}
        <Text style={s.sectionTitle}>All Time</Text>
        <View style={[s.weekCard, { backgroundColor: colors.card }]}>
          <View style={s.weekRow}>
            <View style={s.weekStat}>
              <Text style={[s.weekVal, { color: colors.foreground }]}>{totalDays}</Text>
              <Text style={[s.weekLabel, { color: colors.mutedForeground }]}>days tracked</Text>
            </View>
            <View style={[s.weekDiv, { backgroundColor: colors.border }]} />
            <View style={s.weekStat}>
              <Text style={[s.weekVal, { color: colors.primary }]}>{(totalCal / 1000).toFixed(1)}k</Text>
              <Text style={[s.weekLabel, { color: colors.mutedForeground }]}>kcal eaten</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(false)}>
        <View style={[s.modal, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? insets.top + 20 : 20 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            <View style={s.formSection}>
              <Text style={s.formLabel}>Name</Text>
              <TextInput style={s.formInput} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
            </View>
            <View style={s.formRow}>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.formLabel}>Age</Text>
                <TextInput style={s.formInput} value={String(form.age)} onChangeText={(v) => setForm((f) => ({ ...f, age: parseInt(v) || 0 }))} keyboardType="number-pad" />
              </View>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.formLabel}>Weight (kg)</Text>
                <TextInput style={s.formInput} value={String(form.weight)} onChangeText={(v) => setForm((f) => ({ ...f, weight: parseFloat(v) || 0 }))} keyboardType="decimal-pad" />
              </View>
              <View style={[s.formSection, { flex: 1 }]}>
                <Text style={s.formLabel}>Height (cm)</Text>
                <TextInput style={s.formInput} value={String(form.height)} onChangeText={(v) => setForm((f) => ({ ...f, height: parseFloat(v) || 0 }))} keyboardType="decimal-pad" />
              </View>
            </View>

            <Text style={s.formLabel}>Goal Preset</Text>
            <View style={s.goalGrid}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[s.goalChip, { backgroundColor: form.goalCalories === g.calories ? colors.primary : colors.secondary }]}
                  onPress={() => applyGoal(g)}
                >
                  <Text style={[s.goalChipText, { color: form.goalCalories === g.calories ? "#fff" : colors.mutedForeground }]}>{g.label}</Text>
                  <Text style={[s.goalChipCal, { color: form.goalCalories === g.calories ? "rgba(255,255,255,0.7)" : colors.border }]}>{g.calories}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.formLabel}>Custom Targets</Text>
            <View style={s.formRow}>
              {[
                { key: "goalCalories", label: "Calories", unit: "kcal" },
                { key: "goalProtein", label: "Protein", unit: "g" },
                { key: "goalCarbs", label: "Carbs", unit: "g" },
                { key: "goalFat", label: "Fat", unit: "g" },
              ].map((f) => (
                <View key={f.key} style={[s.formSection, { flex: 1 }]}>
                  <Text style={s.formLabel}>{f.label}</Text>
                  <TextInput
                    style={s.formInput}
                    value={String(form[f.key as keyof UserProfile])}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: parseInt(v) || 0 }))}
                    keyboardType="number-pad"
                  />
                  <Text style={[s.formUnit, { color: colors.mutedForeground }]}>{f.unit}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[s.saveBtn, { backgroundColor: colors.primary }]} onPress={saveProfile}>
              <Text style={s.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  statCard: {},
  statValue: {},
  statUnit: {},
  statLabel: {},
});

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    scroll: { paddingHorizontal: 16 },
    profileHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
    avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 28, fontFamily: "Inter_700Bold" },
    profileName: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: -0.5 },
    profileSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
    editBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 4 },
    statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
    statUnit: { fontSize: 12, fontFamily: "Inter_400Regular" },
    statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 10 },
    weekCard: { borderRadius: 16, padding: 16, marginBottom: 20, gap: 16 },
    weekRow: { flexDirection: "row" },
    weekStat: { flex: 1, alignItems: "center", gap: 4 },
    weekVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
    weekLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
    weekDiv: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
    dayBars: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 60 },
    dayBar: { flex: 1, alignItems: "center", gap: 4 },
    dayBarTrack: { width: "100%", height: 44, borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
    dayBarFill: { width: "100%", borderRadius: 4 },
    dayBarLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
    targetsCard: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
    targetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
    targetLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
    targetValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    sep: { height: StyleSheet.hairlineWidth, marginLeft: 14 },
    modal: { flex: 1, paddingHorizontal: 16 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    formSection: { marginBottom: 14 },
    formRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
    formLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
    formInput: { backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: "Inter_500Medium", color: colors.foreground },
    formUnit: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
    goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    goalChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, minWidth: "45%", gap: 2 },
    goalChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    goalChipCal: { fontSize: 11, fontFamily: "Inter_400Regular" },
    saveBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 10 },
    saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });
}
