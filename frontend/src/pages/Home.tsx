import { Sidebar } from "@/components/Sidebar";

export function Home() {
    return (
        <div className="flex min-h-screen bg-[var(--background)]">
            <Sidebar />

            <main className="flex-1 p-8">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                    Home
                </h1>
            </main>
        </div>
    );
}