import { useMemo, useState } from 'react'
import {
    FiCheckCircle,
    FiMail,
    FiPhone,
    FiSearch,
    FiUser,
    FiUsers,
} from 'react-icons/fi'

import { Navbar } from '../../components/Navbar'

type ProcedureStatus = 'concluido' | 'agendado' | 'em_andamento' | 'cancelado'

type Procedure = {
    id: string
    title: string
    type: string
    date: string
    status: ProcedureStatus
    result?: string
}

type AdminUser = {
    id: string
    name: string
    email: string
    phone: string
    document: string
    birthDate: string
    gender: string
    accountCreatedAt: string
    lastAccessAt: string
    status: 'ativo' | 'pendente'
    procedures: Procedure[]
}

const users: AdminUser[] = [
    {
        id: 'USR-001',
        name: 'Mariana Silva Rocha',
        email: 'mariana.rocha@email.com',
        phone: '(85) 98842-1120',
        document: '123.456.789-10',
        birthDate: '1994-08-16',
        gender: 'Feminino',
        accountCreatedAt: '2026-01-18T14:32:00',
        lastAccessAt: '2026-05-10T09:21:00',
        status: 'ativo',
        procedures: [
            {
                id: 'PROC-1021',
                title: 'Questionário de rastreio TEA',
                type: 'Teste',
                date: '2026-05-06T16:40:00',
                status: 'concluido',
                result: 'Classificação moderada',
            },
            {
                id: 'PROC-1022',
                title: 'Consulta de devolutiva',
                type: 'Consulta',
                date: '2026-05-14T10:00:00',
                status: 'agendado',
            },
        ],
    },
    {
        id: 'USR-002',
        name: 'Rafael Costa Almeida',
        email: 'rafael.almeida@email.com',
        phone: '(85) 99718-3344',
        document: '234.567.890-21',
        birthDate: '1988-11-03',
        gender: 'Masculino',
        accountCreatedAt: '2026-02-04T11:12:00',
        lastAccessAt: '2026-05-08T18:04:00',
        status: 'ativo',
        procedures: [
            {
                id: 'PROC-1030',
                title: 'Questionário de rastreio TEA',
                type: 'Teste',
                date: '2026-05-02T13:18:00',
                status: 'concluido',
                result: 'Classificação baixa',
            },
        ],
    },
    {
        id: 'USR-003',
        name: 'Camila Nogueira Freitas',
        email: 'camila.freitas@email.com',
        phone: '(85) 99177-8290',
        document: '345.678.901-32',
        birthDate: '2001-03-27',
        gender: 'Feminino',
        accountCreatedAt: '2026-04-22T08:45:00',
        lastAccessAt: '2026-05-11T07:58:00',
        status: 'pendente',
        procedures: [
            {
                id: 'PROC-1041',
                title: 'Questionário de rastreio TEA',
                type: 'Teste',
                date: '2026-05-11T08:05:00',
                status: 'em_andamento',
            },
        ],
    },
]

const sectionClassName = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6'

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('pt-BR')
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatStatus(status: ProcedureStatus) {
    const labels: Record<ProcedureStatus, string> = {
        concluido: 'Concluído',
        agendado: 'Agendado',
        em_andamento: 'Em andamento',
        cancelado: 'Cancelado',
    }

    return labels[status]
}

function getProcedureStatusStyle(status: ProcedureStatus) {
    if (status === 'concluido') return 'border-green-500/30 bg-green-500/15 text-green-300'
    if (status === 'agendado') return 'border-blue-500/30 bg-blue-500/15 text-blue-300'
    if (status === 'em_andamento') return 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300'

    return 'border-red-500/30 bg-red-500/15 text-red-300'
}

function getUserStatusStyle(status: AdminUser['status']) {
    if (status === 'ativo') return 'border-green-500/30 bg-green-500/15 text-green-300'

    return 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300'
}

function getWhatsappUrl(phone: string) {
    const digits = phone.replace(/\D/g, '')
    const number = digits.startsWith('55') ? digits : `55${digits}`
    const message = encodeURIComponent('Olá, estou entrando em contato pela plataforma clínica.')

    return `https://wa.me/${number}?text=${message}`
}

