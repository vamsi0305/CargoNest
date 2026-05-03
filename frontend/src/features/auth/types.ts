export type AuthUser = {
  id: number
  username: string
  email: string
  role_id: number | null
  role_name: string
  allowed_forms: string[]
  is_active: boolean
  created_at: string
}

export type AuthSession = {
  user: AuthUser
}

export type Role = {
  id: number
  name: string
  description: string
  is_system: boolean
}

export type AdminAuditLog = {
  id: number
  actor_user_id: number | null
  actor_username: string
  action: string
  target_type: string
  target_id: number | null
  target_label: string
  summary: string
  details: Record<string, unknown>
  created_at: string
}
