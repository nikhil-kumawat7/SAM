import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface MacroBarsProps {
  protein: number;
  carbs: number;
  fat: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
}

function MacroBar({
  label,
  current,
  goal,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
}) {
  const colors = useColors();
  const progress = Math.min(current / Math.max(goal, 1), 1);

  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: colors.foreground }]}>
          {current}
          <Text style={[styles.macroGoal, { color: colors.mutedForeground }]}>/{goal}g</Text>
        </Text>
      </View>
      <View style={[styles.trackBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fillBar,
            { width: `${progress * 100}%` as any, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export default function MacroBars({
  protein,
  carbs,
  fat,
  goalProtein,
  goalCarbs,
  goalFat,
}: MacroBarsProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <MacroBar label="Protein" current={protein} goal={goalProtein} color="#4C9BE8" />
      <MacroBar label="Carbs" current={carbs} goal={goalCarbs} color={colors.primary} />
      <MacroBar label="Fat" current={fat} goal={goalFat} color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  macroItem: {
    gap: 6,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  macroValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  macroGoal: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  trackBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fillBar: {
    height: 6,
    borderRadius: 3,
  },
});
