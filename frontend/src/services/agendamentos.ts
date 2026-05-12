import { supabase } from '../utils/supabase'

export type Agendamento = {
  id: string
  id_user: string
  id_teste: string | null
  status: string
  data_agendamento: string
  created_at: string
  updated_at: string
}

export async function listAgendamentos() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return []
  }

  const { data, error } = await supabase
    .from('agendamentos')
    .select('id, id_user, id_teste, status, data_agendamento, created_at, updated_at')
    .eq('id_user', user.id)
    .order('data_agendamento', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as Agendamento[]
}
