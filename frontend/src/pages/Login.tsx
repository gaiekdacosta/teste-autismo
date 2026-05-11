import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'

import { Button } from '../components/ui/Button'
import { getGoogleAuthorizationUrl, loginWithPassword } from '../services/auth'

type FormState = {
    email: string
    password: string
}

const initialFormState: FormState = {
    email: '',
    password: '',
}

type LoginLocationState = {
    registeredEmail?: string
    registrationMessage?: string
    from?: string
}

export function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const locationState = location.state as LoginLocationState | null
    const [redirectPath] = useState(locationState?.from ?? '/home')

    const [form, setForm] = useState<FormState>({
        ...initialFormState,
        email: locationState?.registeredEmail ?? '',
    })
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState(
        locationState?.registrationMessage ?? ''
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const isFormValid = useMemo(() => {
        return /\S+@\S+\.\S+/.test(form.email) && form.password.trim().length >= 6
    }, [form])

    useEffect(() => {
        if (!locationState) {
            return
        }

        navigate(location.pathname, { replace: true, state: null })
    }, [location.pathname, locationState, navigate])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!isFormValid) {
            setErrorMessage('Informe um e-mail válido e senha com 6 caracteres.')
            return
        }

        try {
            setIsSubmitting(true)
            setErrorMessage('')
            setSuccessMessage('')

            await loginWithPassword({
                email: form.email.trim(),
                password: form.password,
            })

            navigate(redirectPath, { replace: true })
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível autenticar.'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleGoogleSignIn() {
        try {
            setIsGoogleLoading(true)
            setErrorMessage('')

            const authorizationUrl = await getGoogleAuthorizationUrl(
                window.location.href
            )

            window.location.assign(authorizationUrl)
        } catch {
            setErrorMessage('Erro ao iniciar login com Google.')
        } finally {
            setIsGoogleLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-(--background) px-6 py-10">
            <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <span className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                        Plataforma clínica
                    </span>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)]">
                        Laudo de Autismo
                    </h1>

                    <p className="mt-2  font-medium text-[var(--primary)]">
                        Dr. Tiago Marinho
                    </p>

                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        Acesse sua conta para ter acesso a avalições e agendamentos.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            E-mail
                        </label>

                        <input
                            type="email"
                            value={form.email}
                            placeholder="Seu e-mail"
                            onChange={(e) =>
                                setForm((old) => ({
                                    ...old,
                                    email: e.target.value,
                                }))
                            }
                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            Senha
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                placeholder="Sua senha"
                                onChange={(e) =>
                                    setForm((old) => ({
                                        ...old,
                                        password: e.target.value,
                                    }))
                                }
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 pr-12 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((old) => !old)}
                                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--muted)] transition hover:text-[var(--foreground)]"
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                            </button>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {successMessage}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isGoogleLoading}
                        onClick={handleGoogleSignIn}
                        className="w-full text-2xl"
                    >
                        {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'} <FcGoogle size={25} />
                    </Button>
                </form>

                <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
                    <p className="text-sm text-[var(--muted)]">
                        Ainda não possui conta?
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate('/register')}
                        className="mt-3 font-medium text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
                    >
                        Criar cadastro
                    </button>
                </div>
            </section>
        </main>
    )
}
