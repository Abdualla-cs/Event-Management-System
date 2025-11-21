import React, { useState } from 'react';
import EventCard from '../components/EventCard.js';
import EventForm from '../components/EventForm.js';

function Events({ events, addEvent, setPage, setSelectedEventId }) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showCreateForm, setShowCreateForm] = useState(false);

    const categories = ['all', ...new Set(events.map(e => e.category))];

    const filteredEvents = events.filter(event =>
        (event.name.toLowerCase().includes(search.toLowerCase()) ||
            event.category.toLowerCase().includes(search.toLowerCase())) &&
        (categoryFilter === 'all' || event.category === categoryFilter)
    );

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Events</h1>

            {/* Search and Filters - Stack on mobile */}
            <div className="grid grid-cols-1 gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Search events by name or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-3 border rounded-md shadow-sm text-sm md:text-base"
                />

                <div className="grid grid-cols-2 gap-3">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full p-3 border rounded-md shadow-sm text-sm md:text-base"
                    >
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category === 'all' ? 'All Categories' : category}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-[#FC350B] text-white px-4 py-3 rounded-md hover:bg-[#D92B0A] transition-colors text-sm md:text-base"
                    >
                        {showCreateForm ? 'Cancel' : 'Create Event'}
                    </button>
                </div>
            </div>

            {showCreateForm && (
                <div className="mb-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Create New Event</h2>
                    <EventForm onSubmitForm={addEvent} buttonText="Create Event" />
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            setPage={setPage}
                            setSelectedEventId={setSelectedEventId}
                        />
                    ))
                ) : (
                    <p className="text-gray-600 col-span-3 text-center py-8 text-sm md:text-base">
                        No events match your search.
                    </p>
                )}
            </div>
        </div>
    );
}

export default Events;