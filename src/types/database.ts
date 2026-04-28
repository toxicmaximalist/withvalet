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
      activity_status: "planned" | "sent" | "replied" | "completed" | "failed";
      activity_type:
        | "email"
        | "linkedin"
        | "telegram"
        | "whatsapp"
        | "call"
        | "meeting"
        | "note";
      contact_status:
        | "new"
        | "contacted"
        | "replied"
        | "interested"
        | "not_interested"
        | "meeting_scheduled"
        | "closed"
        | "archived";
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
