import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/context/FitnessContext";

const GOALS = [
  { id: "lose", label: "Lose Weight", icon: "trending-down", calories: 1600 },
  { id: "maintain", label: "Maintain", icon: "minus", calories: 2000 },
  { id: "gain", label: "Gain Muscle", icon: "trending-up", calories: 2500 },
  { id: "performance", label: "Performance", icon: "zap", calories: 2800 },
];

export default function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useFitness();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("25");
  const [weight, setWeight] = useState("75");
  const [height, setHeight] = useState("175");
  const [goal, setGoal] = useState("maintain");

  const selectedGoal = GOALS.find((g) => g.id === goal)!;

  async function handleFinish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const goalData = GOALS.find((g) => g.id === goal)!;
    await completeOnboarding({
      name: name.trim() || "Athlete",
      age: parseInt(age) || 25,
      weight: parseFloat(weight) || 75,
      height: parseFloat(height) || 175,
      goalCalories: goalData.calories,
      goalProtein: Math.round((goalData.calories * 0.3) / 4),
      goalCarbs: Math.round((goalData.calories * 0.4) / 4),
      goalFat: Math.round((goalData.calories * 0.3) / 9),
      unit: "metric",
    });
    router.replace("/(tabs)");
  }

  const s = makeStyles(colors);

  const steps = [
    // Step 0: Name
    <View key="name" style={s.stepContent}>
      <View style={s.stepHeader}>
        <View style={[s.iconCircle, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="user" size={28} color={colors.primary} />
        </View>
        <Text style={s.stepTitle}>What's your name?</Text>
        <Text style={s.stepSub}>We'll personalize your experience</Text>
      </View>
      <TextInput
        style={s.nameInput}
        placeholder="Your name"
        placeholderTextColor={colors.mutedForeground}
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => nextStep()}
      />
    </View>,

    // Step 1: Stats
    <View key="stats" style={s.stepContent}>
      <View style={s.stepHeader}>
        <View style={[s.iconCircle, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="sliders" size={28} color={colors.primary} />
        </View>
        <Text style={s.stepTitle}>Your stats</Text>
        <Text style={s.stepSub}>Used to calculate your calorie needs</Text>
      </View>
      <View style={s.statsGrid}>
        <View style={s.statBlock}>
          <Text style={s.statBlockLabel}>Age</Text>
          <View style={s.statInputRow}>
            <TextInput
              style={s.statInput}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
            <Text style={s.statUnit}>yrs</Text>
          </View>
        </View>
        <View style={s.statBlock}>
          <Text style={s.statBlockLabel}>Weight</Text>
          <View style={s.statInputRow}>
            <TextInput
              style={s.statInput}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            <Text style={s.statUnit}>kg</Text>
          </View>
        </View>
        <View style={[s.statBlock, { flex: 1 }]}>
          <Text style={s.statBlockLabel}>Height</Text>
          <View style={s.statInputRow}>
            <TextInput
              style={s.statInput}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
            <Text style={s.statUnit}>cm</Text>
          </View>
        </View>
      </View>
    </View>,

    // Step 2: Goal
    <View key="goal" style={s.stepContent}>
      <View style={s.stepHeader}>
        <View style={[s.iconCircle, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="target" size={28} color={colors.primary} />
        </View>
        <Text style={s.stepTitle}>Your goal</Text>
        <Text style={s.stepSub}>Sets your daily calorie target</Text>
      </View>
      <View style={s.goalGrid}>
        {GOALS.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={[
              s.goalCard,
              {
                backgroundColor: goal === g.id ? colors.primary : colors.card,
                borderColor: goal === g.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setGoal(g.id);
            }}
          >
            <Feather name={g.icon as any} size={22} color={goal === g.id ? "#fff" : colors.foreground} />
            <Text style={[s.goalLabel, { color: goal === g.id ? "#fff" : colors.foreground }]}>{g.label}</Text>
            <Text style={[s.goalCals, { color: goal === g.id ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
              {g.calories} kcal
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>,
  ];

  function nextStep() {
    if (step < steps.length - 1) {
      Haptics.selectionAsync();
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function prevStep() {
    if (step > 0) {
      Haptics.selectionAsync();
      setStep(step - 1);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + (Platform.OS === "web" ? 40 : 20), paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Brand */}
        <View style={s.brand}>
          <View style={[s.logoBox, { backgroundColor: colors.primary }]}>
            <Feather name="activity" size={24} color="#fff" />
          </View>
          <Text style={s.brandName}>Apex</Text>
        </View>

        {/* Progress dots */}
        <View style={s.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor: i <= step ? colors.primary : colors.border,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {steps[step]}

        {/* Nav */}
        <View style={s.nav}>
          {step > 0 && (
            <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.secondary }]} onPress={prevStep}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: colors.primary, flex: step > 0 ? 1 : undefined, width: step === 0 ? "100%" as any : undefined }]}
            onPress={nextStep}
          >
            <Text style={s.nextBtnText}>{step < steps.length - 1 ? "Continue" : `Let's Go!`}</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 20 },
    brand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 32 },
    logoBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    brandName: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: -0.5 },
    dots: { flexDirection: "row", gap: 6, marginBottom: 32 },
    dot: { height: 8, borderRadius: 4 },
    stepContent: { flex: 1, marginBottom: 32 },
    stepHeader: { marginBottom: 28, gap: 8 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    stepTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: -0.5 },
    stepSub: { fontSize: 15, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    nameInput: { backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 22, fontFamily: "Inter_500Medium", color: colors.foreground },
    statsGrid: { gap: 12 },
    statBlock: { backgroundColor: colors.card, borderRadius: 14, padding: 16 },
    statBlockLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
    statInputRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
    statInput: { flex: 1, fontSize: 28, fontFamily: "Inter_700Bold", color: colors.foreground },
    statUnit: { fontSize: 16, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    goalGrid: { gap: 12 },
    goalCard: { borderRadius: 14, padding: 18, borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 14 },
    goalLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
    goalCals: { fontSize: 13, fontFamily: "Inter_400Regular" },
    nav: { flexDirection: "row", gap: 12 },
    backBtn: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
    nextBtn: { height: 52, borderRadius: 26, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 },
    nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  });
}
