import { useQuery } from "@tanstack/react-query";

import { financeQueryKeys } from "@/hooks/finance-query-keys";
import { useAuth } from "@/hooks/useAuth";
import { supabaseV2, type V2Row } from "@/integrations/supabase/v2";
import { selectPreferredSubscription } from "@/lib/finance/capabilities";

export function useSubscriptionV2() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: financeQueryKeys.subscription(user?.id),
    enabled: Boolean(user) && !loading,
    queryFn: async (): Promise<V2Row<"subscriptions"> | null> => {
      if (!user) return null;
      const { data, error } = await supabaseV2
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return selectPreferredSubscription(data ?? []);
    },
  });
}
