export interface WorkoutType {
  id: string;
  name: string;
  caloriesPerMinute: number;
  category: string;
  icon: string;
}

export const WORKOUT_TYPES: WorkoutType[] = [
  { id: "1", name: "Running", caloriesPerMinute: 11.4, category: "Cardio", icon: "trending-up" },
  { id: "2", name: "Walking", caloriesPerMinute: 4.5, category: "Cardio", icon: "arrow-right" },
  { id: "3", name: "Cycling", caloriesPerMinute: 9.5, category: "Cardio", icon: "refresh-cw" },
  { id: "4", name: "Swimming", caloriesPerMinute: 9.0, category: "Cardio", icon: "droplet" },
  { id: "5", name: "Jump Rope", caloriesPerMinute: 12.3, category: "Cardio", icon: "zap" },
  { id: "6", name: "Elliptical", caloriesPerMinute: 8.5, category: "Cardio", icon: "activity" },
  { id: "7", name: "Rowing Machine", caloriesPerMinute: 9.8, category: "Cardio", icon: "anchor" },
  { id: "8", name: "HIIT", caloriesPerMinute: 14.0, category: "Cardio", icon: "zap" },
  { id: "9", name: "Weight Training", caloriesPerMinute: 6.0, category: "Strength", icon: "bar-chart-2" },
  { id: "10", name: "Push-ups", caloriesPerMinute: 7.0, category: "Strength", icon: "arrow-up" },
  { id: "11", name: "Pull-ups", caloriesPerMinute: 7.5, category: "Strength", icon: "chevrons-up" },
  { id: "12", name: "Squats", caloriesPerMinute: 6.5, category: "Strength", icon: "chevrons-down" },
  { id: "13", name: "Deadlifts", caloriesPerMinute: 7.0, category: "Strength", icon: "bar-chart" },
  { id: "14", name: "Bench Press", caloriesPerMinute: 6.0, category: "Strength", icon: "minus" },
  { id: "15", name: "Yoga", caloriesPerMinute: 3.5, category: "Flexibility", icon: "sun" },
  { id: "16", name: "Pilates", caloriesPerMinute: 4.0, category: "Flexibility", icon: "circle" },
  { id: "17", name: "Stretching", caloriesPerMinute: 2.5, category: "Flexibility", icon: "maximize-2" },
  { id: "18", name: "Basketball", caloriesPerMinute: 9.0, category: "Sport", icon: "target" },
  { id: "19", name: "Soccer", caloriesPerMinute: 10.0, category: "Sport", icon: "target" },
  { id: "20", name: "Tennis", caloriesPerMinute: 8.0, category: "Sport", icon: "target" },
  { id: "21", name: "Hiking", caloriesPerMinute: 6.5, category: "Outdoor", icon: "map" },
  { id: "22", name: "Stair Climbing", caloriesPerMinute: 9.0, category: "Cardio", icon: "arrow-up" },
  { id: "23", name: "Dancing", caloriesPerMinute: 6.0, category: "Cardio", icon: "music" },
  { id: "24", name: "Kickboxing", caloriesPerMinute: 11.0, category: "Cardio", icon: "zap" },
];

export const WORKOUT_CATEGORIES = ["All", "Cardio", "Strength", "Flexibility", "Sport", "Outdoor"];
