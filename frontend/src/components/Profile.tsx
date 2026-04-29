import { FiUser } from "react-icons/fi";

type ProfileProps = {
    name: string;
    initial?: string;
};

export function Profile({ name }: ProfileProps) {
    const firstName = name.trim().split(" ")[0];

    return (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 transition-colors hover:bg-[var(--surface-secondary)] max-md:justify-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-black">
                <FiUser className="h-5 w-5" />
            </div>

            {/* Texto visível apenas no desktop */}
            <div className="min-w-0 max-md:hidden">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    Olá, {firstName}
                </p>
            </div>
        </div>
    );
}