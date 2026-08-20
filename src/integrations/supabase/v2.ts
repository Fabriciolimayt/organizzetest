import { supabase } from "./client";
import type { Tables, TablesInsert, TablesUpdate } from "./types";

export const supabaseV2 = supabase.schema("app_v2");

export type V2Row<TableName extends keyof import("./types").Database["app_v2"]["Tables"]> =
  Tables<{ schema: "app_v2" }, TableName>;
export type V2Insert<TableName extends keyof import("./types").Database["app_v2"]["Tables"]> =
  TablesInsert<{ schema: "app_v2" }, TableName>;
export type V2Update<TableName extends keyof import("./types").Database["app_v2"]["Tables"]> =
  TablesUpdate<{ schema: "app_v2" }, TableName>;

export type ProfileV2 = V2Row<"profiles">;
export type SpaceV2 = V2Row<"spaces">;
export type CategoryV2 = V2Row<"categories">;
export type TransactionV2 = V2Row<"transactions">;
export type TransactionInsertV2 = V2Insert<"transactions">;
export type WhatsAppConnectionV2 = V2Row<"whatsapp_connections">;
export type WhatsAppMessageV2 = V2Row<"whatsapp_messages">;
export type WhatsAppJobV2 = V2Row<"whatsapp_jobs">;
