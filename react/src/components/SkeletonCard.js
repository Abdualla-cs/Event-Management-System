import React from 'react';

function SkeletonCard({
    className = ''
}) {
    return (
        <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
            {/* Title skeleton */}
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>

            {/* Meta info skeleton */}
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>

            {/* Description skeleton */}
            <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-4/6"></div>
            </div>

            {/* Button skeleton */}
            <div className="h-10 bg-gray-300 rounded"></div>
        </div>
    );
}

// Skeleton for loading states in lists
export function SkeletonCardList({ count = 3 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
}

export default SkeletonCard;