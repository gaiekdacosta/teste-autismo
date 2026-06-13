import { useMemo, useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLogOut } from 'react-icons/fi';

import { Button } from '../components/ui/Button';
import { clearStoredSession } from '../services/auth'; // só usamos logout
import { Navbar } from '../components/Navbar';
import { supabase } from '../utils/supabase'; // cliente importado diretamente

type FormState = {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
};

const initialFormState: FormState = {
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
};

function normalizePhone(phone: string) {
    const onlyNumbers = phone.replace(/\D/g, '');

    if (onlyNumbers.startsWith('55')) {
        return `+${onlyNumbers}`;
    }

    return `+55${onlyNumbers}`;
}

export function ConfigPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>(initialFormState);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                // getUser() sempre retorna os dados atualizados do servidor
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const meta = user.user_metadata || {};
                    setForm((prev) => ({
                        ...prev,
                        name: meta.name || '',
                        email: user.email || '',
                        phone: meta.phone || '',
                        birthDate: meta.birthDate || '',
                        gender: meta.gender || '',
                    }));
                } else {
                    navigate('/login');
                }
            } catch {
                navigate('/login');
            }
        }

        loadUser();
    }, [navigate]);

    const isProfileFormValid = useMemo(() => {
        const phoneNumbers = form.phone.replace(/\D/g, '');

        return (
            form.name.trim().length >= 3 &&
            /\S+@\S+\.\S+/.test(form.email) &&
            phoneNumbers.length >= 10 &&
            phoneNumbers.length <= 13 &&
            form.birthDate !== '' &&
            form.gender !== ''
        );
    }, [form]);

    const isPasswordFormValid = useMemo(() => {
        return (
            form.currentPassword.trim().length >= 6 &&
            form.newPassword.trim().length >= 6 &&
            form.newPassword === form.confirmNewPassword
        );
    }, [form]);

    async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const phoneNumbers = form.phone.replace(/\D/g, '');

        if (form.name.trim().length < 3) {
            setErrorMessage('Informe um nome com pelo menos 3 caracteres.');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(form.email)) {
            setErrorMessage('Informe um e-mail válido.');
            return;
        }

        if (phoneNumbers.length < 10 || phoneNumbers.length > 13) {
            setErrorMessage('Informe um número de celular válido.');
            return;
        }

        if (form.birthDate === '') {
            setErrorMessage('Informe a data de nascimento.');
            return;
        }

        if (form.gender === '') {
            setErrorMessage('Informe o gênero.');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage('');
            setSuccessMessage('');

            const normalizedPhone = normalizePhone(form.phone);

            // 1. Obter metadados atuais para não sobrescrever outros campos
            const { data: { user } } = await supabase.auth.getUser();
            const currentMeta = user?.user_metadata ?? {};

            // 2. Atualizar apenas name, phone, birthDate e gender dentro de user_metadata
            const { error } = await supabase.auth.updateUser({
                data: {
                    ...currentMeta,
                    name: form.name.trim(),
                    phone: normalizedPhone,
                    birthDate: form.birthDate,
                    gender: form.gender,
                },
            });

            if (error) throw new Error(error.message);

            // 3. Recarregar os dados frescos após atualização
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            const freshMeta = freshUser?.user_metadata ?? {};

            setForm((prev) => ({
                ...prev,
                name: freshMeta.name || form.name.trim(),
                email: freshUser?.email || prev.email,
                phone: freshMeta.phone || normalizedPhone,
                birthDate: freshMeta.birthDate || form.birthDate,
                gender: freshMeta.gender || form.gender,
            }));

            setSuccessMessage('Dados atualizados com sucesso!');
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Não foi possível atualizar os dados.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (form.currentPassword.trim().length < 6) {
            setErrorMessage('A senha atual deve ter pelo menos 6 caracteres.');
            return;
        }

        if (form.newPassword.trim().length < 6) {
            setErrorMessage('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (form.newPassword !== form.confirmNewPassword) {
            setErrorMessage('As senhas não coincidem.');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage('');
            setSuccessMessage('');

            const { error } = await supabase.auth.updateUser({
                password: form.newPassword,
            });

            if (error) throw new Error(error.message);

            setForm((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            }));

            setSuccessMessage('Senha atualizada com sucesso!');
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Não foi possível atualizar a senha.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleLogout() {
        clearStoredSession();
        navigate('/', { replace: true });
    }

    return (
        <div className="min-h-screen bg-[var(--background)] pt-16 md:pl-[280px] md:pt-0">
            <Navbar />

            <main className="flex w-full justify-center p-4 md:p-8">
                <section className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl md:p-8">
                    <div className="mb-8 text-center">
                        <span className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                            Configurações
                        </span>

                        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-3xl">
                            Meus dados
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                            Atualize suas informações pessoais e senha.
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                            {successMessage}
                        </div>
                    )}

                    <div className="space-y-8">
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
                                Dados pessoais
                            </h2>

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--foreground)]">
                                        Nome completo
                                    </label>

                                    <input
                                        type="text"
                                        value={form.name}
                                        placeholder="Seu nome"
                                        onChange={(event) =>
                                            setForm((old) => ({ ...old, name: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--foreground)]">
                                        E-mail
                                    </label>

                                    <input
                                        type="email"
                                        value={form.email}
                                        disabled
                                        className="w-full cursor-not-allowed rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--muted)] outline-none"
                                    />

                                    <p className="text-xs text-[var(--muted)]">
                                        O e-mail não pode ser alterado.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--foreground)]">
                                        Celular
                                    </label>

                                    <input
                                        type="tel"
                                        value={form.phone}
                                        placeholder="(85) 99999-9999"
                                        onChange={(event) =>
                                            setForm((old) => ({ ...old, phone: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--foreground)]">
                                        Data de nascimento
                                    </label>

                                    <input
                                        type="date"
                                        value={form.birthDate}
                                        onChange={(event) =>
                                            setForm((old) => ({ ...old, birthDate: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--foreground)]">
                                        Gênero
                                    </label>

                                    <select
                                        value={form.gender}
                                        onChange={(event) =>
                                            setForm((old) => ({ ...old, gender: event.target.value }))
                                        }
                                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="masculino">Masculino</option>
                                        <option value="feminino">Feminino</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!isProfileFormValid || isSubmitting}
                                    className="w-full"
                                >
                                    {isSubmitting ? 'Salvando...' : 'Salvar dados'}
                                </Button>
                            </form>
                        </div>

                        <div className="border-t border-[var(--border)] pt-8">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                                    Alterar senha
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setIsChangingPassword((old) => !old)}
                                    className="text-sm font-medium text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
                                >
                                    {isChangingPassword ? 'Cancelar' : 'Alterar'}
                                </button>
                            </div>

                            {isChangingPassword && (
                                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--foreground)]">
                                            Senha atual
                                        </label>

                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={form.currentPassword}
                                                placeholder="Digite sua senha atual"
                                                onChange={(event) =>
                                                    setForm((old) => ({
                                                        ...old,
                                                        currentPassword: event.target.value,
                                                    }))
                                                }
                                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 pr-12 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword((old) => !old)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                            >
                                                {showCurrentPassword ? (
                                                    <FiEye size={18} />
                                                ) : (
                                                    <FiEyeOff size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--foreground)]">
                                            Nova senha
                                        </label>

                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={form.newPassword}
                                                placeholder="Digite a nova senha"
                                                onChange={(event) =>
                                                    setForm((old) => ({
                                                        ...old,
                                                        newPassword: event.target.value,
                                                    }))
                                                }
                                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 pr-12 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword((old) => !old)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                            >
                                                {showNewPassword ? (
                                                    <FiEye size={18} />
                                                ) : (
                                                    <FiEyeOff size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--foreground)]">
                                            Confirmar nova senha
                                        </label>

                                        <div className="relative">
                                            <input
                                                type={showConfirmNewPassword ? 'text' : 'password'}
                                                value={form.confirmNewPassword}
                                                placeholder="Confirme a nova senha"
                                                onChange={(event) =>
                                                    setForm((old) => ({
                                                        ...old,
                                                        confirmNewPassword: event.target.value,
                                                    }))
                                                }
                                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 pr-12 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmNewPassword((old) => !old)
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                                            >
                                                {showConfirmNewPassword ? (
                                                    <FiEye size={18} />
                                                ) : (
                                                    <FiEyeOff size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!isPasswordFormValid || isSubmitting}
                                        className="w-full"
                                    >
                                        {isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
                                    </Button>
                                </form>
                            )}
                        </div>

                        <div className="border-t border-[var(--border)] pt-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleLogout}
                                className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                                <FiLogOut size={18} className="mr-2" />
                                Sair da conta
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}