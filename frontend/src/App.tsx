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
import { CheckoutReturnPage } from './pages/CheckoutReturn'
import { AdminPage } from './pages/admin/Admin'
import { UsersPage } from './pages/admin/Users'
import Layout from './components/Layout'
import {
  clearCachedAdminAccess,
  getAdministradorAtual,
  getCachedAdminAccess,
} from './services/administradores'
import { notifyCurrentUserRegistration } from './services/auth'


function persistAuthSession(session: Session | null) {
  if (!session?.access_token) {
    localStorage.removeItem('auth.session')
    clearCachedAdminAccess()
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

type AdminRouteProps = {
  hasAdminAccess: boolean
  isLoading: boolean
}

function AdminRoute({ hasAdminAccess, isLoading }: AdminRouteProps) {
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-sm text-[var(--muted)]">
        Verificando acesso administrativo...
      </main>
    )
  }

  if (!hasAdminAccess) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [hasAdminAccess, setHasAdminAccess] = useState(() => getCachedAdminAccess() === true)
  const [isAdminLoading, setIsAdminLoading] = useState(false)
  const [hasCheckedAdminAccess, setHasCheckedAdminAccess] = useState(false)
  const [adminCheckVersion, setAdminCheckVersion] = useState(0)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        persistAuthSession(session)

        if (!session?.access_token) {
          setIsAuthenticated(false)
          setHasAdminAccess(false)
          setIsAdminLoading(false)
          setHasCheckedAdminAccess(false)
          return
        }

        setIsAuthenticated(true)
        setHasAdminAccess(getCachedAdminAccess() === true)
        setIsAdminLoading(false)
        setHasCheckedAdminAccess(false)
        setAdminCheckVersion((currentVersion) => currentVersion + 1)
      }
    )

    async function refreshSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session) {
          setIsAuthenticated(false)
          setHasAdminAccess(false)
          setIsAdminLoading(false)
          setHasCheckedAdminAccess(false)
          persistAuthSession(null)
        } else {
          setIsAuthenticated(true)
          setHasAdminAccess(getCachedAdminAccess() === true)
          setIsAdminLoading(false)
          setHasCheckedAdminAccess(false)
          setAdminCheckVersion((currentVersion) => currentVersion + 1)
          persistAuthSession(data.session)
        }
      } catch (err) {
        console.error('Erro ao renovar sessão:', err)
        setIsAuthenticated(false)
        setHasAdminAccess(false)
        setIsAdminLoading(false)
        setHasCheckedAdminAccess(false)
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

  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated) {
      return
    }

    let isActive = true

    async function checkAdminAccess() {
      try {
        setIsAdminLoading(true)
        await getAdministradorAtual()

        if (isActive) {
          setHasAdminAccess(true)
          setHasCheckedAdminAccess(true)
        }
      } catch {
        if (isActive) {
          setHasAdminAccess(false)
          setHasCheckedAdminAccess(true)
        }
      } finally {
        if (isActive) {
          setIsAdminLoading(false)
        }
      }
    }

    void checkAdminAccess()

    return () => {
      isActive = false
    }
  }, [isAuthenticated, isAuthLoading, adminCheckVersion])

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return

    void notifyCurrentUserRegistration().catch(() => {
      // A notificacao nao deve bloquear o acesso do usuario.
    })
  }, [isAuthenticated, isAuthLoading, adminCheckVersion])

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
          <Route path="/checkout/retorno" element={<CheckoutReturnPage />} />
          <Route path="/meus-testes" element={<MyTestsPage />} />
          <Route path="/meus-agendamentos" element={<SchedulingPage />} />
          <Route path="/questionario" element={<QuestionnairePage />} />
          <Route
            element={
              <AdminRoute
                hasAdminAccess={hasAdminAccess}
                isLoading={isAdminLoading || !hasCheckedAdminAccess}
              />
            }
          >
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
