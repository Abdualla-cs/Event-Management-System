import React from 'react';

function Button({
    children,
    variant = 'primary',
    className = '',
    disabled = false,
    ...props
}) {
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-[#FC350B] text-white hover:bg-[#D92B0A] focus:ring-[#FC350B]',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
        outline: 'border-2 border-[#FC350B] text-[#FC350B] hover:bg-[#FC350B] hover:text-white focus:ring-[#FC350B]',
        ghost: 'text-[#FC350B] hover:bg-orange-50 focus:ring-[#FC350B]'
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${disabledClasses} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;