import { supabase } from "../lib/supabase-client";
import { PostgrestError } from "@supabase/supabase-js";

export async function switchOrganization(
  userId: string,
  orgId: string,
): Promise<{ success: boolean; error?: PostgrestError | string }> {
  try {
    const { error } = await supabase
      .from("org_members")
      .update({ org_id: orgId })
      .eq("user_id", userId);
    if (error) return { success: false, error };
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown switch organization error",
    };
  }
}
