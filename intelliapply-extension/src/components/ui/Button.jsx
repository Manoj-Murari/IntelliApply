import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Button Component
 * Support variants: primary (Terracotta), secondary (White/Stone)
 */
const Button = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    children,
    ...props
}, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-sans font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757] disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        primary: "bg-[#D97757] text-white hover:bg-[#c56a4c] shadow-sm",
        secondary: "bg-white border border-[#E6E4DF] text-[#1F1F1F] hover:bg-[#F9F8F6]",
        ghost: "hover:bg-[#F9F8F6] text-[#1F1F1F]"
    };

    const sizes = {
        default: "h-11 px-4 py-3 rounded-lg",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8",
        icon: "h-10 w-10 p-0 rounded-lg",
    };

    return (
        <button
            ref={ref}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = "Button";

export { Button };
