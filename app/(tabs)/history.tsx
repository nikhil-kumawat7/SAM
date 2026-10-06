import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/context/FitnessContext";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
  return days;
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logs, getDayCalories, getDayMacros, profile } = useFitness();
  const todayDate = new Date();

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(getDateStr(todayDate));

  const calendarDays = getCalendarDays(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    const now = todayDate;
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) return;
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  }

  const selCal = getDayCalories(selectedDate);
  const selMacros = getDayMacros(selectedDate);
  const selLog = logs[selectedDate];
  const hasData = selLog && (selLog.foods.length > 0 || selLog.workouts.length > 0);
  const goal = profile?.goalCalories ?? 2000;

  const s = makeStyles(colors);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[s.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.pageTitle}>History</Text>

      {/* Month nav */}
      <View style={[s.monthNav, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={s.navBtn}
          disabled={viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth()}
        >
          <Feather name="chevron-right" size={20} color={
            viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth()
              ? colors.border : colors.foreground
          } />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={s.dayHeaders}>
        {DAYS.map((d) => (
          <Text key={d} style={[s.dayHeader, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={[s.calGrid, { backgroundColor: colors.card }]}>
        {calendarDays.map((date, i) => {
          if (!date) return <View key={`empty-${i}`} style={s.calCell} />;
          const dateStr = getDateStr(date);
          const isToday = dateStr === getDateStr(todayDate);
          const isSelected = dateStr === selectedDate;
          const dayLog = logs[dateStr];
          const hasFoods = dayLog && dayLog.foods.length > 0;
          const hasWorkouts = dayLog && dayLog.workouts.length > 0;
          const isFuture = date > todayDate;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[s.calCell, isSelected && { backgroundColor: colors.primary, borderRadius: 12 }]}
              onPress={() => !isFuture && setSelectedDate(dateStr)}
              disabled={isFuture}
            >
              <Text style={[
                s.calDate,
                { color: isFuture ? colors.border : isSelected ? "#fff" : isToday ? colors.primary : colors.foreground },
                isToday && !isSelected && s.todayText,
              ]}>
                {date.getDate()}
              </Text>
              <View style={s.dotRow}>
                {hasFoods && <View style={[s.dot, { backgroundColor: isSelected ? "rgba(255,255,255,0.7)" : colors.primary }]} />}
                {hasWorkouts && <View style={[s.dot, { backgroundColor: isSelected ? "rgba(255,255,255,0.7)" : colors.accent }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day detail */}
      <View style={s.dayDetail}>
        <Text style={s.detailTitle}>
          {(() => {
            const d = new Date(selectedDate + "T00:00:00");
            return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          })()}
        </Text>

        {!hasData ? (
          <View style={[s.noDataCard, { backgroundColor: colors.card }]}>
            <Feather name="calendar" size={28} color={colors.border} />
            <Text style={[s.noDataText, { color: colors.mutedForeground }]}>No data for this day</Text>
          </View>
        ) : (
          <>
            {/* Calorie summary */}
            <View style={[s.summaryCard, { backgroundColor: colors.card }]}>
              <View style={s.summaryRow}>
                <Text style={s.summaryCardTitle}>Calories</Text>
                <View style={[s.goalBadge, { backgroundColor: selCal.consumed > goal ? colors.destructive + "20" : colors.primary + "20" }]}>
                  <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: selCal.consumed > goal ? colors.destructive : colors.primary }}>
                    {selCal.consumed > goal ? "Over" : "Under"} goal
                  </Text>
                </View>
              </View>
              <View style={s.calRow}>
                <View style={s.calStat}>
                  <Text style={[s.calBig, { color: colors.primary }]}>{selCal.consumed}</Text>
                  <Text style={s.calSmall}>eaten</Text>
                </View>
                <Feather name="minus" size={16} color={colors.border} />
                <View style={s.calStat}>
                  <Text style={[s.calBig, { color: colors.accent }]}>{selCal.burned}</Text>
                  <Text style={s.calSmall}>burned</Text>
                </View>
                <Feather name="equal" size={16} color={colors.border} />
                <View style={s.calStat}>
                  <Text style={[s.calBig, { color: colors.foreground }]}>{selCal.net}</Text>
                  <Text style={s.calSmall}>net</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={[s.calTrack, { backgroundColor: colors.border }]}>
                <View style={[s.calFill, {
                  width: `${Math.min(selCal.consumed / goal * 100, 100)}%` as any,
                  backgroundColor: selCal.consumed > goal ? colors.destructive : colors.primary,
                }]} />
              </View>
              <Text style={[s.calGoalText, { color: colors.mutedForeground }]}>Goal: {goal} kcal</Text>
            </View>

            {/* Macros */}
            {selLog.foods.length > 0 && (
              <View style={[s.macroCard, { backgroundColor: colors.card }]}>
                <Text style={s.summaryCardTitle}>Macros</Text>
                <View style={s.macroGrid}>
                  {[
                    { label: "Protein", val: selMacros.protein, goal: profile?.goalProtein ?? 150, color: "#4C9BE8" },
                    { label: "Carbs", val: selMacros.carbs, goal: profile?.goalCarbs ?? 200, color: colors.primary },
                    { label: "Fat", val: selMacros.fat, goal: profile?.goalFat ?? 65, color: colors.accent },
                  ].map((m) => (
                    <View key={m.label} style={s.macroBlock}>
                      <Text style={[s.macroVal, { color: m.color }]}>{m.val}g</Text>
                      <Text style={s.macroLabel}>{m.label}</Text>
                      <View style={[s.macroTrack, { backgroundColor: colors.border }]}>
                        <View style={[s.macroFill, {
                          width: `${Math.min(m.val / m.goal * 100, 100)}%` as any,
                          backgroundColor: m.color,
                        }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Workouts */}
            {selLog && selLog.workouts.length > 0 && (
              <View style={[s.workoutsCard, { backgroundColor: colors.card }]}>
                <Text style={s.summaryCardTitle}>Workouts</Text>
                {selLog.workouts.map((w, i) => (
                  <View key={w.id}>
                    {i > 0 && <View style={[s.sep, { backgroundColor: colors.border }]} />}
                    <View style={s.wRow}>
                      <View style={[s.wIcon, { backgroundColor: colors.accent + "20" }]}>
                        <Feather name="activity" size={14} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.wName}>{w.name}</Text>
                        <Text style={s.wSub}>{w.duration} min</Text>
                      </View>
                      <Text style={[s.wCal, { color: colors.accent }]}>-{w.caloriesBurned} kcal</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    scroll: { paddingHorizontal: 16 },
    pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: -0.5, marginBottom: 16 },
    monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, padding: 12, marginBottom: 8 },
    navBtn: { padding: 4 },
    monthLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    dayHeaders: { flexDirection: "row", marginBottom: 4 },
    dayHeader: { flex: 1, textAlign: "center", fontSize: 12, fontFamily: "Inter_500Medium" },
    calGrid: { flexDirection: "row", flexWrap: "wrap", borderRadius: 16, padding: 8, marginBottom: 20 },
    calCell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 },
    calDate: { fontSize: 14, fontFamily: "Inter_500Medium" },
    todayText: { fontFamily: "Inter_700Bold" },
    dotRow: { flexDirection: "row", gap: 2, marginTop: 2 },
    dot: { width: 4, height: 4, borderRadius: 2 },
    dayDetail: { gap: 12 },
    detailTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    noDataCard: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10 },
    noDataText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    summaryCard: { borderRadius: 16, padding: 16, gap: 12 },
    summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    summaryCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    goalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    calRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    calStat: { alignItems: "center", gap: 2 },
    calBig: { fontSize: 24, fontFamily: "Inter_700Bold" },
    calSmall: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    calTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
    calFill: { height: 6, borderRadius: 3 },
    calGoalText: { fontSize: 12, fontFamily: "Inter_400Regular" },
    macroCard: { borderRadius: 16, padding: 16 },
    macroGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
    macroBlock: { flex: 1, gap: 4 },
    macroVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
    macroLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    macroTrack: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 2 },
    macroFill: { height: 4, borderRadius: 2 },
    workoutsCard: { borderRadius: 16, padding: 16, gap: 12 },
    wRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
    wIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    wName: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    wSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    wCal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    sep: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  });
}
