import React from 'react';

function LoadingSpinner({
    size = 'medium',
    className = ''
}) {
    const sizes = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12',
        xlarge: 'w-16 h-16'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`
          animate-spin rounded-full 
          border-b-2 border-[#FC350B]
          ${sizes[size]}
        `}
            />
        </div>
    );
}

export default LoadingSpinner;