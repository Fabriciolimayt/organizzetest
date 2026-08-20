export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type GeneratedTable<
  Row,
  Required extends keyof Row = never,
  Immutable extends keyof Row = never,
  Identity extends keyof Row = never,
> = {
  Row: Row
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required | Identity>>
  Update: Partial<Omit<Row, Immutable | Identity>>
  Relationships: []
}

type AppV2Enums = {
  connection_status: "pending" | "active" | "disabled"
  import_status: "pending" | "processing" | "completed" | "partial" | "skipped" | "failed"
  invitation_status: "pending" | "accepted" | "declined" | "expired" | "revoked"
  job_status: "pending" | "processing" | "retry" | "completed" | "failed"
  job_type: "process_message" | "send_message" | "download_media" | "monthly_report"
  member_role: "owner" | "admin" | "member" | "viewer"
  message_direction: "inbound" | "outbound"
  message_status: "received" | "queued" | "processing" | "sent" | "delivered" | "read" | "failed"
  payment_event_status: "pending" | "processed" | "failed" | "ignored"
  recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly"
  report_status: "pending" | "generating" | "ready" | "failed"
  space_kind: "personal" | "family"
  subscription_status: "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "unpaid"
  transaction_source: "app" | "whatsapp" | "import" | "recurring"
  transaction_status: "pending" | "cleared" | "void"
  transaction_type: "expense" | "income" | "transfer"
}

