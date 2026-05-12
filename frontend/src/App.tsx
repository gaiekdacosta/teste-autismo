import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { Home } from './pages/Home'
import { OurServices } from './pages/OurServices'
import { supabase } from './utils/supabase'
import { ConfigPage } from './pages/Config'
import { MyTestsPage } from './pages/MyTests'
import { SchedulingPage } from './pages/Scheduling'
import { QuestionnairePage } from './pages/Questionnaire'
import { AdminPage } from './pages/admin/Admin'
import { UsersPage } from './pages/admin/Users'
import Layout from './components/Layout'


function persistAuthSession(session: Session | null) {
  if (!session?.access_token) {
    localStorage.removeItem('auth.session')
    return
  }

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
    },
  }))
}

type ProtectedRouteProps = {
  isAuthenticated: boolean
  isLoading: boolean
}

function ProtectedRoute({
  isAuthenticated,
  isLoading,
}: ProtectedRouteProps) {
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-sm text-[var(--muted)]">
        Verificando sessão...
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(Boolean(session?.access_token))
        persistAuthSession(session)
      }
    )

    async function refreshSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session) {
          setIsAuthenticated(false)
          persistAuthSession(null)
        } else {
          setIsAuthenticated(true)
          persistAuthSession(data.session)
        }
      } catch (err) {
        console.error('Erro ao renovar sessão:', err)
        setIsAuthenticated(false)
        persistAuthSession(null)
      } finally {
        setIsAuthLoading(false)
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
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={<RegisterPage />}
        />
        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              isLoading={isAuthLoading}
            />
          }
        >
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/nossos-servicos" element={<OurServices />} />
          <Route path="/meus-testes" element={<MyTestsPage />} />
          <Route path="/meus-agendamentos" element={<SchedulingPage />} />
          <Route path="/questionario" element={<QuestionnairePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
