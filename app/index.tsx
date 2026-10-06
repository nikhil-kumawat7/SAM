import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useFitness } from "@/context/FitnessContext";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const { isOnboarded, loading } = useFitness();
  const colors = useColors();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
