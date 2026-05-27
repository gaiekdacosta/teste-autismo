import { useEffect, useState } from 'react'
import { FiMail, FiMessageCircle, FiSave, FiMessageSquare } from 'react-icons/fi'
import { Button } from '../ui/Button'
import { getContato, updateContato } from '../../services/testes'

const inputClassName =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]'

const sectionClassName =
    'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6'

export function Contact() {
    const [whatsapp, setWhatsapp] = useState('')
    const [email, setEmail] = useState('')
    const [mensagem, setMensagem] = useState('') // ✅ Novo estado
    const [isLoadingContato, setIsLoadingContato] = useState(true)
    const [isSavingContato, setIsSavingContato] = useState(false)
    const [contatoErrorMessage, setContatoErrorMessage] = useState('')
    const [contatoSuccessMessage, setContatoSuccessMessage] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        async function loadContato() {
            try {
                setIsLoadingContato(true)
                setContatoErrorMessage('')
                const data = await getContato()
                if (data) {
                    setWhatsapp(data.whatsapp)
                    setEmail(data.email)
                    setMensagem(data.mensagem || '') // ✅ Carrega a mensagem padrão
                }
            } catch {
                if (controller.signal.aborted) return
                setContatoErrorMessage('Não foi possível carregar os dados de contato.')
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingContato(false)
                }
            }
        }

        void loadContato()

        return () => controller.abort()
    }, [])

    async function handleSaveContato() {
        const whatsappValue = whatsapp.trim()
        const emailValue = email.trim().toLowerCase()
        const mensagemValue = mensagem.trim()

        if (!whatsappValue) {
            setContatoErrorMessage('Informe o número de WhatsApp.')
            return
        }

        if (!emailValue) {
            setContatoErrorMessage('Informe o e-mail de contato.')
            return
        }

        if (!mensagemValue) {
            setContatoErrorMessage('Informe a mensagem padrão do WhatsApp.')
            return
        }

        try {
            setIsSavingContato(true)
            setContatoErrorMessage('')
            setContatoSuccessMessage('')

            await updateContato({
                whatsapp: whatsappValue,
                email: emailValue,
                mensagem: mensagemValue,
            })

            setContatoSuccessMessage('Dados de contato atualizados com sucesso.')
        } catch (error) {
            setContatoErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível salvar os dados de contato.',
            )
        } finally {
            setIsSavingContato(false)
        }
    }

    return (
        <section className={sectionClassName}>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <FiMessageCircle className="h-5 w-5 text-[var(--primary)]" />
                    <h2 className="text-lg font-semibold">Contato</h2>
                </div>

                <span className="text-sm text-[var(--muted)]">
                    {isLoadingContato ? 'Carregando...' : 'Dados de contato'}
                </span>
            </div>

            <div className="grid gap-4">
                {/* WhatsApp */}
                <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <FiMessageCircle size={16} />
                        Número do WhatsApp
                    </span>
                    <input
                        type="tel"
                        value={whatsapp}
                        onChange={(event) => setWhatsapp(event.target.value)}
                        className={inputClassName}
                        placeholder="(85) 99999-9999"
                        disabled={isLoadingContato}
                    />
                </label>

                {/* E-mail */}
                <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <FiMail size={16} />
                        E-mail
                    </span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={inputClassName}
                        placeholder="contato@clinica.com"
                        disabled={isLoadingContato}
                    />
                </label>

                {/* ✅ Mensagem Padrão do WhatsApp - Campo adicionado */}
                <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <FiMessageSquare size={16} />
                        Mensagem Padrão do WhatsApp
                    </span>
                    <textarea
                        value={mensagem}
                        onChange={(event) => setMensagem(event.target.value)}
                        className={`${inputClassName} min-h-[100px] resize-y`}
                        placeholder="Olá! Gostaria de mais informações sobre os serviços..."
                        disabled={isLoadingContato}
                        rows={3}
                    />
                    <span className="text-xs text-[var(--muted)]">
                        Esta mensagem será enviada automaticamente ao clicar no link do WhatsApp
                    </span>
                </label>

                {/* Botão Salvar */}
                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={handleSaveContato}
                        disabled={isSavingContato || isLoadingContato}
                        className="gap-2"
                    >
                        <FiSave size={18} />
                        {isSavingContato ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </div>

            {contatoErrorMessage && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {contatoErrorMessage}
                </div>
            )}

            {contatoSuccessMessage && (
                <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    {contatoSuccessMessage}
                </div>
            )}
        </section>
    )
}