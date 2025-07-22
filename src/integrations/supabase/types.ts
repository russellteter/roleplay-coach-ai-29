export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          knowledge_base_ids: string[] | null
          organization_id: string | null
          prompt: string
          response: string
          scenario_data: Json
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          analysis_type?: string
          created_at?: string
          id?: string
          knowledge_base_ids?: string[] | null
          organization_id?: string | null
          prompt: string
          response: string
          scenario_data: Json
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          knowledge_base_ids?: string[] | null
          organization_id?: string | null
          prompt?: string
          response?: string
          scenario_data?: Json
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_docs: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          source: string
          text: string
          version: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          source: string
          text: string
          version?: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          source?: string
          text?: string
          version?: string
        }
        Relationships: []
      }
      Contractors: {
        Row: {
          "Comp Tier": string | null
          Employee: string
          Group: string | null
          is_essential: boolean | null
          "Median Comp": string | null
          notes: string | null
          "Sub-Group": string | null
          Title: string | null
        }
        Insert: {
          "Comp Tier"?: string | null
          Employee: string
          Group?: string | null
          is_essential?: boolean | null
          "Median Comp"?: string | null
          notes?: string | null
          "Sub-Group"?: string | null
          Title?: string | null
        }
        Update: {
          "Comp Tier"?: string | null
          Employee?: string
          Group?: string | null
          is_essential?: boolean | null
          "Median Comp"?: string | null
          notes?: string | null
          "Sub-Group"?: string | null
          Title?: string | null
        }
        Relationships: []
      }
      Employees: {
        Row: {
          "Comp Tier": string | null
          Employee: string
          Group: string | null
          "Median Comp": string | null
          notes: string | null
          Org: string | null
          organization_id: string | null
          "Sub-Group": string | null
          Title: string | null
          updated_at: string | null
        }
        Insert: {
          "Comp Tier"?: string | null
          Employee: string
          Group?: string | null
          "Median Comp"?: string | null
          notes?: string | null
          Org?: string | null
          organization_id?: string | null
          "Sub-Group"?: string | null
          Title?: string | null
          updated_at?: string | null
        }
        Update: {
          "Comp Tier"?: string | null
          Employee?: string
          Group?: string | null
          "Median Comp"?: string | null
          notes?: string | null
          Org?: string | null
          organization_id?: string | null
          "Sub-Group"?: string | null
          Title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_costs: {
        Row: {
          active: boolean | null
          annual_cost: number | null
          created_at: string | null
          id: string
          monthly_cost: number
          optimization_scenarios: Json | null
          organization_id: string | null
          renewal_date: string | null
          service_description: string | null
          service_provider: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          annual_cost?: number | null
          created_at?: string | null
          id?: string
          monthly_cost: number
          optimization_scenarios?: Json | null
          organization_id?: string | null
          renewal_date?: string | null
          service_description?: string | null
          service_provider: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          annual_cost?: number | null
          created_at?: string | null
          id?: string
          monthly_cost?: number
          optimization_scenarios?: Json | null
          organization_id?: string | null
          renewal_date?: string | null
          service_description?: string | null
          service_provider?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hosting_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_costs_actuals: {
        Row: {
          cost: string | null
          month: string | null
          platform: string | null
          product: string | null
        }
        Insert: {
          cost?: string | null
          month?: string | null
          platform?: string | null
          product?: string | null
        }
        Update: {
          cost?: string | null
          month?: string | null
          platform?: string | null
          product?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          content: string | null
          created_at: string
          file_size: number
          file_type: string
          filename: string
          id: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      open_pipeline_h2_2025: {
        Row: {
          account_name: string
          amount: number
          close_month: string
          close_quarter: string
          id: string
          loaded_at: string | null
          owner: string
          stage_label: string
          stage_num: number
          vertical: string | null
        }
        Insert: {
          account_name: string
          amount: number
          close_month: string
          close_quarter: string
          id?: string
          loaded_at?: string | null
          owner: string
          stage_label: string
          stage_num: number
          vertical?: string | null
        }
        Update: {
          account_name?: string
          amount?: number
          close_month?: string
          close_quarter?: string
          id?: string
          loaded_at?: string | null
          owner?: string
          stage_label?: string
          stage_num?: number
          vertical?: string | null
        }
        Relationships: []
      }
      operations_budget: {
        Row: {
          annual_cost: number | null
          budget_owner: string | null
          created_at: string | null
          id: string
          is_critical: boolean | null
          monthly_cost: number
          organization_id: string | null
          renewal_date: string | null
          tool_name: string
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          annual_cost?: number | null
          budget_owner?: string | null
          created_at?: string | null
          id?: string
          is_critical?: boolean | null
          monthly_cost: number
          organization_id?: string | null
          renewal_date?: string | null
          tool_name: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          annual_cost?: number | null
          budget_owner?: string | null
          created_at?: string | null
          id?: string
          is_critical?: boolean | null
          monthly_cost?: number
          organization_id?: string | null
          renewal_date?: string | null
          tool_name?: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_budget_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      "Ops Tech Stack": {
        Row: {
          "Apr-25": string | null
          "Aug-25": string | null
          "Dec-25": string | null
          Dept: string | null
          Description: string | null
          "Feb-25": string | null
          "GL Account": string | null
          "Jan-25": string | null
          "Jul-25": string | null
          "Jun-25": string | null
          "Mar-25": string | null
          "May-25": string | null
          "Nov-25": string | null
          "Oct-25": string | null
          "Q1 FY25": string | null
          "Q2 FY25": string | null
          "Q3 FY25": string | null
          "Q4 FY25": string | null
          "Sep-25": string | null
          "Total FY25": string | null
          UUID: string
          "Vendor (GL Name)": string
        }
        Insert: {
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          Dept?: string | null
          Description?: string | null
          "Feb-25"?: string | null
          "GL Account"?: string | null
          "Jan-25"?: string | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Q1 FY25"?: string | null
          "Q2 FY25"?: string | null
          "Q3 FY25"?: string | null
          "Q4 FY25"?: string | null
          "Sep-25"?: string | null
          "Total FY25"?: string | null
          UUID?: string
          "Vendor (GL Name)": string
        }
        Update: {
          "Apr-25"?: string | null
          "Aug-25"?: string | null
          "Dec-25"?: string | null
          Dept?: string | null
          Description?: string | null
          "Feb-25"?: string | null
          "GL Account"?: string | null
          "Jan-25"?: string | null
          "Jul-25"?: string | null
          "Jun-25"?: string | null
          "Mar-25"?: string | null
          "May-25"?: string | null
          "Nov-25"?: string | null
          "Oct-25"?: string | null
          "Q1 FY25"?: string | null
          "Q2 FY25"?: string | null
          "Q3 FY25"?: string | null
          "Q4 FY25"?: string | null
          "Sep-25"?: string | null
          "Total FY25"?: string | null
          UUID?: string
          "Vendor (GL Name)"?: string
        }
        Relationships: []
      }
      ops_tech_stack_scenarios: {
        Row: {
          created_at: string | null
          id: string
          modified_spend: Json
          notes: string | null
          organization_id: string | null
          scenario_name: string
          tool_adjustments: Json
          total_savings: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          modified_spend?: Json
          notes?: string | null
          organization_id?: string | null
          scenario_name: string
          tool_adjustments?: Json
          total_savings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          modified_spend?: Json
          notes?: string | null
          organization_id?: string | null
          scenario_name?: string
          tool_adjustments?: Json
          total_savings?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_tech_stack_scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roster: {
        Row: {
          "First Name": string | null
          "Hire Date": string | null
          "Last Name": string
        }
        Insert: {
          "First Name"?: string | null
          "Hire Date"?: string | null
          "Last Name": string
        }
        Update: {
          "First Name"?: string | null
          "Hire Date"?: string | null
          "Last Name"?: string
        }
        Relationships: []
      }
      sales_bookings: {
        Row: {
          booking_amount: number | null
          booking_type: string | null
          month: string | null
        }
        Insert: {
          booking_amount?: number | null
          booking_type?: string | null
          month?: string | null
        }
        Update: {
          booking_amount?: number | null
          booking_type?: string | null
          month?: string | null
        }
        Relationships: []
      }
      sales_quotas: {
        Row: {
          pct_to_annual_quota: number | null
          quota_assigned: number | null
          quota_attained_ytd: number | null
          sales_rep: string | null
        }
        Insert: {
          pct_to_annual_quota?: number | null
          quota_assigned?: number | null
          quota_attained_ytd?: number | null
          sales_rep?: string | null
        }
        Update: {
          pct_to_annual_quota?: number | null
          quota_assigned?: number | null
          quota_attained_ytd?: number | null
          sales_rep?: string | null
        }
        Relationships: []
      }
      scenario_prompts: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          opening_message: string
          prompt_text: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          opening_message: string
          prompt_text: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          opening_message?: string
          prompt_text?: string
          title?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          employee_selections: Json | null
          financial_metrics: Json | null
          id: string
          inputs: Json
          name: string
          organization_id: string | null
          results: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          employee_selections?: Json | null
          financial_metrics?: Json | null
          id?: string
          inputs: Json
          name: string
          organization_id?: string | null
          results: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          employee_selections?: Json | null
          financial_metrics?: Json | null
          id?: string
          inputs?: Json
          name?: string
          organization_id?: string | null
          results?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staffing_notes: {
        Row: {
          created_at: string | null
          id: string
          note_level: string
          note_type: string
          notes: string | null
          organization_id: string | null
          scenario_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_level: string
          note_type: string
          notes?: string | null
          organization_id?: string | null
          scenario_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note_level?: string
          note_type?: string
          notes?: string | null
          organization_id?: string | null
          scenario_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staffing_notes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_adjustments: {
        Row: {
          adjustment_type: string
          adjustment_value: number
          created_at: string | null
          id: string
          is_locked: boolean | null
          notes: string | null
          scenario_id: string | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          adjustment_type: string
          adjustment_value?: number
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          notes?: string | null
          scenario_id?: string | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          adjustment_type?: string
          adjustment_value?: number
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          notes?: string | null
          scenario_id?: string | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_adjustments_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "ops_tech_stack_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_current_user_org: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      search_class_docs: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          text: string
          source: string
          version: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
  public: {
    Enums: {},
  },
} as const
