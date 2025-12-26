import React, { useState } from 'react';
import axios from 'axios';
import EventCard from '../components/EventCard.js';
import EventForm from '../components/EventForm.js';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Events({ events, setPage, setSelectedEventId }) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestSubmitted, setRequestSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const categories = ['all', ...new Set(events.map(e => e.category))];

    const filteredEvents = events.filter(event =>
        (event.name.toLowerCase().includes(search.toLowerCase()) ||
            event.category.toLowerCase().includes(search.toLowerCase())) &&
        (categoryFilter === 'all' || event.category === categoryFilter)
    );

    const handleEventRequest = async (formData) => {
        setSubmitting(true);
        try {
            console.log('Submitting event request to:', `${API_BASE_URL}/api/events/request`);

            const response = await axios.post(
                `${API_BASE_URL}/api/events/request`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Request successful:', response.data);

            setRequestSubmitted(true);
            setShowRequestForm(false);

            if (typeof window.refreshPendingRequests === 'function') {
                window.refreshPendingRequests();
            }

            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);

        } catch (error) {
            console.error('Error submitting event request:', error);
            console.error('Full error:', error.response);

            let errorMessage = 'Failed to submit event request. Please try again.';

            if (error.response) {
                errorMessage = error.response.data?.error || error.response.statusText;
                console.error('Server response:', error.response.data);
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your connection.';
                console.error('No response received:', error.request);
            } else {
                errorMessage = error.message;
                console.error('Error:', error.message);
            }

            alert(`❌ ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (requestSubmitted) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-green-500 text-5xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Request Submitted!</h2>
                    <p className="text-gray-600 mb-6">
                        Your event request has been submitted successfully and is under review.
                        Our admin team will review it and notify you once it's approved.
                    </p>
                    <button
                        onClick={() => {
                            setRequestSubmitted(false);
                            // Scroll to top
                            setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                        }}
                        className="bg-[#FC350B] text-white px-6 py-3 rounded-md hover:bg-[#D92B0A] transition-colors"
                    >
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Events</h1>

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
                        onClick={() => {
                            setShowRequestForm(!showRequestForm);
                            // Scroll to top when toggling form
                            setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                        }}
                        className="bg-[#FC350B] text-white px-4 py-3 rounded-md hover:bg-[#D92B0A] transition-colors text-sm md:text-base"
                    >
                        {showRequestForm ? 'Cancel Request' : 'Request New Event'}
                    </button>
                </div>
            </div>

            {showRequestForm && (
                <div className="mb-8 p-6 bg-orange-50 border border-orange-200 rounded-lg">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Request New Event</h2>
                    <p className="text-gray-600 mb-4">
                        Submit your event request for review. Our admin team will review and approve it before publishing.
                    </p>
                    <EventForm
                        onSubmitForm={handleEventRequest}
                        buttonText={submitting ? "Submitting..." : "Submit for Review"}
                        disabled={submitting}
                    />
                </div>
            )}

            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Available Events</h2>

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
                    <div className="col-span-3 text-center py-12">
                        <p className="text-gray-600 text-lg mb-4">No events found matching your search.</p>
                        <button
                            onClick={() => {
                                setSearch('');
                                setCategoryFilter('all');
                                // Scroll to top
                                setTimeout(() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }, 100);
                            }}
                            className="text-[#FC350B] hover:text-[#D92B0A] font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Events;