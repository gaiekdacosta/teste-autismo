import { useEffect, useState } from 'react'
import {
    FiEdit3,
    FiPlus,
    FiSave,
    FiTrash2,
    FiUsers,
    FiX,
} from 'react-icons/fi'
import { Button } from '../ui/Button'
import {
    createAdministrador,
    deleteAdministrador,
    listAdministradores,
    updateAdministrador,
} from '../../services/administradores'
import type { Administrador } from '../../services/administradores'

type AdministradorForm = {
    id: string | null
    email: string
    ativo: boolean
}

const inputClassName =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]'

const sectionClassName =
    'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6'

function getAdminErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message
    }

    return 'Não foi possível salvar o administrador.'
}

export function MenuAdministrator() {
    const [administradores, setAdministradores] = useState<Administrador[]>([])
    const [administradorForm, setAdministradorForm] = useState<AdministradorForm>({
        id: null,
        email: '',
        ativo: true,
    })
    const [isLoadingAdministradores, setIsLoadingAdministradores] = useState(true)
    const [isSavingAdministrador, setIsSavingAdministrador] = useState(false)
    const [adminErrorMessage, setAdminErrorMessage] = useState('')
    const [adminSuccessMessage, setAdminSuccessMessage] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        async function loadAdministradores() {
            try {
                setIsLoadingAdministradores(true)
                setAdminErrorMessage('')
                const data = await listAdministradores(controller.signal)
                setAdministradores(data)
            } catch (error) {
                if (controller.signal.aborted) return
                setAdminErrorMessage(getAdminErrorMessage(error))
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingAdministradores(false)
                }
            }
        }

        void loadAdministradores()

        return () => controller.abort()
    }, [])

    function resetAdministradorForm() {
        setAdministradorForm({
            id: null,
            email: '',
            ativo: true,
        })
    }

    function editAdministrador(administrador: Administrador) {
        setAdministradorForm({
            id: administrador.id,
            email: administrador.email,
            ativo: administrador.ativo,
        })
        setAdminErrorMessage('')
        setAdminSuccessMessage('')
    }

    async function handleSaveAdministrador() {
        const emailValue = administradorForm.email.trim().toLowerCase()

        if (!emailValue) {
            setAdminErrorMessage('Informe o e-mail do usuário.')
            return
        }

        try {
            setIsSavingAdministrador(true)
            setAdminErrorMessage('')
            setAdminSuccessMessage('')

            const payload = {
                email: emailValue,
                ativo: administradorForm.ativo,
            }

            const savedAdministrador = administradorForm.id
                ? await updateAdministrador(administradorForm.id, payload)
                : await createAdministrador(payload)

            setAdministradores((currentAdministradores) => {
                const alreadyExists = currentAdministradores.some(
                    (administrador) => administrador.id === savedAdministrador.id,
                )

                if (alreadyExists) {
                    return currentAdministradores.map((administrador) =>
                        administrador.id === savedAdministrador.id ? savedAdministrador : administrador,
                    )
                }

                return [savedAdministrador, ...currentAdministradores]
            })
            resetAdministradorForm()
            setAdminSuccessMessage('Administrador salvo.')
        } catch (error) {
            setAdminErrorMessage(getAdminErrorMessage(error))
        } finally {
            setIsSavingAdministrador(false)
        }
    }

    async function handleDeleteAdministrador(administrador: Administrador) {
        const shouldDelete = window.confirm(`Remover o administrador ${administrador.email}?`)

        if (!shouldDelete) return

        try {
            setAdminErrorMessage('')
            setAdminSuccessMessage('')
            await deleteAdministrador(administrador.id)
            setAdministradores((currentAdministradores) =>
                currentAdministradores.filter((currentAdministrador) => (
                    currentAdministrador.id !== administrador.id
                )),
            )

            if (administradorForm.id === administrador.id) {
                resetAdministradorForm()
            }

            setAdminSuccessMessage('Administrador removido.')
        } catch (error) {
            setAdminErrorMessage(getAdminErrorMessage(error))
        }
    }

    return (
        <section className={sectionClassName}>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <FiUsers className="h-5 w-5 text-[var(--primary)]" />
                    <h2 className="text-lg font-semibold">Administradores</h2>
                </div>

                <span className="text-sm text-[var(--muted)]">
                    {isLoadingAdministradores ? 'Carregando...' : `${administradores.length} cadastrados`}
                </span>
            </div>

            <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_160px_128px]">
                <label className="block space-y-2">
                    <span className="text-sm font-medium">E-mail do usuário</span>
                    <input
                        type="email"
                        value={administradorForm.email}
                        onChange={(event) =>
                            setAdministradorForm((currentForm) => ({
                                ...currentForm,
                                email: event.target.value,
                            }))
                        }
                        className={inputClassName}
                        placeholder="usuario@email.com"
                    />
                </label>

                <div className="space-y-2">
                    <span className="block text-sm font-medium">Status</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={administradorForm.ativo}
                        onClick={() =>
                            setAdministradorForm((currentForm) => ({
                                ...currentForm,
                                ativo: !currentForm.ativo,
                            }))
                        }
                        className={`flex h-[50px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${administradorForm.ativo
                            ? 'border-green-500/30 bg-green-500/15 text-green-300'
                            : 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300'
                            }`}
                    >
                        <span>{administradorForm.ativo ? 'Ativo' : 'Inativo'}</span>
                        <span
                            className={`flex h-6 w-11 items-center rounded-full p-1 transition ${administradorForm.ativo ? 'bg-green-500' : 'bg-yellow-500'
                                }`}
                        >
                            <span
                                className={`h-4 w-4 rounded-full bg-white transition ${administradorForm.ativo ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </span>
                    </button>
                </div>

                <div className="space-y-2">
                    <span className="block text-sm font-medium opacity-0">Ação</span>
                    <Button
                        type="button"
                        onClick={handleSaveAdministrador}
                        disabled={isSavingAdministrador}
                        className="w-full gap-2"
                    >
                        {administradorForm.id ? <FiSave size={18} /> : <FiPlus size={18} />}
                        {isSavingAdministrador
                            ? 'Salvando...'
                            : administradorForm.id
                                ? 'Atualizar'
                                : 'Adicionar'}
                    </Button>
                </div>
            </div>

            {adminErrorMessage && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {adminErrorMessage}
                </div>
            )}

            {adminSuccessMessage && (
                <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    {adminSuccessMessage}
                </div>
            )}

            <div className="mt-5 space-y-3">
                {isLoadingAdministradores && (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
                        Carregando administradores...
                    </div>
                )}

                {!isLoadingAdministradores && administradores.length === 0 && (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
                        Nenhum administrador cadastrado.
                    </div>
                )}

                {administradores.map((administrador) => (
                    <div
                        key={administrador.id}
                        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 md:flex-row md:items-center md:justify-between"
                    >
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="break-all text-sm font-semibold text-[var(--foreground)]">
                                    {administrador.email}
                                </p>
                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${administrador.ativo
                                        ? 'border-green-500/30 bg-green-500/15 text-green-300'
                                        : 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300'
                                        }`}
                                >
                                    {administrador.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <p className="mt-2 break-all text-xs text-[var(--muted)]">
                                ID do usuário: {administrador.id_user}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    administradorForm.id === administrador.id
                                        ? resetAdministradorForm()
                                        : editAdministrador(administrador)
                                }
                                className="w-full gap-2 sm:w-auto"
                            >
                                {administradorForm.id === administrador.id ? (
                                    <FiX size={16} />
                                ) : (
                                    <FiEdit3 size={16} />
                                )}
                                {administradorForm.id === administrador.id ? 'Cancelar' : 'Editar'}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleDeleteAdministrador(administrador)}
                                className="w-full gap-2 sm:w-auto"
                            >
                                <FiTrash2 size={16} />
                                Remover
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
