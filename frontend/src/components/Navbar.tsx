import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    FiChevronDown,
    FiGrid,
    FiShoppingCart,
    FiClipboard,
    FiCalendar,
    FiSettings,
    FiSliders,
    FiUser,
    FiUsers,
} from "react-icons/fi";
import { Profile } from "./Profile";
import { IoExtensionPuzzleSharp } from "react-icons/io5";
import {
    getAdministradorAtual,
    getCachedAdminAccess,
} from "../services/administradores";

const menuItems = [
    { label: "Tela inicial", to: "/home", icon: FiGrid },
    { label: "Nossos Serviços", to: "/nossos-servicos", icon: FiShoppingCart },
    { label: "Meus Testes", to: "/meus-testes", icon: FiClipboard },
    { label: "Meus Agendamentos", to: "/meus-agendamentos", icon: FiCalendar },
    { label: "Configurações", to: "/config", icon: FiSettings },
];

const adminItems = [
    { label: "Central", to: "/admin", icon: FiSliders },
    { label: "Usuários", to: "/users", icon: FiUsers },
];

export function Navbar() {
    const location = useLocation()
    const [hasAdminAccess, setHasAdminAccess] = useState(() => getCachedAdminAccess() === true)
    const isAdminSectionActive = adminItems.some((item) => item.to === location.pathname)

    useEffect(() => {
        let isActive = true

        async function checkAdminAccess() {
            try {
                await getAdministradorAtual()

                if (isActive) {
                    setHasAdminAccess(true)
                }
            } catch {
                if (isActive) {
                    setHasAdminAccess(false)
                }
            }
        }

        void checkAdminAccess()

        return () => {
            isActive = false
        }
    }, [])

    return (
        <>
            <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-[var(--border)] bg-[var(--background)] px-4 py-6 md:flex">
                <div className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/10">
                            <IoExtensionPuzzleSharp className="text-3xl text-[var(--primary)]" />
                        </div>
                        <div>
                            <span className="mb-2 inline-block rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--primary)]">
                                Plataforma clínica
                            </span>
                            <h1 className="text-lg font-bold leading-tight text-[var(--foreground)]">
                                Laudo de Autismo
                            </h1>
                            <p className="text-sm text-[var(--muted)]">
                                Dr. Tiago Marinho
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-3 px-1">
                    <span className="text-sm text-[var(--muted)]">Seções</span>
                </div>

                <nav className="flex flex-col gap-2">
                    {menuItems.map(({ label, to, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                                    isActive
                                        ? "bg-[var(--surface-secondary)] text-[var(--foreground)]"
                                        : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                                }`
                            }
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span>{label}</span>
                        </NavLink>
                    ))}

                    {hasAdminAccess && (
                        <details
                            className="group rounded-xl"
                            open={isAdminSectionActive}
                        >
                            <summary
                                className={`flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                                    isAdminSectionActive
                                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                        : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                                }`}
                            >
                                <FiSliders className="h-5 w-5 shrink-0" />
                                <span className="flex-1">Admin</span>
                                <FiChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                            </summary>

                            <div className="mt-2 space-y-2 pl-4">
                                {adminItems.map(({ label, to, icon: Icon }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                                isActive
                                                    ? "bg-[var(--primary)] text-white"
                                                    : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                                            }`
                                        }
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </details>
                    )}
                </nav>

                <div className="mt-auto">
                    <Profile name="Pelipe Gaiek Da Costa" />
                </div>
            </aside>

            <nav className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 md:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/10">
                    <IoExtensionPuzzleSharp className="text-xl text-[var(--primary)]" />
                </div>

                <div className="flex flex-1 justify-center gap-4">
                    {menuItems.map(({ label, to, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `relative flex items-center justify-center rounded-lg p-2 transition group/link ${
                                    isActive
                                        ? "bg-[var(--surface-secondary)] text-[var(--foreground)]"
                                        : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                                }`
                            }
                        >
                            <Icon className="h-5 w-5" />
                            <span className="absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover/link:block">
                                {label}
                            </span>
                        </NavLink>
                    ))}

                    {hasAdminAccess && (
                        <details className="group/link relative">
                            <summary
                                className={`flex cursor-pointer list-none items-center justify-center rounded-lg p-2 transition ${
                                    isAdminSectionActive
                                        ? "bg-[var(--primary)] text-white"
                                        : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/15"
                                }`}
                            >
                                <FiSliders className="h-5 w-5" />
                                <span className="absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover/link:block">
                                    Admin
                                </span>
                            </summary>

                            <div className="absolute right-0 top-full mt-3 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                                {adminItems.map(({ label, to, icon: Icon }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                                isActive
                                                    ? "bg-[var(--primary)] text-white"
                                                    : "text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
                                            }`
                                        }
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </NavLink>
                                ))}
                            </div>
                        </details>
                    )}
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--foreground)]">
                    <FiUser size={18} />
                </div>
            </nav>
        </>
    );
}
