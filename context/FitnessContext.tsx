import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  goalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  unit: "metric" | "imperial";
}

export interface FoodEntry {
  id: string;
  foodId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  quantity: number;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  timestamp: number;
}

export interface WorkoutEntry {
  id: string;
  workoutId: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  timestamp: number;
}

export interface DayLog {
  date: string;
  foods: FoodEntry[];
  workouts: WorkoutEntry[];
}

interface FitnessContextType {
  session: Session | null;
  profile: UserProfile | null;
  isOnboarded: boolean;
  logs: Record<string, DayLog>;
  today: string;
  loading: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  addFood: (date: string, entry: FoodEntry) => Promise<void>;
  removeFood: (date: string, entryId: string) => Promise<void>;
  addWorkout: (date: string, entry: WorkoutEntry) => Promise<void>;
  removeWorkout: (date: string, entryId: string) => Promise<void>;
  getDayLog: (date: string) => DayLog;
  getDayCalories: (date: string) => { consumed: number; burned: number; net: number };
  getDayMacros: (date: string) => { protein: number; carbs: number; fat: number };
}

const FitnessContext = createContext<FitnessContextType | null>(null);

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [loading, setLoading] = useState(true);
  const today = getToday();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
      else setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        fetchUserData(session.user.id);
      } else {
        setProfileState(null);
        setIsOnboarded(false);
        setLogs({});
        setLoading(false);
      }
    });
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileData) {
        setProfileState({
          name: profileData.name,
          age: profileData.age,
          weight: profileData.weight,
          height: profileData.height,
          goalCalories: profileData.goal_calories,
          goalProtein: profileData.goal_protein,
          goalCarbs: profileData.goal_carbs,
          goalFat: profileData.goal_fat,
          unit: profileData.unit as any,
        });
        setIsOnboarded(true);
      } else {
        setProfileState(null);
        setIsOnboarded(false);
      }

      // Fetch Logs
      const { data: logsData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId);

      if (logsData) {
        const nextLogs: Record<string, DayLog> = {};
        logsData.forEach(l => {
          nextLogs[l.log_date] = {
            date: l.log_date,
            foods: l.foods || [],
            workouts: l.workouts || []
          };
        });
        setLogs(nextLogs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const persistProfile = async (p: UserProfile) => {
    if (!session) return;
    await supabase.from('profiles').upsert({
      id: session.user.id,
      name: p.name,
      age: p.age,
      weight: p.weight,
      height: p.height,
      goal_calories: p.goalCalories,
      goal_protein: p.goalProtein,
      goal_carbs: p.goalCarbs,
      goal_fat: p.goalFat,
      unit: p.unit,
    });
  };

  const persistLog = async (date: string, nextLog: DayLog) => {
    if (!session) return;
    await supabase.from('daily_logs').upsert({
      user_id: session.user.id,
      log_date: date,
      foods: nextLog.foods,
      workouts: nextLog.workouts
    });
  };

  const setProfile = useCallback(async (p: UserProfile) => {
    setProfileState(p);
    await persistProfile(p);
  }, [session]);

  const completeOnboarding = useCallback(async (p: UserProfile) => {
    setProfileState(p);
    setIsOnboarded(true);
    await persistProfile(p);
  }, [session]);

  const addFood = useCallback(async (date: string, entry: FoodEntry) => {
    const existing = logs[date] ?? { date, foods: [], workouts: [] };
    const nextLog = { ...existing, foods: [...existing.foods, entry] };
    setLogs(prev => ({ ...prev, [date]: nextLog }));
    await persistLog(date, nextLog);
  }, [logs, session]);

  const removeFood = useCallback(async (date: string, entryId: string) => {
    const existing = logs[date];
    if (!existing) return;
    const nextLog = { ...existing, foods: existing.foods.filter(f => f.id !== entryId) };
    setLogs(prev => ({ ...prev, [date]: nextLog }));
    await persistLog(date, nextLog);
  }, [logs, session]);

  const addWorkout = useCallback(async (date: string, entry: WorkoutEntry) => {
    const existing = logs[date] ?? { date, foods: [], workouts: [] };
    const nextLog = { ...existing, workouts: [...existing.workouts, entry] };
    setLogs(prev => ({ ...prev, [date]: nextLog }));
    await persistLog(date, nextLog);
  }, [logs, session]);

  const removeWorkout = useCallback(async (date: string, entryId: string) => {
    const existing = logs[date];
    if (!existing) return;
    const nextLog = { ...existing, workouts: existing.workouts.filter(w => w.id !== entryId) };
    setLogs(prev => ({ ...prev, [date]: nextLog }));
    await persistLog(date, nextLog);
  }, [logs, session]);

  const getDayLog = useCallback((date: string): DayLog => {
    return logs[date] ?? { date, foods: [], workouts: [] };
  }, [logs]);

  const getDayCalories = useCallback((date: string) => {
    const log = getDayLog(date);
    const consumed = log.foods.reduce((sum, f) => sum + f.calories * f.quantity, 0);
    const burned = log.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    return { consumed: Math.round(consumed), burned: Math.round(burned), net: Math.round(consumed - burned) };
  }, [getDayLog]);

  const getDayMacros = useCallback((date: string) => {
    const log = getDayLog(date);
    return {
      protein: Math.round(log.foods.reduce((sum, f) => sum + f.protein * f.quantity, 0)),
      carbs: Math.round(log.foods.reduce((sum, f) => sum + f.carbs * f.quantity, 0)),
      fat: Math.round(log.foods.reduce((sum, f) => sum + f.fat * f.quantity, 0)),
    };
  }, [getDayLog]);

  return (
    <FitnessContext.Provider value={{
      session,
      profile,
      isOnboarded,
      logs,
      today,
      loading,
      setProfile,
      completeOnboarding,
      addFood,
      removeFood,
      addWorkout,
      removeWorkout,
      getDayLog,
      getDayCalories,
      getDayMacros,
    }}>
      {children}
    </FitnessContext.Provider>
  );
}

export function useFitness() {
  const ctx = useContext(FitnessContext);
  if (!ctx) throw new Error("useFitness must be used inside FitnessProvider");
  return ctx;
}
