import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    let user = null;
    let bearerToken: string | null = null;

    // Prefer bearer token when available (client-side login timing can race cookie propagation).
    const authHeader = request.headers.get("authorization");
    bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (bearerToken) {
      const tokenClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const {
        data: { user: tokenUser },
      } = await tokenClient.auth.getUser(bearerToken);
      user = tokenUser;
    }

    if (!user) {
      const supabase = await createServerClient();
      const {
        data: { user: cookieUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !cookieUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      user = cookieUser;
    }

    type Membership = {
      id: string;
      org_id: string;
      user_id: string;
      role: string;
      joined_at: string;
    };
    let memberships: Membership[] = [];

    if (bearerToken) {
      const membershipClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          },
        },
      );

      const { data, error } = await membershipClient
        .from("org_members")
        .select("id, org_id, user_id, role, joined_at")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (error) {
        console.error("Error loading org memberships with bearer:", error);
      } else {
        memberships = (data as Membership[]) || [];
      }
    }

    if (!memberships.length) {
      const cookieClient = await createServerClient();
      const { data, error } = await cookieClient
        .from("org_members")
        .select("id, org_id, user_id, role, joined_at")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (error) {
        console.error("Error loading org memberships with cookie:", error);
      } else {
        memberships = (data as Membership[]) || [];
      }
    }

    if (!memberships.length) {
      return NextResponse.json({ memberships: [] });
    }

    const orgIds = Array.from(new Set(memberships.map((m) => m.org_id)));

    let organizations: any[] = [];
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const serviceClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );

      const { data, error } = await serviceClient
        .from("organizations")
        .select("id, name, created_at")
        .in("id", orgIds);

      if (error) {
        console.error("Error loading organizations with service role:", error);
      } else {
        organizations = data || [];
      }
    }

    // Fallback in case service role key is unavailable.
    if (!organizations.length && bearerToken) {
      const userClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
            },
          },
        },
      );

      const { data } = await userClient
        .from("organizations")
        .select("id, name, created_at")
        .in("id", orgIds);
      organizations = data || [];
    }

    const organizationsById = new Map(
      organizations.map((org) => [org.id, org]),
    );
    const normalized = memberships
      .map((member) => {
        const organization = organizationsById.get(member.org_id);
        if (!organization) return null;

        return {
          ...member,
          organizations: organization,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    return NextResponse.json({ memberships: normalized });
  } catch (error) {
    console.error("Error loading organizations:", error);
    // Fail-soft to prevent client boot failures during transient backend/auth issues.
    return NextResponse.json({ memberships: [] });
  }
}
