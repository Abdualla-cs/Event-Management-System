import React from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function EventDetails({ event, setPage }) {
    if (!event) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h2 className="text-2xl font-bold text-red-600">Event not found</h2>
                <button
                    onClick={() => setPage('events')}
                    className="mt-4 bg-[#FC350B] text-white px-6 py-2 rounded-md hover:bg-[#D92B0A] transition-colors"
                >
                    Back to Events
                </button>
            </div>
        );
    }

    // Safely handle registrations
    const registrations = event.registrations || [];
    const eventDate = event.date || '';
    const eventTime = event.time || '';
    const eventLocation = event.location || '';
    const eventDescription = event.description || '';
    const eventCategory = event.category || 'Uncategorized';
    const ticketPrice = event.ticket_price || event.ticketPrice || 0;

    // LOGIC FIX: Construct the full image URL
    // If event.image_url exists (from backend), it is relative (/uploads/x.jpg). 
    // We prepend API_BASE_URL.
    const imageUrl = event.image_url
        ? `${API_BASE_URL}${event.image_url}`
        : (event.image_filename ? `${API_BASE_URL}/uploads/${event.image_filename}` : null);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
                <div className="h-64 bg-gray-200 relative">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                // Try to find the gradient div sibling and show it
                                if (e.target.nextSibling) e.target.nextSibling.classList.remove('hidden');
                                if (e.target.nextSibling) e.target.nextSibling.classList.add('flex');
                            }}
                        />
                    ) : null}

                    {/* Fallback Gradient if no image or image fails */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 items-center justify-center text-white ${imageUrl ? 'hidden' : 'flex'}`}>
                        <span className="text-6xl">🎉</span>
                    </div>

                    <div className="absolute bottom-4 left-6">
                        <span className="px-3 py-1 bg-white text-[#FC350B] text-sm rounded-full font-semibold">
                            {eventCategory}
                        </span>
                    </div>
                </div>

                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-2 text-gray-800">{event.name}</h1>
                    <p className="text-lg text-gray-600 mb-4">
                        {eventDate} {eventTime ? `at ${eventTime}` : ''} • {eventLocation}
                    </p>
                    <p className="text-xl font-semibold text-[#FC350B] mb-6">
                        {ticketPrice > 0 ? `$${ticketPrice}` : 'Free Entry'}
                    </p>

                    <p className="text-gray-700 mb-8 leading-relaxed text-lg">{eventDescription}</p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button
                            onClick={() => setPage('register')}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                            Register for this Event
                        </button>
                        <button
                            onClick={() => setPage('events')}
                            className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                        >
                            Back to Events
                        </button>
                    </div>

                    <hr className="my-8" />

                    <h2 className="text-2xl font-bold mb-4 text-gray-800">
                        Registrations ({registrations.length})
                    </h2>
                    {registrations.length > 0 ? (
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
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventDetails;