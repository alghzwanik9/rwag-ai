export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          scene_id: string
          glb_url: string | null
          scene_items: Json[]
          custom_materials: Json
          total_cost: number
          saved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          scene_id: string
          glb_url?: string | null
          scene_items?: Json[]
          custom_materials?: Json
          total_cost?: number
          saved_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          scene_id?: string
          glb_url?: string | null
          scene_items?: Json[]
          custom_materials?: Json
          total_cost?: number
          saved_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
