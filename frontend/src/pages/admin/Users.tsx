import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
    FiAlertCircle,
    FiCheckCircle,
    FiDownload,
    FiMail,
    FiPhone,
    FiSearch,
    FiUser,
    FiUsers,
} from 'react-icons/fi'

import { Navbar } from '../../components/Navbar'
import { Accordeon, type AccordeonItem } from '../../components/ui/Accordeon'
import { generateTestResultPDF } from '../../services/generatePDF'
import type { Teste } from '../../services/testes'
import { listUsuarios, type UsuarioSistema } from '../../services/usuarios'

const sectionClassName = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6'
const panelClassName = 'rounded-xl border border-[var(--border)] bg-[var(--surface)]'

function getText(value?: string | null, fallback = 'Não informado') {
    return value?.trim() || fallback
}

function formatDate(value?: string | null) {
    if (!value) return 'Não informado'

    return new Date(value).toLocaleDateString('pt-BR')
}

function formatDateTime(value?: string | null) {
    if (!value) return 'Não informado'

    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatStatus(status: string) {
    const labels: Record<string, string> = {
        concluido: 'Concluído',
        agendado: 'Agendado',
        em_andamento: 'Em andamento',
        cancelado: 'Cancelado',
    }

    return labels[status] ?? status
}

function getTestStatusStyle(status: string) {
    if (status === 'concluido') return 'border-green-500/30 bg-green-500/15 text-green-300'
    if (status === 'agendado') return 'border-blue-500/30 bg-blue-500/15 text-blue-300'
    if (status === 'em_andamento') return 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300'

    return 'border-red-500/30 bg-red-500/15 text-red-300'
}

function getUserStatusStyle(user: UsuarioSistema) {
    if (user.last_sign_in_at) return 'border-green-500/30 bg-green-500/15 text-green-300'

    return 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300'
}

function getWhatsappUrl(phone?: string | null) {
    if (!phone) return '#'

    const digits = phone.replace(/\D/g, '')
    const number = digits.startsWith('55') ? digits : `55${digits}`
    const message = encodeURIComponent('Olá, estou entrando em contato pela plataforma clínica.')

    return `https://wa.me/${number}?text=${message}`
}

function canDownloadTest(teste: Teste) {
    return teste.status === 'concluido'
}

function getUserName(user: UsuarioSistema) {
    return getText(user.name, 'Usuário sem nome')
}

export function UsersPage() {
    const [users, setUsers] = useState<UsuarioSistema[]>([])
    const [openUserId, setOpenUserId] = useState('')
    const [search, setSearch] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)

    useEffect(() => {
        async function loadUsers() {
            try {
                setIsLoading(true)
                setError('')
                const data = await listUsuarios()
                setUsers(data)
                setOpenUserId((currentId) => currentId || data[0]?.id || '')
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar usuários.')
            } finally {
                setIsLoading(false)
            }
        }

        loadUsers()
    }, [])

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase()

        if (!term) return users

        return users.filter((user) =>
            [user.name, user.email, user.phone, user.id].some((value) =>
                getText(value, '').toLowerCase().includes(term),
            ),
        )
    }, [search, users])

    const handleDownloadTest = (user: UsuarioSistema, teste: Teste) => {
        if (!canDownloadTest(teste)) return

        setGeneratingPdfId(teste.id)
        generateTestResultPDF(teste, {
            name: getUserName(user),
            email: user.email ?? undefined,
            phone: user.phone ?? undefined,
            birthDate: user.birthDate ?? undefined,
            gender: user.gender ?? undefined,
        })
        setGeneratingPdfId(null)
    }

    const accordeonItems: AccordeonItem[] = filteredUsers.map((user) => ({
        id: user.id,
        header: <UserHeader user={user} />,
        content: (
            <UserDetails
                user={user}
                generatingPdfId={generatingPdfId}
                onDownloadTest={handleDownloadTest}
            />
        ),
    }))

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Navbar />

            <main className="min-h-screen px-4 pb-10 pt-20 md:ml-[280px] md:px-8 md:py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <section className={sectionClassName}>
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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
                                        Consulte os usuários em lista vertical e expanda cada cadastro para ver contatos, dados e testes.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--muted)]">
                                <span className="font-semibold text-[var(--foreground)]">{users.length}</span> cadastrados
                            </div>
                        </div>
                    </section>

                    <section className={sectionClassName}>
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Lista de usuários</h2>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                    Clique em um usuário para expandir as informações.
                                </p>
                            </div>

                            <label className="relative block w-full lg:max-w-sm">
                                <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar usuário"
                                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] py-3 pl-11 pr-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]"
                                />
                            </label>
                        </div>

                        {isLoading && (
                            <div className={`${panelClassName} p-4 text-sm text-[var(--muted)]`}>
                                Carregando usuários...
                            </div>
                        )}

                        {!isLoading && error && (
                            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {!isLoading && !error && (
                            <Accordeon
                                items={accordeonItems}
                                openItemId={openUserId}
                                onOpenChange={setOpenUserId}
                                emptyMessage="Nenhum usuário encontrado."
                            />
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}

type UserHeaderProps = {
    user: UsuarioSistema
}

function UserHeader({ user }: UserHeaderProps) {
    const completedTests = user.testes.filter((teste) => teste.status === 'concluido').length

    return (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                    <FiUser className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold">{getUserName(user)}</h3>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getUserStatusStyle(user)}`}>
                            {user.last_sign_in_at ? 'Ativo' : 'Sem acesso recente'}
                        </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">{getText(user.email)}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
                    {completedTests}/{user.testes.length} testes concluídos
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
                    Criado em {formatDate(user.created_at)}
                </span>
            </div>
        </div>
    )
}

type UserDetailsProps = {
    user: UsuarioSistema
    generatingPdfId: string | null
    onDownloadTest: (user: UsuarioSistema, teste: Teste) => void
}

function UserDetails({ user, generatingPdfId, onDownloadTest }: UserDetailsProps) {
    const downloadableTests = user.testes.filter(canDownloadTest).length

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row">
                <a
                    href={`mailto:${user.email ?? ''}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    aria-disabled={!user.email}
                >
                    <FiMail className="h-4 w-4" />
                    E-mail
                </a>
                <a
                    href={getWhatsappUrl(user.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--primary)]/50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    aria-disabled={!user.phone}
                >
                    <FiPhone className="h-4 w-4" />
                    Número
                </a>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row">
                <InfoColumn title="Cadastro">
                    <DetailRow label="Nome completo" value={getUserName(user)} />
                    <DetailRow label="ID do usuário" value={user.id} />
                    <DetailRow label="Nascimento" value={formatDate(user.birthDate)} />
                    <DetailRow label="Gênero" value={getText(user.gender)} />
                </InfoColumn>

                <InfoColumn title="Acompanhamento">
                    <DetailRow label="Conta criada" value={formatDateTime(user.created_at)} />
                    <DetailRow label="Último acesso" value={formatDateTime(user.last_sign_in_at)} />
                    <DetailRow label="Testes para baixar" value={String(downloadableTests)} />
                    <DetailRow label="Testes realizados" value={String(user.testes.length)} />
                </InfoColumn>

                <InfoColumn title="Contato">
                    <DetailRow label="E-mail" value={getText(user.email)} />
                    <DetailRow label="Telefone" value={getText(user.phone)} />
                </InfoColumn>
            </div>

            <section>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <FiCheckCircle className="h-5 w-5 text-[var(--primary)]" />
                        <h4 className="font-semibold">Testes</h4>
                    </div>
                    <span className="text-sm text-[var(--muted)]">{user.testes.length} registrados</span>
                </div>

                <div className="flex flex-col gap-3">
                    {user.testes.map((teste) => (
                        <article key={teste.id} className={`${panelClassName} p-4`}>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                                            Teste
                                        </span>
                                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTestStatusStyle(teste.status)}`}>
                                            {formatStatus(teste.status)}
                                        </span>
                                    </div>
                                    <h5 className="mt-3 font-semibold">{teste.questionario?.titulo || 'Teste de rastreio'}</h5>
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        {formatDateTime(teste.finished_at ?? teste.updated_at ?? teste.created_at)}
                                    </p>
                                    {teste.classificacao && (
                                        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                                            {teste.classificacao}
                                        </p>
                                    )}
                                    <p className="mt-2 text-sm text-[var(--muted)]">
                                        Pontuação: <span className="font-semibold text-[var(--foreground)]">{teste.pontuacao_total}</span>
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onDownloadTest(user, teste)}
                                    disabled={!canDownloadTest(teste) || generatingPdfId === teste.id}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                                >
                                    <FiDownload className="h-4 w-4" />
                                    {generatingPdfId === teste.id ? 'Gerando PDF...' : 'Baixar teste'}
                                </button>
                            </div>
                        </article>
                    ))}

                    {user.testes.length === 0 && (
                        <div className={`${panelClassName} p-4 text-sm text-[var(--muted)]`}>
                            Nenhum teste encontrado para este usuário.
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

type DetailRowProps = {
    label: string
    value: string
}

type InfoColumnProps = {
    title: string
    children: ReactNode
}

function InfoColumn({ title, children }: InfoColumnProps) {
    return (
        <div className="flex min-w-0 flex-1 flex-col">
            <h4 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{title}</h4>
            <div className={panelClassName}>{children}</div>
        </div>
    )
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <div className="flex flex-col gap-1 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="break-words text-sm font-semibold">{value}</p>
        </div>
    )
}
