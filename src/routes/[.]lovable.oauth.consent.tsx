import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthAuthorizationDetails = {
  client?: { name?: string; client_uri?: string; redirect_uri?: string } | null;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};

// Beta auth.oauth namespace — typed wrapper.
const oauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: OAuthAuthorizationDetails | null; error: { message: string } | null }>;
    approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
    denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  };
}).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md bg-card text-card-foreground rounded-3xl p-8 chunky-border">
        <h1 className="text-2xl font-display mb-2">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          Could not load this authorization request: {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as OAuthAuthorizationDetails | null;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-3xl p-8 chunky-border">
        <h1 className="text-3xl font-display mb-2">
          Connect {clientName} to Tonight's pick<span className="text-curtain">.</span>
        </h1>
        <p className="text-muted-foreground mb-4 text-sm">
          {clientName} will be able to act as you inside Tonight — get personalized recommendations,
          read your favorites and history, and save picks on your behalf.
        </p>
        <ul className="space-y-2 mb-6 text-sm">
          <li>• Generate recommendations under your account</li>
          <li>• Read your favorites, history, and taste profile</li>
          <li>• Save or remove favorites</li>
        </ul>
        <p className="text-xs text-muted-foreground mb-6">
          This does not bypass Tonight's permissions. You can revoke access at any time.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive mb-4">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 py-3 rounded-full chunky-border-sm font-semibold bg-card hover:translate-y-[-1px] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 py-3 rounded-full chunky-border-sm font-bold bg-primary text-primary-foreground hover:translate-y-[-1px] transition disabled:opacity-50"
          >
            {busy ? "..." : "Approve"}
          </button>
        </div>
      </div>
    </main>
  );
}