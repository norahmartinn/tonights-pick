import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { AVATAR_IDS } from "@/lib/avatars";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const [{ count: favCount }, { count: histCount }] = await Promise.all([
      context.supabase.from("favorites").select("id", { count: "exact", head: true }),
      context.supabase.from("history").select("id", { count: "exact", head: true }),
    ]);

    return {
      profile,
      email: context.claims?.email ?? null,
      favoritesCount: favCount ?? 0,
      historyCount: histCount ?? 0,
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      display_name: z.string().min(1).max(80),
      avatar_url: z.enum(AVATAR_IDS as [string, ...string[]]).or(z.literal("")).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        avatar_url: data.avatar_url || null,
      })
      .eq("id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });