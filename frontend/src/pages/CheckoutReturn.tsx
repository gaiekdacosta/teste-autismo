import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi'
import { Navbar } from '@/components/Navbar'
import { confirmServicePurchase, type ServicePurchase } from '@/services/servicos'

type CheckoutStatus = 'checking' | 'paid' | 'pending' | 'error'

function getParam(params: URLSearchParams, keys: string[]) {
  return keys.map((key) => params.get(key)).find((value) => value && value.trim().length > 0) ?? null
}

export function CheckoutReturnPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<CheckoutStatus>('checking')
  const [purchase, setPurchase] = useState<ServicePurchase | null>(null)
  const [message, setMessage] = useState('Confirmando pagamento...')

  const checkoutData = useMemo(() => {
    const orderNsu = getParam(searchParams, ['order_nsu', 'orderNsu', 'order_id'])

    return {
      order_nsu: orderNsu ?? '',
      transaction_nsu: getParam(searchParams, ['transaction_nsu', 'transactionNsu']) ?? undefined,
      slug: getParam(searchParams, ['slug']) ?? undefined,
      invoice_slug: getParam(searchParams, ['invoice_slug', 'invoiceSlug']) ?? undefined,
      capture_method: getParam(searchParams, ['capture_method', 'captureMethod']) ?? undefined,
      receipt_url: getParam(searchParams, ['receipt_url', 'receiptUrl']) ?? undefined,
    }
  }, [searchParams])

  useEffect(() => {
    let isActive = true

    async function confirmPayment() {
      if (!checkoutData.order_nsu) {
        setStatus('error')
        setMessage('Não foi possível identificar o pedido retornado pela InfinitePay.')
        return
      }

      try {
        setStatus('checking')
        const confirmedPurchase = await confirmServicePurchase(checkoutData)

        if (!isActive) return

        setPurchase(confirmedPurchase)

        if (confirmedPurchase.status === 'paid') {
          setStatus('paid')
          setMessage('Pagamento confirmado. Seu acesso já foi liberado.')
          return
        }

        setStatus('pending')
        setMessage('Pagamento ainda não confirmado. Tente atualizar em alguns instantes.')
      } catch (error) {
        if (!isActive) return

        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Não foi possível confirmar o pagamento.')
      }
    }

    void confirmPayment()

    return () => {
      isActive = false
    }
  }, [checkoutData])

  const Icon = status === 'paid' ? FiCheckCircle : status === 'error' ? FiAlertCircle : FiClock

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="px-4 pb-10 pt-20 md:ml-[280px] md:px-8 md:py-8">
        <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
              <Icon className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {status === 'paid' ? 'Compra aprovada' : 'Status da compra'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>
            </div>
          </div>

          {purchase && (
            <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
              <p className="text-sm font-semibold">{purchase.service_name}</p>
              <p className="mt-1 break-all text-xs text-[var(--muted)]">Pedido: {purchase.order_nsu}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/questionario')}
              disabled={status !== 'paid'}
              className="inline-flex justify-center rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-black transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Iniciar teste
            </button>
            <button
              type="button"
              onClick={() => navigate('/nossos-servicos')}
              className="inline-flex justify-center rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--surface-secondary)]"
            >
              Ver serviços
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
