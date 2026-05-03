export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      activity_status:
        | "planned"
        | "sent"
        | "replied"
        | "followed_up_1"
        | "followed_up_2";
      activity_type:
        | "email"
        | "linkedin_message"
        | "follow_up"
        | "call"
        | "demo"
        | "telegram_message";
      contact_status:
        | "fresh"
        | "contacted"
        | "replied"
        | "followed_up"
        | "call_scheduled"
        | "call_done"
        | "interested"
        | "not_interested"
        | "ghosted";
      workspace_role: "owner" | "member";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
    Tables: {
      contact_folders: {
        Row: {
          contact_id: string;
          created_at: string;
          folder_id: string;
          workspace_id: string;
        };
        Insert: {
          contact_id: string;
          created_at?: string;
          folder_id: string;
          workspace_id: string;
        };
        Update: {
          contact_id?: string;
          created_at?: string;
          folder_id?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string;
          gmail: string | null;
          id: string;
          last_contact_date: string | null;
          linkedin: string | null;
          name: string;
          note: string | null;
          organization_id: string | null;
          responsible_user_id: string | null;
          role: string | null;
          status: Database["public"]["Enums"]["contact_status"];
          telegram: string | null;
          updated_at: string;
          whatsapp: string | null;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          gmail?: string | null;
          id?: string;
          last_contact_date?: string | null;
          linkedin?: string | null;
          name: string;
          note?: string | null;
          organization_id?: string | null;
          responsible_user_id?: string | null;
          role?: string | null;
          status?: Database["public"]["Enums"]["contact_status"];
          telegram?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          gmail?: string | null;
          id?: string;
          last_contact_date?: string | null;
          linkedin?: string | null;
          name?: string;
          note?: string | null;
          organization_id?: string | null;
          responsible_user_id?: string | null;
          role?: string | null;
          status?: Database["public"]["Enums"]["contact_status"];
          telegram?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
          workspace_id?: string;
        };
        Relationships: [];
      };
      folders: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          note: string | null;
          website: string | null;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          note?: string | null;
          website?: string | null;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          note?: string | null;
          website?: string | null;
          workspace_id?: string;
        };
        Relationships: [];
      };
      outreach_activities: {
        Row: {
          activity_date: string;
          contact_id: string;
          content: string;
          created_at: string;
          id: string;
          organization_id: string | null;
          status: Database["public"]["Enums"]["activity_status"];
          type: Database["public"]["Enums"]["activity_type"];
          workspace_id: string;
        };
        Insert: {
          activity_date: string;
          contact_id: string;
          content: string;
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          status?: Database["public"]["Enums"]["activity_status"];
          type: Database["public"]["Enums"]["activity_type"];
          workspace_id: string;
        };
        Update: {
          activity_date?: string;
          contact_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          status?: Database["public"]["Enums"]["activity_status"];
          type?: Database["public"]["Enums"]["activity_type"];
          workspace_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspace_invitations: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["workspace_role"];
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["workspace_role"];
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["workspace_role"];
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
          owner_id: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invite_code?: string;
          name: string;
          owner_id: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invite_code?: string;
          name?: string;
          owner_id?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_workspace_invitations_for_current_user: {
        Args: Record<PropertyKey, never>;
        Returns: {
          workspace_id: string;
        }[];
      };
      join_workspace_by_invite_code: {
        Args: { invite_code_input: string };
        Returns: {
          id: string;
          name: string;
          slug: string;
        }[];
      };
      regenerate_workspace_invite_code: {
        Args: { target_workspace_id: string };
        Returns: string;
      };
    };
    Views: {
      [_ in never]: never;
    };
  };
};
