import React, { useState } from 'react';
import EventCard from '../components/EventCard.js';
import EventForm from '../components/EventForm.js';
import StatCard from '../components/StatCard.js';

function ManageEventsPage({ events, setPage, setSelectedEventId, deleteEvent, updateEvent, stats }) {
    const [editingEvent, setEditingEvent] = useState(null);

    const handleEdit = (event) => {
        setEditingEvent(event);
        setSelectedEventId(event.id);
    };

    const handleSaveEdit = (formData) => {
        updateEvent(editingEvent.id, formData);
        setEditingEvent(null);
    };

    // Use the provided stats or calculate from events
    const currentStats = stats || {
        totalEvents: events.length,
        upcomingEvents: events.filter(e => new Date(e.date) >= new Date()).length,
        totalRegistrations: events.reduce((sum, e) => sum + e.registrations.length, 0),
        totalRevenue: events.reduce((sum, e) => sum + (e.registrations.length * (e.ticketPrice || 0)), 0),
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Events</h1>

            {/* Stats Section */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard label="Total Events" value={currentStats.totalEvents} color="blue" />
                <StatCard label="Upcoming Events" value={currentStats.upcomingEvents} color="green" />
                <StatCard label="Total Registrations" value={currentStats.totalRegistrations} color="purple" />
                <StatCard label="Total Revenue" value={`$${currentStats.totalRevenue}`} color="orange" />
            </section>

            {editingEvent ? (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Event</h2>
                    <EventForm
                        onSubmitForm={handleSaveEdit}
                        initialData={editingEvent}
                        buttonText="Save Changes"
                    />
                    <button
                        onClick={() => setEditingEvent(null)}
                        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Cancel Edit
                    </button>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">All Events ({events.length})</h2>
                        <button
                            onClick={() => setPage('events')}
                            className="bg-[#FC350B] text-white px-4 py-2 rounded-md hover:bg-[#D92B0A] transition-colors"
                        >
                            Create New Event
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                setPage={setPage}
                                setSelectedEventId={setSelectedEventId}
                                showActions={true}
                                onEdit={handleEdit}
                                onDelete={deleteEvent}
                            />
                        ))}
                    </div>

                    {events.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No events found. Create your first event!</p>
                            <button
                                onClick={() => setPage('events')}
                                className="mt-4 bg-[#FC350B] text-white px-6 py-3 rounded-md hover:bg-[#D92B0A] transition-colors"
                            >
                                Create Event
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ManageEventsPage;