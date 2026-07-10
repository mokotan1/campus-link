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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_user_id: number
          application_status: string
          created_at: string
          id: number
          message: string | null
          project_id: number
          target_role: string | null
        }
        Insert: {
          applicant_user_id: number
          application_status?: string
          created_at?: string
          id?: number
          message?: string | null
          project_id: number
          target_role?: string | null
        }
        Update: {
          applicant_user_id?: number
          application_status?: string
          created_at?: string
          id?: number
          message?: string | null
          project_id?: number
          target_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_user_id_fkey"
            columns: ["applicant_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      // Task 6: manually extended until cloud schema regeneration catches up.
      proposals: {
        Row: {
          created_at: string
          id: number
          message: string | null
          project_id: number
          proposal_status: string
          receiver_user_id: number
          sender_user_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
          project_id: number
          proposal_status?: string
          receiver_user_id: number
          sender_user_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
          project_id?: number
          proposal_status?: string
          receiver_user_id?: number
          sender_user_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_receiver_user_id_fkey"
            columns: ["receiver_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          cover_image_name: string | null
          created_at: string
          description: string | null
          external_url: string | null
          id: number
          item_type: string | null
          role_in_work: string | null
          title: string
          tools: string[]
          user_id: number
        }
        Insert: {
          cover_image_name?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: number
          item_type?: string | null
          role_in_work?: string | null
          title: string
          tools?: string[]
          user_id: number
        }
        Update: {
          cover_image_name?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: number
          item_type?: string | null
          role_in_work?: string | null
          title?: string
          tools?: string[]
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability_status: string | null
          bio: string | null
          collaboration_status: string
          collaboration_type: string | null
          created_at: string
          department: string | null
          display_name: string | null
          grade: string | null
          id: number
          onboarding_completed: boolean
          role_tags: string[]
          student_id: string | null
          tech_stack: string | null
          user_id: number
          weekly_hours: string | null
        }
        Insert: {
          availability_status?: string | null
          bio?: string | null
          collaboration_status?: string
          collaboration_type?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          grade?: string | null
          id?: number
          onboarding_completed?: boolean
          role_tags?: string[]
          student_id?: string | null
          tech_stack?: string | null
          user_id: number
          weekly_hours?: string | null
        }
        Update: {
          availability_status?: string | null
          bio?: string | null
          collaboration_status?: string
          collaboration_type?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          grade?: string | null
          id?: number
          onboarding_completed?: boolean
          role_tags?: string[]
          student_id?: string | null
          tech_stack?: string | null
          user_id?: number
          weekly_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          campus: string | null
          collaboration_mode: string
          cover_image_name: string | null
          created_at: string
          description: string | null
          end_date: string | null
          expected_member_count: number | null
          id: number
          owner_user_id: number
          project_type: string
          recruitment_status: string
          required_roles: string[]
          start_date: string | null
          summary: string
          title: string
          tools: string[]
        }
        Insert: {
          campus?: string | null
          collaboration_mode: string
          cover_image_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          expected_member_count?: number | null
          id?: number
          owner_user_id: number
          project_type: string
          recruitment_status?: string
          required_roles?: string[]
          start_date?: string | null
          summary: string
          title: string
          tools?: string[]
        }
        Update: {
          campus?: string | null
          collaboration_mode?: string
          cover_image_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          expected_member_count?: number | null
          id?: number
          owner_user_id?: number
          project_type?: string
          recruitment_status?: string
          required_roles?: string[]
          start_date?: string | null
          summary?: string
          title?: string
          tools?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_provider: string
          auth_user_id: string | null
          campus: string | null
          created_at: string
          email: string
          email_verified: boolean
          id: number
          name: string | null
          password_hash: string | null
          role: string
        }
        Insert: {
          auth_provider?: string
          auth_user_id?: string | null
          campus?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          id?: number
          name?: string | null
          password_hash?: string | null
          role?: string
        }
        Update: {
          auth_provider?: string
          auth_user_id?: string | null
          campus?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          id?: number
          name?: string | null
          password_hash?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      applicant_withdraw_application: {
        Args: { p_application_id: number }
        Returns: Database["public"]["Tables"]["applications"]["Row"]
      }
      get_matched_contact_details: {
        Args: { p_other_user_id: number }
        Returns: {
          campus: string | null
          department: string
          email: string
          name: string | null
          user_id: number
        }[]
      }
      owner_decide_application: {
        Args: { p_application_id: number; p_decision: string }
        Returns: Database["public"]["Tables"]["applications"]["Row"]
      }
      receiver_decide_proposal: {
        Args: { p_decision: string; p_proposal_id: number }
        Returns: Database["public"]["Tables"]["proposals"]["Row"]
      }
      sender_cancel_proposal: {
        Args: { p_proposal_id: number }
        Returns: Database["public"]["Tables"]["proposals"]["Row"]
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
