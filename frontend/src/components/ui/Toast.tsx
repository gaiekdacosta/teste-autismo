import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react'
import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'

export type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
    id: number
    type: ToastType
    message: string
}

type ToastApi = {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

// Erros ficam mais tempo na tela para facilitar a leitura de anomalias.
const AUTO_DISMISS_MS: Record<ToastType, number> = {
    success: 4000,
    info: 4000,
    error: 7000,
}

const toastStyles: Record<ToastType, string> = {
    success: 'border-green-500/30 bg-green-500/15 text-green-200',
    error: 'border-red-500/40 bg-red-500/10 text-red-200',
    info: 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)]',
}

const toastIcons: Record<ToastType, IconType> = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    info: FiInfo,
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const idRef = useRef(0)

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    const push = useCallback(
        (type: ToastType, message: string) => {
            idRef.current += 1
            const id = idRef.current
            setToasts((current) => [...current, { id, type, message }])
            window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS[type])
        },
        [dismiss],
    )

    const api = useMemo<ToastApi>(
        () => ({
            success: (message) => push('success', message),
            error: (message) => push('error', message),
            info: (message) => push('info', message),
        }),
        [push],
    )

    return (
        <ToastContext.Provider value={api}>
            {children}

            <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
                {toasts.map((toast) => {
                    const Icon = toastIcons[toast.type]

                    return (
                        <div
                            key={toast.id}
                            role="status"
                            aria-live="polite"
                            className={`animate-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${toastStyles[toast.type]}`}
                        >
                            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                            <span className="flex-1 leading-6">{toast.message}</span>
                            <button
                                type="button"
                                onClick={() => dismiss(toast.id)}
                                className="shrink-0 rounded-md p-1 opacity-70 transition hover:opacity-100"
                                aria-label="Fechar notificação"
                            >
                                <FiX className="h-4 w-4" />
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
    const context = useContext(ToastContext)

    if (!context) {
        throw new Error('useToast deve ser usado dentro de <ToastProvider>.')
    }

    return context
}