type AppV2Tables = {
  profiles: GeneratedTable<{
    user_id: string; display_name: string | null; locale: string; currency: string; timezone: string
    onboarding_completed: boolean; onboarding_completed_at: string | null; created_at: string; updated_at: string
  }, "user_id", "user_id" | "created_at">
  spaces: GeneratedTable<{
    id: string; owner_user_id: string; name: string; kind: AppV2Enums["space_kind"]; locale: string
    currency: string; timezone: string; settings: Json; created_at: string; updated_at: string
  }, "owner_user_id" | "name", "id" | "owner_user_id" | "created_at">
  space_members: GeneratedTable<{
    id: string; space_id: string; user_id: string; role: AppV2Enums["member_role"]
    joined_at: string; created_at: string; updated_at: string
  }, "space_id" | "user_id", "id" | "space_id" | "user_id" | "joined_at" | "created_at">
  space_invitations: GeneratedTable<{
    id: string; space_id: string; email: string; role: AppV2Enums["member_role"]
    status: AppV2Enums["invitation_status"]; token_hash: string; invited_by: string
    accepted_by: string | null; accepted_at: string | null; expires_at: string; created_at: string; updated_at: string
  }, "space_id" | "email" | "token_hash" | "invited_by" | "expires_at", "id" | "space_id" | "token_hash" | "invited_by" | "created_at">
  categories: GeneratedTable<{
    id: string; space_id: string; name: string; transaction_type: AppV2Enums["transaction_type"]
    color: string | null; icon: string | null; sort_order: number; is_system: boolean; is_active: boolean
    created_at: string; updated_at: string
  }, "space_id" | "name", "id" | "space_id" | "is_system" | "created_at">
  budget_plans: GeneratedTable<{
    id: string; space_id: string; created_by: string; name: string; period_start: string; period_end: string
    expected_income: number; is_active: boolean; currency: string; created_at: string; updated_at: string
  }, "space_id" | "created_by" | "name" | "period_start" | "period_end" | "currency", "id" | "space_id" | "created_by" | "created_at">
  budget_allocations: GeneratedTable<{
    id: string; space_id: string; budget_plan_id: string; category_id: string; amount: number | null
    percentage: number | null; created_at: string; updated_at: string
  }, "space_id" | "budget_plan_id" | "category_id", "id" | "space_id" | "budget_plan_id" | "category_id" | "created_at">
  transactions: GeneratedTable<{
    id: string; space_id: string; created_by: string; category_id: string | null
    transaction_type: AppV2Enums["transaction_type"]; source: AppV2Enums["transaction_source"]
    status: AppV2Enums["transaction_status"]; amount: number; currency: string; description: string | null
    merchant: string | null; whatsapp_message_id: number | null; occurred_at: string; metadata: Json; deleted_at: string | null
    created_at: string; updated_at: string
  }, "space_id" | "created_by" | "transaction_type" | "amount" | "currency", "id" | "space_id" | "created_by" | "created_at">
  transaction_attachments: GeneratedTable<{
    id: string; space_id: string; transaction_id: string; uploaded_by: string; storage_path: string
    mime_type: string; size_bytes: number; created_at: string; updated_at: string
  }, "space_id" | "transaction_id" | "uploaded_by" | "storage_path" | "mime_type" | "size_bytes", "id" | "space_id" | "transaction_id" | "uploaded_by" | "storage_path" | "created_at">
  recurring_rules: GeneratedTable<{
    id: string; space_id: string; created_by: string; category_id: string | null
    transaction_type: AppV2Enums["transaction_type"]; amount: number; currency: string; description: string | null
    frequency: AppV2Enums["recurrence_frequency"]; interval_count: number; next_run_at: string
    ends_at: string | null; is_active: boolean; created_at: string; updated_at: string
  }, "space_id" | "created_by" | "transaction_type" | "amount" | "currency" | "frequency" | "next_run_at", "id" | "space_id" | "created_by" | "created_at">
  spending_limits: GeneratedTable<{
    id: string; space_id: string; category_id: string | null; amount: number; currency: string
    period: AppV2Enums["recurrence_frequency"]; starts_on: string; created_at: string; updated_at: string
  }, "space_id" | "amount" | "currency", "id" | "space_id" | "created_at">
  financial_goals: GeneratedTable<{
    id: string; space_id: string; created_by: string; name: string; target_amount: number; current_amount: number
    currency: string; target_date: string | null; is_completed: boolean; created_at: string; updated_at: string
  }, "space_id" | "created_by" | "name" | "target_amount" | "currency", "id" | "space_id" | "created_by" | "created_at">
  data_imports: GeneratedTable<{
    id: string; user_id: string | null; space_id: string | null; import_key: string; source: string
    status: AppV2Enums["import_status"]; attempted_count: number; imported_count: number
    skipped_count: number; reason: string | null; created_at: string; updated_at: string
  }, "import_key" | "source", "id" | "user_id" | "space_id" | "import_key" | "source" | "created_at">
  whatsapp_connections: GeneratedTable<{
    id: string; space_id: string; linked_user_id: string; phone_e164: string; provider: string
    instance_name: string; monthly_report_opt_in: boolean; report_preferences: Json
    status: AppV2Enums["connection_status"]; verified_at: string | null; last_seen_at: string | null
    created_at: string; updated_at: string
  }, "space_id" | "linked_user_id" | "phone_e164", "id" | "space_id" | "linked_user_id" | "phone_e164" | "provider" | "created_at">
  whatsapp_link_tokens: GeneratedTable<{
    id: string; space_id: string; connection_id: string; requested_by: string; phone_e164: string; code_hash: string
    attempts: number; max_attempts: number; last_attempt_at: string | null; blocked_at: string | null
    expires_at: string; consumed_at: string | null; created_at: string; updated_at: string
  }, "space_id" | "connection_id" | "requested_by" | "phone_e164" | "code_hash" | "expires_at", "id" | "space_id" | "connection_id" | "requested_by" | "phone_e164" | "code_hash" | "created_at">
  whatsapp_messages: GeneratedTable<{
    id: number; space_id: string; connection_id: string; direction: AppV2Enums["message_direction"]
    status: AppV2Enums["message_status"]; external_message_id: string | null; message_type: string
    body_redacted: string | null; metadata_redacted: Json; sent_at: string | null; received_at: string | null
    created_at: string; updated_at: string
  }, "space_id" | "connection_id" | "direction" | "status", "space_id" | "connection_id" | "direction" | "external_message_id" | "created_at", "id">
  whatsapp_media: GeneratedTable<{
    id: string; space_id: string; message_id: number; storage_path: string; mime_type: string
    size_bytes: number | null; is_valid: boolean; expires_at: string | null; created_at: string; updated_at: string
  }, "space_id" | "message_id" | "storage_path" | "mime_type", "id" | "space_id" | "message_id" | "storage_path" | "created_at">
  whatsapp_jobs: GeneratedTable<{
    id: number; space_id: string; message_id: number | null; job_type: AppV2Enums["job_type"]
    status: AppV2Enums["job_status"]; payload: Json; attempts: number; max_attempts: number
    run_at: string; locked_by: string | null; locked_at: string | null; last_error: string | null
    created_at: string; updated_at: string
  }, "space_id" | "job_type", "space_id" | "message_id" | "job_type" | "created_at", "id">
  whatsapp_events: GeneratedTable<{
    id: number; space_id: string; message_id: number | null; event_type: string; event_key: string | null
    details_redacted: Json; created_at: string; updated_at: string
  }, "space_id" | "event_type", "space_id" | "message_id" | "event_key" | "created_at", "id">
  whatsapp_monthly_reports: GeneratedTable<{
    id: string; space_id: string; requested_by: string | null; month: string; status: AppV2Enums["report_status"]
    scheduled_for: string | null; generation_started_at: string | null; generated_at: string | null
    delivery_status: string; delivery_attempted_at: string | null; delivered_at: string | null
    storage_path: string | null; summary_redacted: Json; created_at: string; updated_at: string
  }, "space_id" | "month", "id" | "space_id" | "requested_by" | "month" | "created_at">
  subscriptions: GeneratedTable<{
    id: string; user_id: string; provider: string; provider_customer_id: string | null
    provider_subscription_id: string | null; product_id: string | null; price_id: string | null
    status: AppV2Enums["subscription_status"]; amount: number | null; currency: string | null
    current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean
    environment: string; created_at: string; updated_at: string
  }, "user_id", "id" | "user_id" | "provider" | "created_at">
  payment_events: GeneratedTable<{
    id: number; user_id: string; subscription_id: string | null; provider_event_id: string
    event_type: string; status: AppV2Enums["payment_event_status"]; payload_redacted: Json
    processed_at: string | null; created_at: string; updated_at: string
  }, "user_id" | "provider_event_id" | "event_type", "user_id" | "provider_event_id" | "event_type" | "created_at", "id">
}

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  app_v2: {
    Tables: AppV2Tables
    Views: {
      monthly_spending_summary: {
        Row: {
          space_id: string | null; month: string | null; currency: string | null; category_id: string | null
          transaction_type: AppV2Enums["transaction_type"] | null; total_amount: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_budget_plan: { Args: { target_plan_id: string }; Returns: AppV2Tables["budget_plans"]["Row"] }
      accept_space_invitation: { Args: { token: string }; Returns: AppV2Tables["space_members"]["Row"] }
      apply_whatsapp_message_status: {
        Args: { connection_id: string; external_message_id: string; status: AppV2Enums["message_status"] }
        Returns: AppV2Tables["whatsapp_messages"]["Row"] | null
      }
      claim_whatsapp_jobs: { Args: { worker_id: string; limit?: number }; Returns: AppV2Tables["whatsapp_jobs"]["Row"][] }
      complete_whatsapp_processing: {
        Args: { job_id: number; locked_at: string; worker_id: string; parsed: Json }
        Returns: AppV2Tables["transactions"]["Row"]
      }
      consume_whatsapp_link: { Args: { code: string; phone_e164: string }; Returns: AppV2Tables["whatsapp_connections"]["Row"] }
      create_space: { Args: { name: string; kind?: AppV2Enums["space_kind"] }; Returns: AppV2Tables["spaces"]["Row"] }
      duplicate_budget_plan: { Args: { target_plan_id: string }; Returns: AppV2Tables["budget_plans"]["Row"] }
      create_whatsapp_link: {
        Args: { phone_e164: string; space_id: string }
        Returns: Array<{ code: string; expires_at: string; instance_name: string }>
      }
      import_legacy_finances: {
        Args: { space_id: string; payload: Json; import_key: string }
        Returns: Array<{ data_import_id: string; imported_count: number; skipped_count: number }>
      }
      update_whatsapp_preferences: {
        Args: { space_id: string; monthly_report_opt_in: boolean; preferences?: Json }
        Returns: AppV2Tables["whatsapp_connections"]["Row"]
      }
      update_budget_plan: {
        Args: { target_plan_id: string; plan_name: string; plan_expected_income: number; plan_period_start: string; plan_period_end: string; plan_currency: string }
        Returns: AppV2Tables["budget_plans"]["Row"]
      }
      enqueue_whatsapp_monthly_reports: { Args: { reference_time?: string }; Returns: number }
      mark_whatsapp_monthly_report_sent: {
        Args: { report_id: string }
        Returns: AppV2Tables["whatsapp_monthly_reports"]["Row"]
      }
      save_budget_plan: {
        Args: { target_space_id: string; target_plan_id: string | null; plan_name: string; plan_expected_income: number; plan_period_start: string; plan_period_end: string; plan_currency: string; plan_allocations: Json }
        Returns: AppV2Tables["budget_plans"]["Row"]
      }
      transfer_space_ownership: { Args: { space_id: string; new_owner_id: string }; Returns: undefined }
    }
    Enums: AppV2Enums
    CompositeTypes: { [_ in never]: never }
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string | null
          description: string | null
          id: string
          merchant: string | null
          name: string | null
          occurred_at: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          merchant?: string | null
          name?: string | null
          occurred_at?: string
          source?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          merchant?: string | null
          name?: string | null
          occurred_at?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_expenses: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string
          date: string | null
          description: string | null
          id: string
          merchant: string | null
          phone: string
          raw_ai_response: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          merchant?: string | null
          phone: string
          raw_ai_response?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          merchant?: string | null
          phone?: string
          raw_ai_response?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          phone: string | null
          success: boolean
          summary: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          phone?: string | null
          success?: boolean
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          phone?: string | null
          success?: boolean
          summary?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_links: {
        Row: {
          created_at: string
          id: string
          phone: string
          user_id: string
          verified_at: string | null
          verify_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
          user_id: string
          verified_at?: string | null
          verify_code: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
          user_id?: string
          verified_at?: string | null
          verify_code?: string
        }
        Relationships: []
      }
      whatsapp_users: {
        Row: {
          id: string
          linked_at: string
          phone: string
          user_id: string
          verified: boolean
        }
        Insert: {
          id?: string
          linked_at?: string
          phone: string
          user_id: string
          verified?: boolean
        }
        Update: {
          id?: string
          linked_at?: string
          phone?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  app_v2: {
    Enums: {
      connection_status: ["pending", "active", "disabled"],
      import_status: ["pending", "processing", "completed", "partial", "skipped", "failed"],
      invitation_status: ["pending", "accepted", "declined", "expired", "revoked"],
      job_status: ["pending", "processing", "retry", "completed", "failed"],
      job_type: ["process_message", "send_message", "download_media", "monthly_report"],
      member_role: ["owner", "admin", "member", "viewer"],
      message_direction: ["inbound", "outbound"],
      message_status: ["received", "queued", "processing", "sent", "delivered", "read", "failed"],
      payment_event_status: ["pending", "processed", "failed", "ignored"],
      recurrence_frequency: ["daily", "weekly", "monthly", "yearly"],
      report_status: ["pending", "generating", "ready", "failed"],
      space_kind: ["personal", "family"],
      subscription_status: ["incomplete", "trialing", "active", "past_due", "canceled", "unpaid"],
      transaction_source: ["app", "whatsapp", "import", "recurring"],
      transaction_status: ["pending", "cleared", "void"],
      transaction_type: ["expense", "income", "transfer"],
    },
  },
  public: {
    Enums: {},
  },
} as const
