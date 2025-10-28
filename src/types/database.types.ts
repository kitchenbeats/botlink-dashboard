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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _migrations: {
        Row: {
          id: number
          is_applied: boolean
          tstamp: string
          version_id: number
        }
        Insert: {
          id?: number
          is_applied: boolean
          tstamp?: string
          version_id: number
        }
        Update: {
          id?: number
          is_applied?: boolean
          tstamp?: string
          version_id?: number
        }
        Relationships: []
      }
      access_tokens: {
        Row: {
          access_token_hash: string
          access_token_length: number
          access_token_mask_prefix: string
          access_token_mask_suffix: string
          access_token_prefix: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          access_token_hash: string
          access_token_length: number
          access_token_mask_prefix: string
          access_token_mask_suffix: string
          access_token_prefix: string
          created_at?: string
          id?: string
          name?: string
          user_id: string
        }
        Update: {
          access_token_hash?: string
          access_token_length?: number
          access_token_mask_prefix?: string
          access_token_mask_suffix?: string
          access_token_prefix?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          config: Json | null
          created_at: string | null
          execution_id: string | null
          id: string
          is_system: boolean | null
          model: string
          name: string
          system_prompt: string
          team_id: string | null
          type: string
          updated_at: string | null
          user_prompt_template: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          is_system?: boolean | null
          model?: string
          name: string
          system_prompt: string
          team_id?: string | null
          type: string
          updated_at?: string | null
          user_prompt_template?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          is_system?: boolean | null
          model?: string
          name?: string
          system_prompt?: string
          team_id?: string | null
          type?: string
          updated_at?: string | null
          user_prompt_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          endpoint: string
          endpoint_tls: boolean
          id: string
          sandbox_proxy_domain: string | null
          token: string
        }
        Insert: {
          endpoint: string
          endpoint_tls?: boolean
          id?: string
          sandbox_proxy_domain?: string | null
          token: string
        }
        Update: {
          endpoint?: string
          endpoint_tls?: boolean
          id?: string
          sandbox_proxy_domain?: string | null
          token?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          description: string | null
          first_commit_hash: string | null
          id: string
          last_commit_hash: string | null
          name: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          first_commit_hash?: string | null
          id?: string
          last_commit_hash?: string | null
          name: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          first_commit_hash?: string | null
          id?: string
          last_commit_hash?: string | null
          name?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          build_logs: string | null
          created_at: string | null
          id: string
          project_id: string
          snapshot: Json
          status: string
          url: string
          version: number
        }
        Insert: {
          build_logs?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          snapshot: Json
          status: string
          url: string
          version: number
        }
        Update: {
          build_logs?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          snapshot?: Json
          status?: string
          url?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      env_aliases: {
        Row: {
          alias: string
          env_id: string
          is_renamable: boolean
        }
        Insert: {
          alias: string
          env_id: string
          is_renamable?: boolean
        }
        Update: {
          alias?: string
          env_id?: string
          is_renamable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "env_aliases_envs_env_aliases"
            columns: ["env_id"]
            isOneToOne: false
            referencedRelation: "envs"
            referencedColumns: ["id"]
          },
        ]
      }
      env_builds: {
        Row: {
          cluster_node_id: string
          created_at: string
          dockerfile: string | null
          env_id: string
          envd_version: string | null
          finished_at: string | null
          firecracker_version: string
          free_disk_size_mb: number
          id: string
          kernel_version: string
          ram_mb: number
          ready_cmd: string | null
          reason: Json
          start_cmd: string | null
          status: string
          total_disk_size_mb: number | null
          updated_at: string
          vcpu: number
        }
        Insert: {
          cluster_node_id: string
          created_at?: string
          dockerfile?: string | null
          env_id: string
          envd_version?: string | null
          finished_at?: string | null
          firecracker_version: string
          free_disk_size_mb: number
          id?: string
          kernel_version?: string
          ram_mb: number
          ready_cmd?: string | null
          reason?: Json
          start_cmd?: string | null
          status?: string
          total_disk_size_mb?: number | null
          updated_at: string
          vcpu: number
        }
        Update: {
          cluster_node_id?: string
          created_at?: string
          dockerfile?: string | null
          env_id?: string
          envd_version?: string | null
          finished_at?: string | null
          firecracker_version?: string
          free_disk_size_mb?: number
          id?: string
          kernel_version?: string
          ram_mb?: number
          ready_cmd?: string | null
          reason?: Json
          start_cmd?: string | null
          status?: string
          total_disk_size_mb?: number | null
          updated_at?: string
          vcpu?: number
        }
        Relationships: [
          {
            foreignKeyName: "env_builds_envs_builds"
            columns: ["env_id"]
            isOneToOne: false
            referencedRelation: "envs"
            referencedColumns: ["id"]
          },
        ]
      }
      envs: {
        Row: {
          allowed_tier_ids: string[] | null
          build_count: number
          category: string | null
          cluster_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon_url: string | null
          id: string
          last_spawned_at: string | null
          name: string | null
          public: boolean
          spawn_count: number
          tags: string[] | null
          team_id: string
          updated_at: string
        }
        Insert: {
          allowed_tier_ids?: string[] | null
          build_count?: number
          category?: string | null
          cluster_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id: string
          last_spawned_at?: string | null
          name?: string | null
          public?: boolean
          spawn_count?: number
          tags?: string[] | null
          team_id: string
          updated_at: string
        }
        Update: {
          allowed_tier_ids?: string[] | null
          build_count?: number
          category?: string | null
          cluster_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          last_spawned_at?: string | null
          name?: string | null
          public?: boolean
          spawn_count?: number
          tags?: string[] | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "envs_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envs_teams_envs"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      executions: {
        Row: {
          builder_type: string
          channel_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          inngest_run_id: string | null
          input: string
          output: string | null
          status: string
          team_id: string
          workflow_id: string | null
        }
        Insert: {
          builder_type: string
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          inngest_run_id?: string | null
          input: string
          output?: string | null
          status: string
          team_id: string
          workflow_id?: string | null
        }
        Update: {
          builder_type?: string
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          inngest_run_id?: string | null
          input?: string
          output?: string | null
          status?: string
          team_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "executions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          language: string | null
          path: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          language?: string | null
          path: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          language?: string | null
          path?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_snapshots: {
        Row: {
          created_at: string
          description: string | null
          file_count: number | null
          id: string
          metadata: Json | null
          project_id: string
          size_mb: number | null
          snapshot_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_count?: number | null
          id?: string
          metadata?: Json | null
          project_id: string
          size_mb?: number | null
          snapshot_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_count?: number | null
          id?: string
          metadata?: Json | null
          project_id?: string
          size_mb?: number | null
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          github_repo_url: string | null
          id: string
          last_commit_hash: string | null
          last_opened_at: string | null
          name: string
          settings: Json | null
          team_id: string
          template: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          github_repo_url?: string | null
          id?: string
          last_commit_hash?: string | null
          last_opened_at?: string | null
          name: string
          settings?: Json | null
          team_id: string
          template: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          github_repo_url?: string | null
          id?: string
          last_commit_hash?: string | null
          last_opened_at?: string | null
          name?: string
          settings?: Json | null
          team_id?: string
          template?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sandbox_sessions: {
        Row: {
          created_at: string | null
          e2b_session_id: string
          expires_at: string
          id: string
          metadata: Json | null
          project_id: string
          status: string
          stopped_at: string | null
          template: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          e2b_session_id: string
          expires_at: string
          id?: string
          metadata?: Json | null
          project_id: string
          status: string
          stopped_at?: string | null
          template: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          e2b_session_id?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          status?: string
          stopped_at?: string | null
          template?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          allow_internet_access: boolean | null
          auto_pause: boolean
          base_env_id: string
          created_at: string | null
          env_id: string
          env_secure: boolean
          id: string
          metadata: Json | null
          origin_node_id: string
          sandbox_id: string
          sandbox_started_at: string
          team_id: string
        }
        Insert: {
          allow_internet_access?: boolean | null
          auto_pause?: boolean
          base_env_id: string
          created_at?: string | null
          env_id: string
          env_secure?: boolean
          id?: string
          metadata?: Json | null
          origin_node_id: string
          sandbox_id: string
          sandbox_started_at: string
          team_id: string
        }
        Update: {
          allow_internet_access?: boolean | null
          auto_pause?: boolean
          base_env_id?: string
          created_at?: string | null
          env_id?: string
          env_secure?: boolean
          id?: string
          metadata?: Json | null
          origin_node_id?: string
          sandbox_id?: string
          sandbox_started_at?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_snapshots_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snapshots_envs_base_env_id"
            columns: ["base_env_id"]
            isOneToOne: false
            referencedRelation: "envs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snapshots_envs_env_id"
            columns: ["env_id"]
            isOneToOne: false
            referencedRelation: "envs"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agent_id: string | null
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          execution_id: string | null
          id: string
          input: string
          message_id: string | null
          metadata: Json | null
          output: string | null
          project_id: string | null
          result_type: string | null
          status: string
          step_id: string | null
          system_agent_id: string | null
          team_id: string | null
          title: string
          type: string
        }
        Insert: {
          agent_id?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          execution_id?: string | null
          id?: string
          input: string
          message_id?: string | null
          metadata?: Json | null
          output?: string | null
          project_id?: string | null
          result_type?: string | null
          status: string
          step_id?: string | null
          system_agent_id?: string | null
          team_id?: string | null
          title: string
          type: string
        }
        Update: {
          agent_id?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          execution_id?: string | null
          id?: string
          input?: string
          message_id?: string | null
          metadata?: Json | null
          output?: string | null
          project_id?: string | null
          result_type?: string | null
          status?: string
          step_id?: string | null
          system_agent_id?: string | null
          team_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_system_agent_id_fkey"
            columns: ["system_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_api_keys: {
        Row: {
          api_key_encrypted: string
          api_key_hash: string
          api_key_length: number
          api_key_mask_prefix: string
          api_key_mask_suffix: string
          api_key_prefix: string
          created_at: string
          created_by: string | null
          id: string
          last_used: string | null
          name: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted: string
          api_key_hash: string
          api_key_length: number
          api_key_mask_prefix: string
          api_key_mask_suffix: string
          api_key_prefix: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_used?: string | null
          name?: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string
          api_key_hash?: string
          api_key_length?: number
          api_key_mask_prefix?: string
          api_key_mask_suffix?: string
          api_key_prefix?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_used?: string | null
          name?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_api_keys_teams_team_api_keys"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          blocked_reason: string | null
          cluster_id: string | null
          created_at: string
          email: string
          id: string
          is_banned: boolean
          is_blocked: boolean
          name: string
          tier: string
        }
        Insert: {
          blocked_reason?: string | null
          cluster_id?: string | null
          created_at?: string
          email: string
          id?: string
          is_banned?: boolean
          is_blocked?: boolean
          name: string
          tier: string
        }
        Update: {
          blocked_reason?: string | null
          cluster_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_banned?: boolean
          is_blocked?: boolean
          name?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tiers_teams"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tiers: {
        Row: {
          concurrent_instances: number
          concurrent_template_builds: number
          disk_mb: number
          id: string
          max_length_hours: number
          max_ram_mb: number
          max_vcpu: number
          name: string
        }
        Insert: {
          concurrent_instances: number
          concurrent_template_builds?: number
          disk_mb?: number
          id: string
          max_length_hours: number
          max_ram_mb?: number
          max_vcpu?: number
          name: string
        }
        Update: {
          concurrent_instances?: number
          concurrent_template_builds?: number
          disk_mb?: number
          id?: string
          max_length_hours?: number
          max_ram_mb?: number
          max_vcpu?: number
          name?: string
        }
        Relationships: []
      }
      users_teams: {
        Row: {
          added_by: string | null
          created_at: string | null
          id: number
          is_current: boolean | null
          is_default: boolean
          team_id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          is_default?: boolean
          team_id: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          is_default?: boolean
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_teams_teams_teams"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string | null
          description: string | null
          edges: Json
          id: string
          name: string
          nodes: Json
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          edges?: Json
          id?: string
          name: string
          nodes?: Json
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          edges?: Json
          id?: string
          name?: string
          nodes?: Json
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      encrypt_e2b_api_key: { Args: { raw_key: string }; Returns: string }
      extra_for_post_user_signup: {
        Args: { team_id: string; user_id: string }
        Returns: undefined
      }
      generate_access_token: { Args: never; Returns: string }
      generate_team_api_key: { Args: never; Returns: string }
      get_agents_by_execution: {
        Args: { p_execution_id: string }
        Returns: {
          config: Json | null
          created_at: string | null
          execution_id: string | null
          id: string
          is_system: boolean | null
          model: string
          name: string
          system_prompt: string
          team_id: string | null
          type: string
          updated_at: string | null
          user_prompt_template: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "agents"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pending_tasks_for_execution: {
        Args: { p_execution_id: string }
        Returns: {
          agent_id: string | null
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          execution_id: string | null
          id: string
          input: string
          message_id: string | null
          metadata: Json | null
          output: string | null
          project_id: string | null
          result_type: string | null
          status: string
          step_id: string | null
          system_agent_id: string | null
          team_id: string | null
          title: string
          type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_team_api_key: { Args: { team_uuid: string }; Returns: string }
      is_member_of_team: {
        Args: { _team_id: string; _user_id: string }
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
  public: {
    Enums: {},
  },
} as const
