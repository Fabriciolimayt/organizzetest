import { expectTypeOf, it } from "vitest";

import type { Database, Json, Tables, TablesInsert, TablesUpdate } from "../integrations/supabase/types";

it("models table RPC returns as arrays and link creation with instance name", () => {
  expectTypeOf<Database["app_v2"]["Functions"]["create_whatsapp_link"]["Returns"]>()
    .toEqualTypeOf<Array<{ code: string; expires_at: string; instance_name: string }>>();
  expectTypeOf<Database["app_v2"]["Functions"]["import_legacy_finances"]["Returns"]>()
    .toEqualTypeOf<Array<{ data_import_id: string; imported_count: number; skipped_count: number }>>();
});

it("models WhatsApp preference and monthly report RPC contracts", () => {
  type Functions = Database["app_v2"]["Functions"];

  expectTypeOf<Functions["update_whatsapp_preferences"]["Args"]>().toEqualTypeOf<{
    space_id: string;
    monthly_report_opt_in: boolean;
    preferences?: Json;
  }>();
  expectTypeOf<Functions["update_whatsapp_preferences"]["Returns"]>()
    .toEqualTypeOf<Tables<{ schema: "app_v2" }, "whatsapp_connections">>();
  expectTypeOf<Functions["enqueue_whatsapp_monthly_reports"]["Args"]>()
    .toEqualTypeOf<{ reference_time?: string }>();
  expectTypeOf<Functions["enqueue_whatsapp_monthly_reports"]["Returns"]>().toEqualTypeOf<number>();
  expectTypeOf<Functions["mark_whatsapp_monthly_report_sent"]["Args"]>()
    .toEqualTypeOf<{ report_id: string }>();
  expectTypeOf<Functions["mark_whatsapp_monthly_report_sent"]["Returns"]>()
    .toEqualTypeOf<Tables<{ schema: "app_v2" }, "whatsapp_monthly_reports">>();
});

it("models the shared Evolution instance as non-null whenever it is writable", () => {
  type Connection = Tables<{ schema: "app_v2" }, "whatsapp_connections">;
  type ConnectionInsert = TablesInsert<{ schema: "app_v2" }, "whatsapp_connections">;
  type ConnectionUpdate = TablesUpdate<{ schema: "app_v2" }, "whatsapp_connections">;

  expectTypeOf<Connection["instance_name"]>().toEqualTypeOf<string>();
  expectTypeOf<ConnectionInsert["instance_name"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<ConnectionUpdate["instance_name"]>().toEqualTypeOf<string | undefined>();
});

it("does not expose identity or immutable message fields as writable", () => {
  type MessageInsert = TablesInsert<{ schema: "app_v2" }, "whatsapp_messages">;
  type MessageUpdate = TablesUpdate<{ schema: "app_v2" }, "whatsapp_messages">;
  expectTypeOf<MessageInsert>().not.toHaveProperty("id");
  expectTypeOf<MessageUpdate>().not.toHaveProperty("id");
  expectTypeOf<MessageUpdate>().not.toHaveProperty("connection_id");
  expectTypeOf<MessageUpdate>().not.toHaveProperty("external_message_id");
  expectTypeOf<MessageUpdate>().not.toHaveProperty("direction");
});
