import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://faiaaohutuxgfuniwxnc.supabase.co";
const supabaseAnonKey = "sb_publishable_SVwX-p3VmZVe1rX7eV_6WA_dUtADpdW";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
