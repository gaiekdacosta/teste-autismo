import { NavLink } from "react-router-dom";
import {
    FiGrid,
    FiShoppingCart,
    FiClipboard,
    FiCalendar
} from "react-icons/fi";
import { Profile } from "./Profile";
import { IoExtensionPuzzleSharp } from "react-icons/io5";

const menuItems = [
    { label: "Tela inicial", to: "/home", icon: FiGrid },
    { label: "Comprar Teste", to: "/comprar-teste", icon: FiShoppingCart },
    { label: "Meus Testes", to: "/meus-testes", icon: FiClipboard },
    { label: "Meus Agendamentos", to: "/meus-agendamentos", icon: FiCalendar },
];

export function Sidebar() {
    return (
        <aside className="flex h-screen w-[280px] flex-col border-r border-[var(--border)] bg-[var(--background)] px-4 py-6">
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
                            Teste de Autismo
                        </h1>

                        <p className="text-sm text-[var(--muted)]">
                            Dr. Tiago Marinho
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-3 px-1">
                <span className="text-sm text-[var(--muted)]">
                    Seções
                </span>
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
            </nav>

            <div className="mt-auto">
                <Profile name="Pelipe Gaiek Da Costa" />
            </div>
        </aside>
    );
}