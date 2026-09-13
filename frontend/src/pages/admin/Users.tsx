import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
    FiAlertCircle,
    FiCheckCircle,
    FiCheckSquare,
    FiDownload,
    FiMail,
    FiMessageSquare,
    FiPhone,
    FiSearch,
    FiShoppingBag,
    FiSquare,
    FiTrash2,
    FiUnlock,
    FiUser,
    FiUsers,
} from 'react-icons/fi'

import { Navbar } from '../../components/Navbar'
import { Accordeon, type AccordeonItem } from '../../components/ui/Accordeon'
import { useToast } from '../../components/ui/Toast'
import { generateTestResultPDF } from '../../services/generatePDF'
import { releaseServicePurchase, type ServicePurchase } from '../../services/servicos'
import { deleteTeste, getContato, type Teste } from '../../services/testes'
import {
    deleteUsuario,
    listUsuarios,
    setUsuarioContatado,
    type UsuarioSistema,
} from '../../services/usuarios'

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

function formatPriceCents(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })
}

function formatPurchaseStatus(status: string) {
    const labels: Record<string, string> = {
        paid: 'Pago / Liberado',
        pending: 'Pendente',
    }

    return labels[status] ?? status
}

function getPurchaseStatusStyle(status: string) {
    if (status === 'paid') return 'border-green-500/30 bg-green-500/15 text-green-300'

    return 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300'
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

// Numero em formato legivel para exibir no cabecalho do card: (11) 91234-5678
function formatPhoneDisplay(phone?: string | null) {
    const digits = (phone ?? '').replace(/\D/g, '')
    if (!digits) return null

    const local = digits.startsWith('55') ? digits.slice(2) : digits
    if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
    if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`

    return phone?.trim() || null
}

function formatPhoneDigits(phone: string) {
    const digits = phone.replace(/\D/g, '')
    return digits.startsWith('55') ? digits : `55${digits}`
}

// Abre o WhatsApp apontando para o SEU numero (o configurado em Admin > Contato),
// com os dados do paciente no corpo — funciona como um alerta para voce mesmo.
function getAlertWhatsappUrl(user: UsuarioSistema, destinoWhatsapp: string) {
    const destino = formatPhoneDigits(destinoWhatsapp)
    const lines = [
        'Paciente novo teste de autismo:',
        getUserName(user),
        ...(user.email ? [user.email] : []),
        ...(user.phone ? ['', `+${formatPhoneDigits(user.phone)}`] : []),
    ]
    const message = encodeURIComponent(lines.join('\n'))

    return `https://wa.me/${destino}?text=${message}`
}

type ContatadoFilter = 'todos' | 'contatados' | 'nao-contatados'

const CONTATADO_FILTER_OPTIONS: { value: ContatadoFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'nao-contatados', label: 'Não contatados' },
    { value: 'contatados', label: 'Já contatados' },
]

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
    const [contatadoFilter, setContatadoFilter] = useState<ContatadoFilter>('todos')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)
    const [releasingPurchaseId, setReleasingPurchaseId] = useState<string | null>(null)
    const [contatandoUserId, setContatandoUserId] = useState<string | null>(null)
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
    const [deletingTesteId, setDeletingTesteId] = useState<string | null>(null)
    const [contatoWhatsapp, setContatoWhatsapp] = useState<string | null>(null)
    const toast = useToast()

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

    useEffect(() => {
        getContato()
            .then((data) => setContatoWhatsapp(data?.whatsapp?.trim() || null))
            .catch(() => setContatoWhatsapp(null))
    }, [])

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase()

        return users.filter((user) => {
            if (contatadoFilter === 'contatados' && !user.contatado) return false
            if (contatadoFilter === 'nao-contatados' && user.contatado) return false

            if (!term) return true

            return [user.name, user.email, user.phone, user.id].some((value) =>
                getText(value, '').toLowerCase().includes(term),
            )
        })
    }, [contatadoFilter, search, users])

    const handleDownloadTest = (user: UsuarioSistema, teste: Teste) => {
        if (!canDownloadTest(teste)) return

        setGeneratingPdfId(teste.id)
        generateTestResultPDF(teste, {
            name: getUserName(user),
            email: user.email ?? undefined,
            phone: user.phone ?? undefined,
        })
        setGeneratingPdfId(null)
    }

    const handleReleasePurchase = async (purchase: ServicePurchase) => {
        try {
            setReleasingPurchaseId(purchase.id)
            const updated = await releaseServicePurchase(purchase.id)
            setUsers((current) =>
                current.map((user) =>
                    user.id === updated.id_user
                        ? {
                              ...user,
                              compras: user.compras.map((compra) =>
                                  compra.id === updated.id ? updated : compra,
                              ),
                          }
                        : user,
                ),
            )
            toast.success('Acesso liberado com sucesso.')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao liberar acesso.')
        } finally {
            setReleasingPurchaseId(null)
        }
    }

    const handleToggleContatado = async (user: UsuarioSistema) => {
        const next = !user.contatado

        try {
            setContatandoUserId(user.id)
            const updated = await setUsuarioContatado(user.id, next)
            setUsers((current) =>
                current.map((item) =>
                    item.id === updated.id
                        ? { ...item, contatado: updated.contatado, contatado_em: updated.contatado_em }
                        : item,
                ),
            )
            toast.success(next ? 'Usuário marcado como contatado.' : 'Marcação de contato removida.')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status de contato.')
        } finally {
            setContatandoUserId(null)
        }
    }

    const handleDeleteUser = async (user: UsuarioSistema) => {
        const confirmed = window.confirm(
            `Excluir o usuário "${getUserName(user)}"?\n\nEsta ação remove a conta e TODOS os dados vinculados (testes, avaliados, compras) e não pode ser desfeita.`,
        )

        if (!confirmed) return

        try {
            setDeletingUserId(user.id)
            await deleteUsuario(user.id)
            setUsers((current) => current.filter((item) => item.id !== user.id))
            setOpenUserId((currentId) => (currentId === user.id ? '' : currentId))
            toast.success('Usuário excluído com sucesso.')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao excluir usuário.')
        } finally {
            setDeletingUserId(null)
        }
    }

    const handleDeleteTeste = async (user: UsuarioSistema, teste: Teste) => {
        const confirmed = window.confirm(
            'Excluir este teste (procedimento realizado)?\n\nEsta ação não pode ser desfeita.',
        )

        if (!confirmed) return

        try {
            setDeletingTesteId(teste.id)
            await deleteTeste(teste.id)
            setUsers((current) =>
                current.map((item) =>
                    item.id === user.id
                        ? { ...item, testes: item.testes.filter((t) => t.id !== teste.id) }
                        : item,
                ),
            )
            toast.success('Teste excluído com sucesso.')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao excluir teste.')
        } finally {
            setDeletingTesteId(null)
        }
    }

    const accordeonItems: AccordeonItem[] = filteredUsers.map((user) => ({
        id: user.id,
        header: (
            <UserHeader
                user={user}
                isSavingContatado={contatandoUserId === user.id}
                onToggleContatado={handleToggleContatado}
            />
        ),
        content: (
            <UserDetails
                user={user}
                contatoWhatsapp={contatoWhatsapp}
                generatingPdfId={generatingPdfId}
                onDownloadTest={handleDownloadTest}
                releasingPurchaseId={releasingPurchaseId}
                onReleasePurchase={handleReleasePurchase}
                deletingUserId={deletingUserId}
                deletingTesteId={deletingTesteId}
                onDeleteUser={handleDeleteUser}
                onDeleteTeste={handleDeleteTeste}
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

                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            {CONTATADO_FILTER_OPTIONS.map((option) => {
                                const isActive = contatadoFilter === option.value

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setContatadoFilter(option.value)}
                                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                            isActive
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                                                : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted)] hover:border-[var(--primary)]/50'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                )
                            })}
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
    isSavingContatado: boolean
    onToggleContatado: (user: UsuarioSistema) => void
}

