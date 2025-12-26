import React from 'react';
import StatCard from '../components/StatCard.js';

function DashboardPage({ stats, events }) {
    const recentEvents = events.slice(0, 5);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard label="Total Events" value={stats.totalEvents} color="blue" />
                <StatCard label="Upcoming Events" value={stats.upcomingEvents} color="green" />
                <StatCard label="Total Registrations" value={stats.totalRegistrations} color="purple" />
                <StatCard label="Total Revenue" value={`$${stats.totalRevenue}`} color="orange" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Events</h2>
                <div className="space-y-4">
                    {recentEvents.map(event => (
                        <div key={event.id} className="flex justify-between items-center p-4 border rounded-lg">
                            <div>
                                <h3 className="font-semibold">{event.name}</h3>
                                <p className="text-sm text-gray-600">
                                    {event.date} • {event.registrations.length} attendees • ${event.ticketPrice * event.registrations.length} revenue
                                </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${new Date(event.date) >= new Date()
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {new Date(event.date) >= new Date() ? 'Upcoming' : 'Past'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;