import React from 'react';

function EventDetails({ event, setPage }) {
    if (!event) return <div className="container mx-auto px-4 py-8">Event not found.</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
                <div className="h-64 bg-gray-200 relative">
                    {event.image ? (
                        <img
                            src={event.image}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white ${event.image ? 'hidden' : 'flex'}`}>
                        <span className="text-6xl">🎉</span>
                    </div>
                    <div className="absolute bottom-4 left-6">
                        <span className="px-3 py-1 bg-white text-[#FC350B] text-sm rounded-full font-semibold">
                            {event.category}
                        </span>
                    </div>
                </div>

                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-2 text-gray-800">{event.name}</h1>
                    <p className="text-lg text-gray-600 mb-4">
                        {event.date} {event.time ? `at ${event.time}` : ''} • {event.location}
                    </p>
                    <p className="text-xl font-semibold text-[#FC350B] mb-6">
                        {event.ticketPrice ? `$${event.ticketPrice}` : 'Free Entry'}
                    </p>

                    <p className="text-gray-700 mb-8 leading-relaxed text-lg">{event.description}</p>

                    <div className="flex space-x-4 mb-8">
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
                        Registrations ({event.registrations.length})
                    </h2>
                    {event.registrations.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {event.registrations.map((reg, index) => (
                                <li key={index} className="py-3">
                                    <p className="font-semibold text-gray-700">{reg.name}</p>
                                    <p className="text-sm text-gray-500">{reg.email}</p>
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