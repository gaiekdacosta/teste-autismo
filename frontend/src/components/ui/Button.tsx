import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "outline";
};

export function Button({
    children,
    variant = "primary",
    className = "",
    ...props
}: ButtonProps) {
    const variants = {
        primary: `
        bg-[var(--primary)]
        hover:bg-[var(--primary-hover)]
        text-white
        border-transparent
    `,
        secondary: `
        bg-[var(--surface)]
        hover:bg-[var(--surface-secondary)]
        text-white
        border-[var(--border)]
    `,
        outline: `
        bg-transparent
        hover:bg-[var(--surface)]
        text-[var(--primary)]
        border-[var(--primary)]
    `,
    };

    return (
        <button
            className={`
        inline-flex items-center justify-center
        px-5 py-3
        rounded-xl
        font-medium
        text-sm
        border
        transition-all duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--primary)]
        focus:ring-offset-2
        focus:ring-offset-black
        ${variants[variant]}
        ${className}
        `}
            {...props}
        >
            {children}
        </button>
    );
}