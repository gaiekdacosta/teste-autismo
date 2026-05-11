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
    birthDate: string
    gender: string
    password: string
    confirmPassword: string
}

const initialFormState: FormState = {
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    password: '',
    confirmPassword: '',
}

const fieldClassName =
    'h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]'

const passwordFieldClassName = `${fieldClassName} pr-12`

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
            form.birthDate !== '' &&
            form.gender !== '' &&
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

        if (form.birthDate === '') {
            setErrorMessage('Informe a data de nascimento.')
            return
        }

        if (form.gender === '') {
            setErrorMessage('Informe o gênero.')
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
                birthDate: form.birthDate,
                gender: form.gender,
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
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8">
            <section className="grid w-full max-w-6xl gap-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:p-10 xl:p-12">
                <div className="text-center lg:flex lg:flex-col lg:justify-center lg:text-left">
                    <span className="mx-auto inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)] lg:mx-0">
                        Plataforma clínica
                    </span>

                    <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                        Criar conta
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        Cadastre-se para acessar avaliações e agendamentos.
                    </p>

                    <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[var(--muted)] lg:mx-0">
                        Nossa plataforma oferece suporte especializado para avaliações clínicas e acompanhamento personalizado. Com ferramentas intuitivas e profissionais qualificados, facilitamos o acesso a cuidados essenciais com segurança e privacidade.
                    </p>

                    <ul className="mx-auto mt-6 max-w-xl space-y-3 text-left text-sm text-[var(--muted)] lg:mx-0">
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"></span>
                            Avaliações clínicas especializadas
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"></span>
                            Agendamento simplificado
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"></span>
                            Acompanhamento personalizado
                        </li>
                    </ul>
                </div>

                <div className="w-full">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--foreground)]">
                                    Nome completo
                                </label>

                                <input
                                    type="text"
                                    value={form.name}
                                    placeholder="Seu nome completo"
                                    onChange={(e) =>
                                        setForm((old) => ({
                                            ...old,
                                            name: e.target.value,
                                        }))
                                    }
                                    className={fieldClassName}
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
                                    className={fieldClassName}
                                />
                            </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
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
                                    className={fieldClassName}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--foreground)]">
                                    Data de nascimento
                                </label>

                                <input
                                    type="date"
                                    value={form.birthDate}
                                    onChange={(e) =>
                                        setForm((old) => ({
                                            ...old,
                                            birthDate: e.target.value,
                                        }))
                                    }
                                    className={fieldClassName}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]">
                                Gênero
                            </label>

                            <select
                                value={form.gender}
                                onChange={(e) =>
                                    setForm((old) => ({
                                        ...old,
                                        gender: e.target.value,
                                    }))
                                }
                                className={fieldClassName}
                            >
                                <option value="">Selecione</option>
                                <option value="masculino">Masculino</option>
                                <option value="feminino">Feminino</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
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
                                        className={passwordFieldClassName}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((old) => !old)}
                                        className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--muted)] transition hover:text-[var(--foreground)]"
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
                                        className={passwordFieldClassName}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((old) => !old)}
                                        className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--muted)] transition hover:text-[var(--foreground)]"
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
                        </div>

                        {errorMessage && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {errorMessage}
                            </div>
                        )}

                        <div className="space-y-4 pt-1">
                            <Button
                                type="submit"
                                disabled={!isFormValid || isSubmitting}
                                className="h-12 w-full"
                            >
                                {isSubmitting ? 'Criando conta...' : 'Criar conta'}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                disabled={isGoogleLoading}
                                onClick={handleGoogleSignIn}
                                className="h-12 w-full gap-2"
                            >
                                {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'}
                                <FcGoogle size={22} />
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
                        <p className="text-sm text-[var(--muted)]">Já possui conta?</p>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="mt-3 font-medium text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
                        >
                            Voltar para login
                        </button>
                    </div>
                </div>
            </section>
        </main>
    )
}