function UserHeader({ user, isSavingContatado, onToggleContatado }: UserHeaderProps) {
    const completedTests = user.testes.filter((teste) => teste.status === 'concluido').length
    const whatsapp = formatPhoneDisplay(user.phone)

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
                    {whatsapp && (
                        <p className="mt-1 flex items-center gap-1.5 truncate text-sm font-medium text-green-300">
                            <FiPhone className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{whatsapp}</span>
                        </p>
                    )}
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">{getText(user.email)}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                <ContatadoCheckbox
                    contatado={user.contatado}
                    isSaving={isSavingContatado}
                    onToggle={() => onToggleContatado(user)}
                />
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

type ContatadoCheckboxProps = {
    contatado: boolean
    isSaving: boolean
    onToggle: () => void
}

// Renderizado dentro do botão do acordeão, entao usamos um <span role="checkbox">
// (span e conteudo valido dentro de <button>) e paramos a propagacao do clique
// para alternar o status sem expandir/recolher o item.
function ContatadoCheckbox({ contatado, isSaving, onToggle }: ContatadoCheckboxProps) {
    const handle = (event: { stopPropagation: () => void; preventDefault: () => void }) => {
        event.stopPropagation()
        event.preventDefault()
        if (!isSaving) onToggle()
    }

    return (
        <span
            role="checkbox"
            aria-checked={contatado}
            aria-label="Já contatado"
            aria-busy={isSaving}
            tabIndex={0}
            onClick={handle}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') handle(event)
            }}
            className={`inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-3 py-1 transition ${
                contatado
                    ? 'border-green-500/30 bg-green-500/15 text-green-300'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50'
            } ${isSaving ? 'pointer-events-none opacity-60' : ''}`}
        >
            {contatado ? <FiCheckSquare className="h-4 w-4" /> : <FiSquare className="h-4 w-4" />}
            {contatado ? 'Já contatado' : 'Marcar contatado'}
        </span>
    )
}