export function UsersPage() {
    const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '')
    const [search, setSearch] = useState('')

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase()

        if (!term) return users

        return users.filter((user) =>
            [user.name, user.email, user.phone, user.document].some((value) =>
                value.toLowerCase().includes(term),
            ),
        )
    }, [search])

    const selectedUser = users.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? users[0]
    const completedProcedures = selectedUser.procedures.filter((procedure) => procedure.status === 'concluido').length

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Navbar />

            <main className="min-h-screen px-4 pb-10 pt-20 md:ml-[280px] md:px-8 md:py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <section className={sectionClassName}>
                        <div className="flex items-start gap-3">
                            <FiUsers className="mt-1 h-5 w-5 text-[var(--foreground)]" />
                            <div>
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--primary)]">
                                    Administração
                                </span>
                                <h1 className="mt-2 text-xl font-bold md:text-2xl">
                                    Usuários cadastrados
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                                    Consulte informações do usuário, contato, criação da conta e procedimentos realizados.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                        <section className={sectionClassName}>
                            <div className="flex items-start gap-3">
                                <FiSearch className="mt-1 h-5 w-5 text-[var(--primary)]" />
                                <div>
                                    <h2 className="text-lg font-semibold">Usuários</h2>
                                    <p className="mt-1 text-sm text-[var(--muted)]">{users.length} cadastrados</p>
                                </div>
                            </div>

                            <label className="relative mt-5 block">
                                <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar usuário"
                                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] py-3 pl-11 pr-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]"
                                />
                            </label>

                            <div className="mt-5 space-y-3">
                                {filteredUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => setSelectedUserId(user.id)}
                                        className={`w-full rounded-xl border p-4 text-left transition ${
                                            selectedUser.id === user.id
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                                : 'border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--primary)]/50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                                                <FiUser className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h2 className="truncate text-sm font-semibold">{user.name}</h2>
                                                <p className="mt-1 truncate text-xs text-[var(--muted)]">{user.email}</p>
                                                <p className="mt-2 text-xs text-[var(--muted)]">
                                                    Criado em {formatDate(user.accountCreatedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {filteredUsers.length === 0 && (
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
                                        Nenhum usuário encontrado.
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="space-y-6">
                            <section className={sectionClassName}>
                                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-bold md:text-2xl">{selectedUser.name}</h2>
                                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getUserStatusStyle(selectedUser.status)}`}>
                                                {selectedUser.status === 'ativo' ? 'Ativo' : 'Pendente'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-[var(--muted)]">{selectedUser.id}</p>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <a
                                            href={`mailto:${selectedUser.email}`}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
                                        >
                                            <FiMail className="h-4 w-4" />
                                            E-mail
                                        </a>
                                        <a
                                            href={getWhatsappUrl(selectedUser.phone)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--primary)]/50"
                                        >
                                            <FiPhone className="h-4 w-4" />
                                            Número
                                        </a>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                                            Dados do usuário
                                        </h3>
                                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
                                            <DetailRow label="Nome completo" value={selectedUser.name} />
                                            <DetailRow label="Documento" value={selectedUser.document} />
                                            <DetailRow label="Data de nascimento" value={formatDate(selectedUser.birthDate)} />
                                            <DetailRow label="Gênero" value={selectedUser.gender} />
                                            <DetailRow label="Conta criada" value={formatDateTime(selectedUser.accountCreatedAt)} />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                                            Contato
                                        </h3>
                                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
                                            <DetailRow label="E-mail" value={selectedUser.email} />
                                            <DetailRow label="Telefone" value={selectedUser.phone} />
                                            <DetailRow label="Último acesso" value={formatDateTime(selectedUser.lastAccessAt)} />
                                            <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4 sm:flex-row">
                                                <a
                                                    href={`mailto:${selectedUser.email}`}
                                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--primary)]/50"
                                                >
                                                    <FiMail className="h-4 w-4 text-[var(--primary)]" />
                                                    Enviar e-mail
                                                </a>
                                                <a
                                                    href={getWhatsappUrl(selectedUser.phone)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--primary)]/50"
                                                >
                                                    <FiPhone className="h-4 w-4 text-[var(--primary)]" />
                                                    Contatar número
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className={sectionClassName}>
                                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <FiCheckCircle className="h-5 w-5 text-[var(--primary)]" />
                                        <h2 className="text-lg font-semibold">Procedimentos</h2>
                                    </div>
                                    <span className="text-sm text-[var(--muted)]">
                                        {completedProcedures} de {selectedUser.procedures.length} concluídos
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {selectedUser.procedures.map((procedure) => (
                                        <article
                                            key={procedure.id}
                                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                                                            {procedure.type}
                                                        </span>
                                                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getProcedureStatusStyle(procedure.status)}`}>
                                                            {formatStatus(procedure.status)}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-3 font-semibold">{procedure.title}</h3>
                                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                                        {formatDateTime(procedure.date)}
                                                    </p>
                                                    {procedure.result && (
                                                        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                                                            {procedure.result}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

type DetailRowProps = {
    label: string
    value: string
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <div className="grid gap-1 border-b border-[var(--border)] px-4 py-3 last:border-b-0 sm:grid-cols-[150px_1fr] sm:gap-4">
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="break-words text-sm font-semibold">{value}</p>
        </div>
    )
}
