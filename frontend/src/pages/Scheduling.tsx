import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCalendar, FiCheckCircle, FiMail, FiMessageCircle, FiPhone, FiShoppingCart } from 'react-icons/fi'
import { Navbar } from '../components/Navbar'
import { getContato, type Contato } from '../services/testes'

/*
const scheduledAppointments: Appointment[] = [
    {
        id: 1,
        title: 'Consulta para Indentificar Espectro Autista',
        date: '2026-05-08',
        time: '09:30',
        professional: 'Dr. Tiago Marinho',
        status: 'Confirmado',
    },
]

function formatSelectedDate(value: string) {
    const [year, month, day] = value.split('-')

    return `${day}/${month}/${year}`
}
*/

type ContactInfo = Pick<Contato, 'whatsapp' | 'email'>

type Appointment = {
    id: string
    title: string
    date: string
    time: string
    status: string
}

const defaultContact: ContactInfo = {
    whatsapp: '(11) 99999-9999',
    email: 'contato@clinica.com',
}

const appointments: Appointment[] = []

function normalizeContact(contact?: Partial<ContactInfo> | null): ContactInfo {
    return {
        whatsapp: contact?.whatsapp?.trim() || defaultContact.whatsapp,
        email: contact?.email?.trim() || defaultContact.email,
    }
}

function formatWhatsappUrlNumber(whatsapp?: string) {
    if (!whatsapp) {
        return formatWhatsappUrlNumber(defaultContact.whatsapp)
    }

    const digits = whatsapp.replace(/\D/g, '')

    if (digits.startsWith('55')) {
        return digits
    }

    return `55${digits}`
}

export function SchedulingPage() {
    const navigate = useNavigate()
    const [contact, setContact] = useState<ContactInfo>(defaultContact)
    const hasAppointments = appointments.length > 0

    useEffect(() => {
        let isMounted = true

        async function loadContact() {
            try {
                const data = await getContato()

                if (isMounted) {
                    setContact(normalizeContact(data))
                }
            } catch {
                if (isMounted) {
                    setContact(defaultContact)
                }
            }
        }

        void loadContact()

        return () => {
            isMounted = false
        }
    }, [])

    function handleWhatsAppMessage() {
        const message = encodeURIComponent('Olá, gostaria de mais informações sobre agendamentos de consulta.')
        const whatsappNumber = formatWhatsappUrlNumber(contact.whatsapp)
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')
    }

    function handleEmailContact() {
        const subject = encodeURIComponent('Agendamento de Consulta - Informações')
        const body = encodeURIComponent('Olá, gostaria de mais informações sobre como agendar minha consulta para avaliação do espectro autista.')
        window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`)
    }

    if (!hasAppointments) {
        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                <Navbar />

                <main className="min-h-screen px-4 pb-10 pt-20 md:ml-[280px] md:px-8 md:py-8">
                    <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[#070707] p-6 md:p-8">
                        <div className="flex flex-col items-start gap-5 sm:flex-row">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15">
                                <FiCalendar className="h-6 w-6 text-[var(--primary)]" />
                            </div>

                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-[var(--foreground)] md:text-2xl">
                                    Você ainda não possui agendamentos
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                                    Para solicitar uma consulta, primeiro escolha um serviço disponível para compra.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate('/nossos-servicos')}
                                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] sm:w-auto"
                                >
                                    <FiShoppingCart className="h-4 w-4" />
                                    Ver serviços
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Navbar />

            <main className="min-h-screen px-4 pb-10 pt-20 md:ml-[280px] md:px-8 md:py-8">
                <section className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[#070707] p-5 md:p-8">
                    <div className="text-center">
                        <div className="mb-6 inline-flex items-center justify-center rounded-full bg-[var(--success)]/20 p-4">
                            <FiCheckCircle className="h-8 w-8 text-[var(--success)]" />
                        </div>
                        <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)] md:text-3xl">
                            Parabéns pela sua iniciativa!
                        </h1>
                        <p className="mb-8 text-lg text-[var(--muted)]">
                            Você deu o primeiro passo para uma compreensão melhor do espectro autista.
                        </p>
                    </div>

                    <div className="mt-8">
                        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--foreground)]">
                            <FiCalendar className="h-5 w-5 text-[var(--primary)]" />
                            Meus agendamentos
                        </h2>

                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="font-semibold text-[var(--foreground)]">
                                                {appointment.title}
                                            </h3>
                                            <p className="mt-2 text-sm text-[var(--muted)]">
                                                {appointment.date} às {appointment.time}
                                            </p>
                                        </div>
                                        <span className="w-fit rounded-full bg-[var(--primary)]/15 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                                            {appointment.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                        <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">
                            Sobre nosso serviço de avaliação
                        </h2>
                        <div className="space-y-3 text-sm text-[var(--muted)]">
                            <p>
                                • Avaliação completa com especialista em neurodesenvolvimento
                            </p>
                            <p>
                                • Relatório detalhado com orientações personalizadas
                            </p>
                            <p>
                                • Atendimento humanizado e acolhedor para toda família
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">
                            Entre em contato conosco
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                                <div className="mb-3 flex items-center gap-3">
                                    <FiPhone className="h-5 w-5 text-[var(--primary)]" />
                                    <span className="font-medium text-[var(--foreground)]">Telefone/WhatsApp</span>
                                </div>
                                <p className="mb-4 text-sm text-[var(--muted)]">{contact.whatsapp}</p>
                                <button
                                    type="button"
                                    onClick={handleWhatsAppMessage}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                                >
                                    <FiMessageCircle className="h-4 w-4" />
                                    Enviar mensagem
                                </button>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                                <div className="mb-3 flex items-center gap-3">
                                    <FiMail className="h-5 w-5 text-[var(--primary)]" />
                                    <span className="font-medium text-[var(--foreground)]">E-mail</span>
                                </div>
                                <p className="mb-4 text-sm text-[var(--muted)]">{contact.email}</p>
                                <button
                                    type="button"
                                    onClick={handleEmailContact}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
                                >
                                    <FiMail className="h-4 w-4" />
                                    Enviar e-mail
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                        <p className="text-sm text-yellow-400 font-medium">
                            <span className="font-semibold">Importante:</span> Nossa secretária entrará em contato com você no prazo de 24-48 horas úteis para agendar sua consulta e fornecer todas as orientações necessárias.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    )
}
