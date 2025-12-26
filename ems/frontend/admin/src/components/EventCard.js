import React from 'react';

function EventCard({ event, setPage, setSelectedEventId, showActions = false, onEdit, onDelete }) {
    const handleViewDetails = () => {
        window.history.replaceState({
            ...window.history.state,
            eventId: event.id
        }, '');
        setSelectedEventId(event.id);
        setPage('details');
    };

    const getRegistrationCount = () => {
        if (event.registration_count !== undefined) {
            return event.registration_count;
        }
        if (event.registrations && Array.isArray(event.registrations)) {
            return event.registrations.length;
        }
        return 0;
    };

    const getMaxAttendees = () => {
        return event.maxAttendees || event.max_attendees || 100;
    };

    const registrationCount = getRegistrationCount();
    const maxAttendees = getMaxAttendees();

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col overflow-hidden">
            <div className="h-40 sm:h-48 bg-gray-200 relative">
                {event.image_url ? (
                    <img
                        src={`http://localhost:5000${event.image_url}`}
                        alt={event.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white ${event.image_url ? 'hidden' : 'flex'}`}>
                    <span className="text-3xl sm:text-4xl">🎉</span>
                </div>
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <span className="px-2 py-1 bg-white text-[#FC350B] text-xs rounded-full font-semibold">
                        {event.category}
                    </span>
                </div>
            </div>

            <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800 line-clamp-1">{event.name}</h3>

                <div className="space-y-1 sm:space-y-2 mb-3">
                    <p className="text-gray-600 text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <span className="text-xs">📅</span>
                        {event.date} {event.time ? `at ${event.time}` : ''}
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <span className="text-xs">📍</span>
                        <span className="line-clamp-1">{event.location}</span>
                    </p>
                </div>

                <p className="text-sm text-[#FC350B] font-semibold mb-3">
                    {event.ticket_price ? `$${event.ticket_price}` : 'Free'}
                </p>

                <p className="text-gray-700 text-xs sm:text-sm mb-4 flex-grow line-clamp-2 sm:line-clamp-3">
                    {event.description}
                </p>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mt-auto">
                    <span className="text-xs text-gray-500">
                        {registrationCount} / {maxAttendees} attendees
                    </span>

                    {showActions ? (
                        <div className="flex space-x-2 self-end sm:self-auto">
                            <button
                                onClick={() => onEdit(event)}
                                className="bg-blue-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-blue-600 transition-colors text-xs"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(event.id)}
                                className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-red-600 transition-colors text-xs"
                            >
                                Delete
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleViewDetails}
                            className="bg-[#FC350B] text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[#D92B0A] transition-colors text-xs sm:text-sm"
                        >
                            View Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventCard;