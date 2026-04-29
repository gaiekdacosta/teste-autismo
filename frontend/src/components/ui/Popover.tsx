import React, { useState, useRef, useEffect } from "react";

interface PopoverProps {
    children: React.ReactNode;
    content: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    offset?: number;
    trigger?: "click" | "hover";
    className?: string;
}

export function Popover({
    children,
    content,
    position = "bottom",
    align = "center",
    offset = 8,
    trigger = "click",
    className = "",
}: PopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const positionClasses = {
        top: "bottom-full",
        bottom: "top-full",
        left: "right-full",
        right: "left-full",
    };

    const alignClasses = {
        start: {
            top: "left-0",
            bottom: "left-0",
            left: "top-0",
            right: "top-0",
        },
        center: {
            top: "left-1/2 -translate-x-1/2",
            bottom: "left-1/2 -translate-x-1/2",
            left: "top-1/2 -translate-y-1/2",
            right: "top-1/2 -translate-y-1/2",
        },
        end: {
            top: "right-0",
            bottom: "right-0",
            left: "bottom-0",
            right: "bottom-0",
        },
    };

    const offsetClasses = {
        top: `mb-${offset}`,
        bottom: `mt-${offset}`,
        left: `mr-${offset}`,
        right: `ml-${offset}`,
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    const handleTriggerClick = () => {
        if (trigger === "click") {
            setIsOpen(!isOpen);
        }
    };

    const handleMouseEnter = () => {
        if (trigger === "hover") {
            setIsOpen(true);
        }
    };

    const handleMouseLeave = () => {
        if (trigger === "hover") {
            setIsOpen(false);
        }
    };

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${className}`}
            onClick={handleTriggerClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}

            {isOpen && (
                <div
                    ref={popoverRef}
                    className={`
                        absolute z-50
                        ${positionClasses[position]}
                        ${alignClasses[align][position]}
                        ${offsetClasses[position]}
                        animate-in fade-in-0 zoom-in-95
                        duration-200
                    `}
                    style={{
                        [position === "top" ? "marginBottom" :
                            position === "bottom" ? "marginTop" :
                                position === "left" ? "marginRight" : "marginLeft"]: `${offset}px`
                    }}
                >
                    <div className="
                        bg-[var(--surface)]
                        border border-[var(--border)]
                        rounded-lg
                        shadow-lg
                        p-3
                        max-w-sm
                        animate-in fade-in-0 zoom-in-95
                        duration-200
                    ">
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
}

export function PopoverTrigger({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function PopoverContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}