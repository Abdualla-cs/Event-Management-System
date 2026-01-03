import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard.js';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ems-backend-e1vd.onrender.com';

// Internal Contact Card Component (No new file needed)
const ContactItem = ({ contact }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow mb-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">{contact.name}</h4>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                    </div>
                </div>
                <span className="text-xs text-gray-400">{formatDate(contact.sent_at)}</span>
            </div>
            <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-600 italic">
                "{contact.message.length > 80 ? contact.message.substring(0, 80) + '...' : contact.message}"
            </div>
        </div>
    );
};

function DashboardPage({ events, getContacts }) {
    const [stats, setStats] = useState({
        totalEvents: 0,
        upcomingEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0
    });
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            await fetchStats();
            if (getContacts) {
                try {
                    const msgs = await getContacts();
                    setContacts(msgs.slice(0, 5)); // Get top 5 messages
                } catch (err) {
                    console.error("Failed to load contacts", err);
                }
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${API_BASE_URL}/api/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
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
        }
    };

    const recentEvents = events?.slice(0, 5) || [];

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FC350B]"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

            {/* Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard label="Total Events" value={stats.totalEvents} color="blue" />
                <StatCard label="Upcoming Events" value={stats.upcomingEvents} color="green" />
                <StatCard label="Total Registrations" value={stats.totalRegistrations} color="purple" />
                <StatCard label="Total Revenue" value={`$${stats.totalRevenue}`} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Recent Events */}
                <div className="bg-white p-6 rounded-lg shadow-md h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recent Events</h2>
                        <button onClick={() => window.location.hash = '#events'} className="text-sm text-blue-600 hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {recentEvents.map(event => (
                            <div key={event.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{event.name}</h3>
                                    <p className="text-sm text-gray-600">
                                        {event.date} • {event.registrations?.length || 0} attendees
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${new Date(event.date) >= new Date() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {new Date(event.date) >= new Date() ? 'Upcoming' : 'Past'}
                                </span>
                            </div>
                        ))}
                        {recentEvents.length === 0 && <p className="text-center text-gray-500 py-4">No events found</p>}
                    </div>
                </div>

                {/* Right Column: Recent Contact Messages */}
                <div className="bg-white p-6 rounded-lg shadow-md h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recent Messages</h2>
                        <button onClick={() => window.location.hash = '#contacts'} className="text-sm text-blue-600 hover:underline">View All</button>
                    </div>

                    <div className="space-y-2">
                        {contacts.length > 0 ? (
                            contacts.map(contact => (
                                <ContactItem key={contact.id} contact={contact} />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <p className="text-gray-500">No new messages</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default DashboardPage;