type UserDetailsProps = {
    user: UsuarioSistema
    contatoWhatsapp: string | null
    generatingPdfId: string | null
    onDownloadTest: (user: UsuarioSistema, teste: Teste) => void
    releasingPurchaseId: string | null
    onReleasePurchase: (purchase: ServicePurchase) => void
    deletingUserId: string | null
    deletingTesteId: string | null
    onDeleteUser: (user: UsuarioSistema) => void
    onDeleteTeste: (user: UsuarioSistema, teste: Teste) => void
}

function UserDetails({
    user,
    contatoWhatsapp,
    generatingPdfId,
    onDownloadTest,
    releasingPurchaseId,
    onReleasePurchase,
    deletingUserId,
    deletingTesteId,
    onDeleteUser,
    onDeleteTeste,
}: UserDetailsProps) {
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
                <a
                    href={contatoWhatsapp ? getAlertWhatsappUrl(user, contatoWhatsapp) : '#'}
                    target="_blank"
                    rel="noreferrer"
                    title={contatoWhatsapp ? undefined : 'Configure o WhatsApp em Admin > Contato'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--primary)]/50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    aria-disabled={!contatoWhatsapp}
                >
                    <FiMessageSquare className="h-4 w-4" />
                    Mensagem padrão
                </a>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row">
                <InfoColumn title="Cadastro">
                    <DetailRow label="Nome completo" value={getUserName(user)} />
                    <DetailRow label="ID do usuário" value={user.id} />
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
                        <FiShoppingBag className="h-5 w-5 text-[var(--primary)]" />
                        <h4 className="font-semibold">Compras e acesso</h4>
                    </div>
                    <span className="text-sm text-[var(--muted)]">{user.compras.length} registradas</span>
                </div>

                <div className="flex flex-col gap-3">
                    {user.compras.map((compra) => {
                        const isPaid = compra.status === 'paid'
                        const isReleasing = releasingPurchaseId === compra.id

                        return (
                            <article key={compra.id} className={`${panelClassName} p-4`}>
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPurchaseStatusStyle(compra.status)}`}>
                                                {formatPurchaseStatus(compra.status)}
                                            </span>
                                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                                                {formatPriceCents(compra.service_price_cents)}
                                            </span>
                                        </div>
                                        <h5 className="mt-3 font-semibold">{compra.service_name}</h5>
                                        <p className="mt-2 text-sm text-[var(--muted)]">
                                            Comprado em {formatDateTime(compra.created_at)}
                                        </p>
                                    </div>

                                    {!isPaid && (
                                        <button
                                            type="button"
                                            onClick={() => onReleasePurchase(compra)}
                                            disabled={isReleasing}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                                        >
                                            <FiUnlock className="h-4 w-4" />
                                            {isReleasing ? 'Liberando...' : 'Liberar acesso'}
                                        </button>
                                    )}
                                </div>
                            </article>
                        )
                    })}

                    {user.compras.length === 0 && (
                        <div className={`${panelClassName} p-4 text-sm text-[var(--muted)]`}>
                            Nenhuma compra registrada para este usuário.
                        </div>
                    )}
                </div>
            </section>

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

                                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => onDownloadTest(user, teste)}
                                        disabled={!canDownloadTest(teste) || generatingPdfId === teste.id}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                                    >
                                        <FiDownload className="h-4 w-4" />
                                        {generatingPdfId === teste.id ? 'Gerando PDF...' : 'Baixar teste'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteTeste(user, teste)}
                                        disabled={deletingTesteId === teste.id}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                                    >
                                        <FiTrash2 className="h-4 w-4" />
                                        {deletingTesteId === teste.id ? 'Excluindo...' : 'Excluir'}
                                    </button>
                                </div>
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

            <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h4 className="font-semibold text-red-300">Excluir usuário</h4>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            Remove a conta e todos os dados vinculados (testes, avaliados, compras). Ação irreversível.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onDeleteUser(user)}
                        disabled={deletingUserId === user.id}
                        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        <FiTrash2 className="h-4 w-4" />
                        {deletingUserId === user.id ? 'Excluindo...' : 'Excluir usuário'}
                    </button>
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
