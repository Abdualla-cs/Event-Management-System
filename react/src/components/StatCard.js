import React from 'react';

export default function StatCard({ label, value, color = 'orange' }) {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-6 shadow-lg`}>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-sm opacity-90">{label}</p>
        </div>
    );
}