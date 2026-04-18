import { supabase } from "../../../lib/supabase-client";

export async function useSignOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    localStorage.removeItem("currentOrgId");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown sign-out error",
    };
  }
}
