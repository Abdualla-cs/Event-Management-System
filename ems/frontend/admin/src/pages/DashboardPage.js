import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard.js';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function DashboardPage({ events }) {
    const [stats, setStats] = useState({
        totalEvents: 0,
        upcomingEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${API_BASE_URL}/api/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Calculate from local events if API fails
            const upcoming = events?.filter(e => new Date(e.date) >= new Date()).length || 0;
            const totalReg = events?.reduce((sum, e) => sum + (e.registrations?.length || 0), 0) || 0;
            const revenue = events?.reduce((sum, e) => sum + ((e.registrations?.length || 0) * (e.ticket_price || 0)), 0) || 0;

            setStats({
                totalEvents: events?.length || 0,
                upcomingEvents: upcoming,
                totalRegistrations: totalReg,
                totalRevenue: revenue
            });
        } finally {
            setLoading(false);
        }
    };

    const recentEvents = events?.slice(0, 5) || [];

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FC350B]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

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
                        <div key={event.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                            <div>
                                <h3 className="font-semibold text-gray-800">{event.name}</h3>
                                <p className="text-sm text-gray-600">
                                    {event.date} • {event.registrations?.length || 0} attendees • ${(event.ticket_price || 0) * (event.registrations?.length || 0)} revenue
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

                {recentEvents.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No events found</p>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;