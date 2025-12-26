import React from 'react';

function Select({
    label,
    options = [],
    error,
    helperText,
    className = '',
    ...props
}) {
    return (
        <div className="mb-4">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <select
                className={`
          w-full px-3 py-2 border rounded-md 
          bg-white text-gray-900 
          focus:outline-none focus:ring-2 focus:ring-[#FC350B] focus:border-transparent
          transition-all duration-200
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}

            {helperText && !error && (
                <p className="text-gray-500 text-xs mt-1">{helperText}</p>
            )}
        </div>
    );
}

export default Select;