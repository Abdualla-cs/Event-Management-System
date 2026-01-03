import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL =
    process.env.REACT_APP_API_URL || "https://ems-backend-e1vd.onrender.com";

function EventDetails({ event, setPage, isAdmin = false }) {
    const [eventData, setEventData] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadEvent = async () => {
            try {
                setLoading(true);

                if (!event || !event.id) {
                    setError("No event information available");
                    return;
                }

                if (isAdmin) {
                    try {
                        const res = await axios.get(
                            `${API_BASE_URL}/api/events/${event.id}`
                        );

                        setEventData(res.data || event);
                        setRegistrations(res.data?.registrations || []);
                    } catch {
                        setEventData(event);

                        try {
                            const regsRes = await axios.get(
                                `${API_BASE_URL}/api/events/${event.id}/registrations`
                            );
                            setRegistrations(regsRes.data || []);
                        } catch {
                            setRegistrations(event.registrations || []);
                        }
                    }
                } else {
                    setEventData(event);
                    setRegistrations(event.registrations || []);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load event details");
                setEventData(event);
            } finally {
                setLoading(false);
            }
        };

        loadEvent();
    }, [event, isAdmin]);

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
                    {error || "Event not found"}
                </h2>
                <button
                    onClick={() => setPage("events")}
                    className="mt-4 bg-[#FC350B] text-white px-6 py-2 rounded-md hover:bg-[#D92B0A]"
                >
                    Back to Events
                </button>
            </div>
        );
    }

    const {
        name = "Untitled Event",
        date = "",
        time = "",
        location = "Location not specified",
        category = "Uncategorized",
        description = "No description available",
        ticket_price = 0,
        image_url = null,
        registration_count = 0,
    } = eventData;

    const actualRegistrationCount =
        registration_count || registrations.length;

    let imageUrl = null;
    if (image_url) {
        if (image_url.startsWith("http")) imageUrl = image_url;
        else if (image_url.startsWith("/uploads"))
            imageUrl = `${API_BASE_URL}${image_url}`;
        else imageUrl = `${API_BASE_URL}/uploads/${image_url}`;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
                <div className="h-64 sm:h-96 bg-gray-200 relative">
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    )}

                    {!imageUrl && (
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white">
                            <span className="text-6xl">🎉</span>
                            <span className="ml-4 text-xl font-semibold">{name}</span>
                        </div>
                    )}

                    <div className="absolute bottom-4 left-6">
                        <span className="px-3 py-1 bg-white text-[#FC350B] text-sm rounded-full font-semibold">
                            {category}
                        </span>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <h1 className="text-3xl font-bold text-gray-800">{name}</h1>
                    <p className="text-gray-600 mb-4">
                        {date} {time && `at ${time}`} • {location}
                    </p>

                    <p className="text-xl font-semibold text-[#FC350B] mb-6">
                        {ticket_price > 0 ? `$${ticket_price}` : "Free Entry"}
                    </p>

                    <p className="text-gray-700 mb-8">{description}</p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button
                            onClick={() => setPage("register")}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700"
                        >
                            Register for this Event
                        </button>
                        <button
                            onClick={() => setPage("events")}
                            className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600"
                        >
                            Back to Events
                        </button>
                    </div>

                    <hr className="my-8" />

                    <h2 className="text-2xl font-bold mb-4 text-gray-800">
                        Registrations ({actualRegistrationCount})
                    </h2>

                    {isAdmin ? (
                        registrations.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {registrations.map((reg, index) => (
                                    <li key={index} className="py-3">
                                        <p className="font-semibold text-gray-700">
                                            {reg.name || "Anonymous"}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {reg.email || "No email provided"}
                                        </p>
                                        {reg.registered_at && (
                                            <p className="text-xs text-gray-400">
                                                Registered at:{" "}
                                                {new Date(reg.registered_at).toLocaleString()}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">No one has registered yet.</p>
                        )
                    ) : (
                        <p className="text-gray-600">
                            {actualRegistrationCount > 0
                                ? `${actualRegistrationCount} people have registered.`
                                : "No one has registered yet. Be the first!"}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventDetails;
