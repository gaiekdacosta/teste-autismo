import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'

import { Button } from '../components/ui/Button'
import {
    getGoogleAuthorizationUrl,
    registerWithPassword,
} from '../services/auth'

type FormState = {
    name: string
    email: string
    phone: string
    password: string
    confirmPassword: string
}

const initialFormState: FormState = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
}

function normalizePhone(phone: string) {
    const onlyNumbers = phone.replace(/\D/g, '')

    if (onlyNumbers.startsWith('55')) {
        return `+${onlyNumbers}`
    }

    return `+55${onlyNumbers}`
}

export function RegisterPage() {
    const navigate = useNavigate()

    const [form, setForm] = useState<FormState>(initialFormState)
    const [errorMessage, setErrorMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const isFormValid = useMemo(() => {
        const phoneNumbers = form.phone.replace(/\D/g, '')

        return (
            form.name.trim().length >= 3 &&
            /\S+@\S+\.\S+/.test(form.email) &&
            phoneNumbers.length >= 10 &&
            phoneNumbers.length <= 13 &&
            form.password.trim().length >= 6 &&
            form.password === form.confirmPassword
        )
    }, [form])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const phoneNumbers = form.phone.replace(/\D/g, '')

        if (form.name.trim().length < 3) {
            setErrorMessage('Informe um nome com pelo menos 3 caracteres.')
            return
        }

        if (!/\S+@\S+\.\S+/.test(form.email)) {
            setErrorMessage('Informe um e-mail válido.')
            return
        }

        if (phoneNumbers.length < 10 || phoneNumbers.length > 13) {
            setErrorMessage('Informe um número de celular válido.')
            return
        }

        if (form.password.trim().length < 6) {
            setErrorMessage('A senha deve ter pelo menos 6 caracteres.')
            return
        }

        if (form.password !== form.confirmPassword) {
            setErrorMessage('As senhas não coincidem.')
            return
        }

        try {
            setIsSubmitting(true)
            setErrorMessage('')

            const response = await registerWithPassword({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: normalizePhone(form.phone),
                password: form.password,
            })

            if (response.tokens?.accessToken) {
                navigate('/home', { replace: true })
                return
            }

            navigate('/', {
                replace: true,
                state: {
                    registeredEmail: form.email.trim(),
                    registrationMessage:
                        'Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.',
                },
            })
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Não foi possível criar a conta.'
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
            setErrorMessage('Erro ao iniciar cadastro com Google.')
        } finally {
            setIsGoogleLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-10">
            <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <span className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                        Plataforma clínica
                    </span>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)]">
                        Criar conta
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        Cadastre-se para acessar avaliações e agendamentos.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            Nome completo
                        </label>

                        <input
                            type="text"
                            value={form.name}
                            placeholder="Seu nome"
                            onChange={(e) =>
                                setForm((old) => ({
                                    ...old,
                                    name: e.target.value,
                                }))
                            }
                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                        />
                    </div>

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
                            Celular
                        </label>

                        <input
                            type="tel"
                            value={form.phone}
                            placeholder="(85) 99999-9999"
                            onChange={(e) =>
                                setForm((old) => ({
                                    ...old,
                                    phone: e.target.value,
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
                                placeholder="Crie uma senha"
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">
                            Confirmar senha
                        </label>

                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={form.confirmPassword}
                                placeholder="Repita a senha"
                                onChange={(e) =>
                                    setForm((old) => ({
                                        ...old,
                                        confirmPassword: e.target.value,
                                    }))
                                }
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 pr-12 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                            />

                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((old) => !old)}
                                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--muted)] transition hover:text-[var(--foreground)]"
                                aria-label={
                                    showConfirmPassword
                                        ? 'Ocultar confirmação de senha'
                                        : 'Mostrar confirmação de senha'
                                }
                            >
                                {showConfirmPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                            </button>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {errorMessage}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isGoogleLoading}
                        onClick={handleGoogleSignIn}
                        className="w-full text-2xl"
                    >
                        {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'}{' '}
                        <FcGoogle size={25} />
                    </Button>
                </form>

                <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
                    <p className="text-sm text-[var(--muted)]">Já possui conta?</p>

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="mt-3 font-medium text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
                    >
                        Voltar para login
                    </button>
                </div>
            </section>
        </main>
    )
}