// Profile.tsx
type ProfileProps = {
    name: string;
    initial?: string;
};

export function Profile({ name, initial }: ProfileProps) {
    const avatarLetter = initial ?? name.charAt(0).toLowerCase();

    return (
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-black">
                    {avatarLetter}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {name}
                    </p>
                </div>
            </div>

            <button
                type="button"
                className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </button>
        </div>
    );
}