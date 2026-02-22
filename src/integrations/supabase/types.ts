export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          target_id: string | null
          target_type: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          target_id?: string | null
          target_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          babysitter_user_id: string
          child_id: string
          created_at: string
          id: string
        }
        Insert: {
          babysitter_user_id: string
          child_id: string
          created_at?: string
          id?: string
        }
        Update: {
          babysitter_user_id?: string
          child_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_viewers: {
        Row: {
          child_id: string
          created_at: string
          id: string
          viewer_user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          viewer_user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          viewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_viewers_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar_emoji: string | null
          created_at: string
          dob: string | null
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          parent_id: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          parent_id: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          parent_id?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      children_profiles: {
        Row: {
          created_at: string
          date_of_birth: string
          gender: Database["public"]["Enums"]["child_gender"]
          id: string
          is_active: boolean
          medical_notes: string | null
          name: string
          photo_url: string | null
          routine_notes: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          gender?: Database["public"]["Enums"]["child_gender"]
          id?: string
          is_active?: boolean
          medical_notes?: string | null
          name: string
          photo_url?: string | null
          routine_notes?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          gender?: Database["public"]["Enums"]["child_gender"]
          id?: string
          is_active?: boolean
          medical_notes?: string | null
          name?: string
          photo_url?: string | null
          routine_notes?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_profiles_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          id: string
          log_date: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          daily_log_id: string
          detail: string | null
          id: string
          photo_url: string | null
          photo_url_after: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          time: string
          type: Database["public"]["Enums"]["activity_type"]
          unit: Database["public"]["Enums"]["event_unit"] | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          daily_log_id: string
          detail?: string | null
          id?: string
          photo_url?: string | null
          photo_url_after?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          time: string
          type: Database["public"]["Enums"]["activity_type"]
          unit?: Database["public"]["Enums"]["event_unit"] | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          daily_log_id?: string
          detail?: string | null
          id?: string
          photo_url?: string | null
          photo_url_after?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          time?: string
          type?: Database["public"]["Enums"]["activity_type"]
          unit?: Database["public"]["Enums"]["event_unit"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invites: {
        Row: {
          created_at: string
          expires_at: string
          family_id: string
          id: string
          invite_code: string
          invited_by: string
          status: string
          used_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          family_id: string
          id?: string
          invite_code: string
          invited_by: string
          status?: string
          used_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          family_id?: string
          id?: string
          invite_code?: string
          invited_by?: string
          status?: string
          used_by?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          child_id: string
          created_at: string
          created_by: string
          current_stock: number
          emoji: string
          id: string
          low_stock_threshold: number
          name: string
          notes: string | null
          photo_url: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by: string
          current_stock?: number
          emoji?: string
          id?: string
          low_stock_threshold?: number
          name: string
          notes?: string | null
          photo_url?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string
          current_stock?: number
          emoji?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          notes?: string | null
          photo_url?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_usage: {
        Row: {
          child_id: string
          created_at: string
          created_by: string
          id: string
          item_id: string
          notes: string | null
          quantity: number
          usage_date: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by: string
          id?: string
          item_id: string
          notes?: string | null
          quantity?: number
          usage_date?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usage_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pings: {
        Row: {
          accuracy: number | null
          child_id: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          child_id: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          user_id: string
        }
        Update: {
          accuracy?: number | null
          child_id?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_pings_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          child_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          child_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          child_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_invites: {
        Row: {
          child_id: string
          created_at: string
          id: string
          invite_role: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          status: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          invite_role?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          status?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          invite_role?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_invites_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          child_order: number
          discount_pct: number
          id: number
          is_active: boolean
          monthly_price_idr: number
          plan_name: string
          quarterly_extra_discount_pct: number
        }
        Insert: {
          child_order: number
          discount_pct?: number
          id?: number
          is_active?: boolean
          monthly_price_idr: number
          plan_name: string
          quarterly_extra_discount_pct?: number
        }
        Update: {
          child_order?: number
          discount_pct?: number
          id?: number
          is_active?: boolean
          monthly_price_idr?: number
          plan_name?: string
          quarterly_extra_discount_pct?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          dob: string | null
          email: string
          id: string
          is_disabled: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          dob?: string | null
          email: string
          id: string
          is_disabled?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          dob?: string | null
          email?: string
          id?: string
          is_disabled?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          admin_override: boolean
          admin_override_note: string | null
          billing_cycle: Database["public"]["Enums"]["subscription_billing_cycle"]
          created_at: string
          id: string
          number_of_children: number
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          premium_promo_end_date: string | null
          price_per_month: number
          price_per_quarter: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_end_date: string | null
          subscription_start_date: string
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_override?: boolean
          admin_override_note?: string | null
          billing_cycle?: Database["public"]["Enums"]["subscription_billing_cycle"]
          created_at?: string
          id?: string
          number_of_children?: number
          plan_type?: Database["public"]["Enums"]["subscription_plan_type"]
          premium_promo_end_date?: string | null
          price_per_month?: number
          price_per_quarter?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_end_date?: string | null
          subscription_start_date?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_override?: boolean
          admin_override_note?: string | null
          billing_cycle?: Database["public"]["Enums"]["subscription_billing_cycle"]
          created_at?: string
          id?: string
          number_of_children?: number
          plan_type?: Database["public"]["Enums"]["subscription_plan_type"]
          premium_promo_end_date?: string | null
          price_per_month?: number
          price_per_quarter?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_end_date?: string | null
          subscription_start_date?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_log: {
        Args: { _log_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_to_child: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      is_parent_of_child: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      is_viewer_of_child: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      log_activity:
        | {
            Args: {
              _action: string
              _detail?: string
              _target_id?: string
              _target_type?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _action: string
              _detail?: string
              _target_id?: string
              _target_type?: string
              _user_email: string
              _user_id: string
            }
            Returns: undefined
          }
    }
    Enums: {
      activity_type:
        | "susu"
        | "mpasi"
        | "tidur"
        | "bangun"
        | "pup"
        | "pee"
        | "mandi"
        | "vitamin"
        | "lap_badan"
        | "catatan"
        | "snack"
        | "buah"
      app_role: "parent" | "babysitter" | "admin" | "viewer"
      child_gender: "male" | "female"
      event_status: "habis" | "sisa"
      event_unit: "ml" | "pcs" | "dosis"
      subscription_billing_cycle: "monthly" | "quarterly"
      subscription_plan_type: "trial" | "standard" | "premium_promo"
      subscription_status: "trial" | "active" | "expired" | "cancelled"
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
  public: {
    Enums: {
      activity_type: [
        "susu",
        "mpasi",
        "tidur",
        "bangun",
        "pup",
        "pee",
        "mandi",
        "vitamin",
        "lap_badan",
        "catatan",
        "snack",
        "buah",
      ],
      app_role: ["parent", "babysitter", "admin", "viewer"],
      child_gender: ["male", "female"],
      event_status: ["habis", "sisa"],
      event_unit: ["ml", "pcs", "dosis"],
      subscription_billing_cycle: ["monthly", "quarterly"],
      subscription_plan_type: ["trial", "standard", "premium_promo"],
      subscription_status: ["trial", "active", "expired", "cancelled"],
    },
  },
} as const
