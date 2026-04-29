import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { Home } from './pages/Home'
import { OurServices } from './pages/OurServices'
import { supabase } from './utils/supabase'
import { ConfigPage } from './pages/Config'
import { MyTestsPage } from './pages/MyTests'
import { SchedulingPage } from './pages/Scheduling'
import { QuestionnairePage } from './pages/questionnaire'
import Layout from './components/Layout'

export type Todo = {
  id: number
  name: string
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    async function getTodos() {
      const { data } = await supabase
        .from('todos')
        .select('id, name')

      if (data) {
        setTodos(data)
      }
    }

    void getTodos()
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('auth.session')
        }
        
        if (event === 'TOKEN_REFRESHED') {
          if (session?.access_token) {
            localStorage.setItem('auth.session', JSON.stringify({
              tokens: {
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                expiresIn: session.expires_in,
              },
              user: {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
                phone: session.user.user_metadata?.phone || session.user.phone,
                avatarUrl: session.user.user_metadata?.avatar_url,
              }
            }))
          }
        }
      }
    )

    async function refreshSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session) {
          localStorage.removeItem('auth.session')
        } else {
          localStorage.setItem('auth.session', JSON.stringify({
            tokens: {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresIn: data.session.expires_in,
            },
            user: {
              id: data.session.user.id,
              email: data.session.user.email!,
              name: data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name,
              phone: data.session.user.user_metadata?.phone || data.session.user.phone,
              avatarUrl: data.session.user.user_metadata?.avatar_url,
            }
          }))
        }
      } catch (err) {
        console.error('Erro ao renovar sessão:', err)
      }
    }

    void refreshSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/register"
          element={<RegisterPage />}
        />
        <Route
          path="/config"
          element={<ConfigPage />}
        />
        <Route
          path="/home"
          element={<Home todos={todos} />}
        />
        <Route
          path="/nossos-servicos"
          element={<OurServices />}
        />
        <Route
          path="/meus-testes"
          element={<MyTestsPage />}
        />
        <Route
          path="/meus-agendamentos"
          element={<SchedulingPage />}
        />
        <Route
          path="/questionario"
          element={<QuestionnairePage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
