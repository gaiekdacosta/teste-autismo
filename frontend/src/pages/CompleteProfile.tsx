import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLogOut, FiPhone } from 'react-icons/fi'

import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { clearStoredSession } from '../services/auth'
import { supabase } from '../utils/supabase'
import { getPhoneDigits, isValidPhone, normalizePhone } from '../utils/phone'

const fieldClassName =
  'h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]'

export function CompleteProfilePage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [phone, setPhone] = useState('')
  const [firstName, setFirstName] = useState('')
  const [touched, setTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isActive || !user) return

      const meta = user.user_metadata ?? {}
      const fullName: string = meta.name || meta.full_name || ''
      setFirstName(fullName.trim().split(' ')[0] ?? '')

      const existingPhone = meta.phone || user.phone
      if (typeof existingPhone === 'string') {
        setPhone(existingPhone)
      }
    }

    void loadUser()

    return () => {
      isActive = false
    }
  }, [])

  const phoneError = useMemo(() => {
    const digits = getPhoneDigits(phone)
    if (digits.length === 0) return 'Informe seu número de celular.'
    if (!isValidPhone(phone)) return 'Informe um número de celular válido.'
    return ''
  }, [phone])

  const inputClassName = useMemo(() => {
    if (touched && phoneError) {
      return fieldClassName
        .replace('border-[var(--border)]', 'border-red-500')
        .replace('focus:border-[var(--primary)]', 'focus:border-red-500')
    }
    return fieldClassName
  }, [touched, phoneError])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)

    if (phoneError) return

    try {
      setIsSubmitting(true)

      // Preserva os demais metadados e grava o telefone em user_metadata,
      // seguindo o mesmo padrão da tela de configurações.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const currentMeta = user?.user_metadata ?? {}

      const { error } = await supabase.auth.updateUser({
        data: {
          ...currentMeta,
          phone: normalizePhone(phone),
        },
      })

      if (error) throw new Error(error.message)

      toast.success('Cadastro concluído com sucesso!')
      navigate('/home', { replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar seu número. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    clearStoredSession()
    navigate('/', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--primary)]">
            <FiPhone size={24} />
          </span>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            {firstName ? `Falta pouco, ${firstName}!` : 'Falta pouco!'}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Precisamos do seu número de celular para entrar em contato sobre
            suas avaliações e agendamentos. É rápido e só pediremos uma vez.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Celular
            </label>

            <input
              id="phone"
              type="tel"
              autoFocus
              value={phone}
              placeholder="(85) 99999-9999"
              onChange={(event) => setPhone(event.target.value)}
              onBlur={() => setTouched(true)}
              className={inputClassName}
            />

            {touched && phoneError && (
              <p className="mt-1 text-xs text-red-500">{phoneError}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full"
          >
            {isSubmitting ? 'Salvando...' : 'Concluir cadastro'}
          </Button>
        </form>

        <div className="mt-6 border-t border-[var(--border)] pt-6 text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            <FiLogOut size={16} />
            Sair da conta
          </button>
        </div>
      </section>
    </main>
  )
}
