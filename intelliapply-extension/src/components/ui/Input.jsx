import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-md border border-[#E6E4DF] bg-white px-3 py-2 text-sm text-[#1F1F1F] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#6B6B6B] placeholder:italic placeholder:font-serif focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D97757] focus-visible:border-[#D97757] disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";

export { Input };
