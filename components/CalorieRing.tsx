import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface CalorieRingProps {
  consumed: number;
  burned: number;
  goal: number;
  size?: number;
}

export default function CalorieRing({ consumed, burned, goal, size = 220 }: CalorieRingProps) {
  const colors = useColors();
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const consumedProgress = Math.min(consumed / goal, 1);
  const burnedProgress = Math.min(burned / (goal * 0.5), 1);

  const consumedOffset = circumference * (1 - consumedProgress);
  const burnedOffset = circumference * (1 - burnedProgress);

  const remaining = Math.max(goal - consumed + burned, 0);
  const isOver = consumed - burned > goal;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />
        {/* Burned calories ring (inner, slightly smaller) */}
        {burned > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius - strokeWidth - 4}
            fill="none"
            stroke={colors.border}
            strokeWidth={10}
          />
        )}
        {burned > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius - strokeWidth - 4}
            fill="none"
            stroke={colors.accent}
            strokeWidth={10}
            strokeDasharray={2 * Math.PI * (radius - strokeWidth - 4)}
            strokeDashoffset={2 * Math.PI * (radius - strokeWidth - 4) * (1 - burnedProgress)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        )}
        {/* Consumed calories ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isOver ? colors.destructive : colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={consumedOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center text */}
      <View style={[styles.centerContent, { width: size, height: size }]}>
        <Text style={[styles.calorieNumber, { color: isOver ? colors.destructive : colors.foreground }]}>
          {remaining.toLocaleString()}
        </Text>
        <Text style={[styles.calorieLabel, { color: colors.mutedForeground }]}>
          {isOver ? "over goal" : "remaining"}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{consumed.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>eaten</Text>
          </View>
          {burned > 0 && (
            <>
              <View style={[styles.statDot, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.accent }]}>{burned.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>burned</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  calorieNumber: {
    fontSize: 42,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  calorieLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  divider: {
    width: 40,
    height: 1,
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
