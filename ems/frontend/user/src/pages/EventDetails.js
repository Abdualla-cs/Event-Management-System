import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ems-backend-e1vd.onrender.com';

function EventDetails({ event, setPage, isAdmin = false }) {
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (event) {
            setEventData(event);
            setLoading(false);
        } else {
            setError('No event information available');
            setLoading(false);
        }
    }, [event]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FC350B] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading event details...</p>
            </div>
        );
    }

    if (error || !eventData) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h2 className="text-2xl font-bold text-red-600">
                    {error || 'Event not found'}
                </h2>
                <button
                    onClick={() => setPage('events')}
                    className="mt-4 bg-[#FC350B] text-white px-6 py-2 rounded-md hover:bg-[#D92B0A] transition-colors"
                >
                    Back to Events
                </button>
            </div>
        );
    }

    const {
        name = 'Untitled Event',
        date = '',
        time = '',
        location = 'Location not specified',
        category = 'Uncategorized',
        description = 'No description available',
        ticket_price = 0,
        image_url = null,
        registrations = [],
        registration_count = 0
    } = eventData;

    const actualRegistrationCount = registration_count || registrations.length;

    const imageUrl = image_url?.startsWith('http')
        ? image_url
        : `${API_BASE_URL}${image_url}`;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
                {/* Image Section */}
                <div className="h-64 sm:h-96 bg-gray-200 relative">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.classList.remove('hidden');
                                e.target.nextSibling.classList.add('flex');
                            }}
                        />
                    ) : null}

                    <div className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 items-center justify-center text-white ${imageUrl ? 'hidden' : 'flex'}`}>
                        <span className="text-6xl">🎉</span>
                        <span className="ml-4 text-xl font-semibold">{name}</span>
                    </div>

                    <div className="absolute bottom-4 left-6">
                        <span className="px-3 py-1 bg-white text-[#FC350B] text-sm rounded-full font-semibold">
                            {category}
                        </span>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">{name}</h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-4">
                        {date} {time ? `at ${time}` : ''} • {location}
                    </p>
                    <p className="text-lg sm:text-xl font-semibold text-[#FC350B] mb-6">
                        {ticket_price > 0 ? `$${ticket_price}` : 'Free Entry'}
                    </p>

                    <p className="text-gray-700 mb-8 leading-relaxed text-base sm:text-lg">
                        {description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button
                            onClick={() => setPage('register')}
                            className="bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                            Register for this Event
                        </button>
                        <button
                            onClick={() => setPage('events')}
                            className="bg-gray-500 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                        >
                            Back to Events
                        </button>
                    </div>

                    <hr className="my-6 sm:my-8" />

                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">
                        Registrations ({actualRegistrationCount})
                    </h2>

                    {isAdmin ? (
                        registrations.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {registrations.map((reg, index) => (
                                    <li key={index} className="py-3">
                                        <p className="font-semibold text-gray-700">{reg.name || 'Anonymous'}</p>
                                        <p className="text-sm text-gray-500">{reg.email || 'No email provided'}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">No one has registered yet. Be the first!</p>
                        )
                    ) : (
                        <div>
                            {actualRegistrationCount > 0 ? (
                                <div>
                                    <p className="text-gray-600 mb-2">
                                        {actualRegistrationCount} {actualRegistrationCount === 1 ? 'person has' : 'people have'} registered for this event.
                                    </p>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>For privacy reasons, attendees' names are not shown publicly.</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-600">No one has registered yet. Be the first!</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventDetails;