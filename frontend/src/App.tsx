import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { Home } from './pages/Home'

function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-2xl">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-2xl bg-[var(--primary)] px-5 py-3 font-medium text-black transition hover:bg-[var(--primary-hover)]"
        >
          Voltar para login
        </Link>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/register"
        element={<RegisterPage />}
      />
      <Route
        path="/home"
        element={<Home />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
