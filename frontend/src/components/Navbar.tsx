import { NavLink } from "react-router-dom";
import {
    FiGrid,
    FiShoppingCart,
    FiClipboard,
    FiCalendar,
    FiSettings,
    FiSliders,
    FiUser,
} from "react-icons/fi";
import { Profile } from "./Profile";
import { IoExtensionPuzzleSharp } from "react-icons/io5";

const menuItems = [
    { label: "Tela inicial", to: "/home", icon: FiGrid },
    { label: "Nossos Serviços", to: "/nossos-servicos", icon: FiShoppingCart },
    { label: "Meus Testes", to: "/meus-testes", icon: FiClipboard },
    { label: "Meus Agendamentos", to: "/meus-agendamentos", icon: FiCalendar },
    { label: "Configurações", to: "/config", icon: FiSettings },
    { label: "Admin", to: "/admin", icon: FiSliders, highlighted: true },
];

export function Navbar() {
    return (
        <>
            <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-[var(--border)] bg-[var(--background)] px-4 py-6 md:flex">
                <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
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
                    {menuItems.map(({ label, to, icon: Icon, highlighted }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                                    highlighted
                                        ? isActive
                                            ? "bg-[var(--primary)] text-white"
                                            : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/15"
                                        : isActive
                                        ? "bg-[var(--surface-secondary)] text-[var(--foreground)]"
                                        : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                                }`
                            }
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
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
                    {menuItems.map(({ label, to, icon: Icon, highlighted }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `relative flex items-center justify-center rounded-lg p-2 transition group/link ${
                                    highlighted
                                        ? isActive
                                            ? "bg-[var(--primary)] text-white"
                                            : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/15"
                                        : isActive
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
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--foreground)]">
                    <FiUser size={18} />
                </div>
            </nav>
        </>
    );
}
