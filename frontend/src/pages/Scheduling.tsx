import { FiMessageCircle, FiMail, FiPhone, FiCheckCircle } from 'react-icons/fi'
import { Navbar } from '../components/Navbar'

type Appointment = {
    id: number
    title: string
    date: string
    time: string
    professional: string
    status: string
}

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

export function SchedulingPage() {
    function handleWhatsAppMessage() {
        const message = encodeURIComponent('Olá, gostaria de mais informações sobre agendamentos de consulta.')
        window.open(`https://wa.me/5511999999999?text=${message}`, '_blank')
    }

    function handleEmailContact() {
        const subject = encodeURIComponent('Agendamento de Consulta - Informações')
        const body = encodeURIComponent('Olá, gostaria de mais informações sobre como agendar minha consulta para avaliação do espectro autista.')
        window.open(`mailto:contato@clinica.com?subject=${subject}&body=${body}`)
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
                                <p className="mb-4 text-sm text-[var(--muted)]">(11) 99999-9999</p>
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
                                <p className="mb-4 text-sm text-[var(--muted)]">contato@clinica.com</p>
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

                    <div className="mt-10 border-t border-[var(--border)] pt-6">
                        <h2 className="text-base font-bold">Agendamentos</h2>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                            Confira abaixo os próximos atendimentos cadastrados.
                        </p>

                        <div className="mt-5 grid gap-3">
                            {scheduledAppointments.map((appointment) => {
                                return (
                                    <article
                                        key={appointment.id}
                                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <h3 className="font-semibold text-[var(--foreground)]">
                                                    {appointment.title}
                                                </h3>
                                                <p className="mt-1 text-sm text-[var(--muted)]">
                                                    {formatSelectedDate(appointment.date)} às {appointment.time}
                                                </p>
                                                <p className="mt-1 text-sm text-[var(--muted)]">
                                                    {appointment.professional}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="w-fit rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                                                    {appointment.status}
                                                </span>

                                            </div>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
