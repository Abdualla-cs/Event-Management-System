import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import EventCard from '../components/EventCard.js';
import EventForm from '../components/EventForm.js';
import StatCard from '../components/StatCard.js';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ManageEventsPage({ events, setPage, setSelectedEventId, onDelete, onCreate, onUpdate }) {
    const [editingEvent, setEditingEvent] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState('events');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [loadingActions, setLoadingActions] = useState({}); // For individual request loading states
    const [stats, setStats] = useState({
        totalEvents: 0,
        upcomingEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0,
        pendingRequests: 0
    });

    // Refs for scrolling
    const topRef = useRef(null);
    const editFormRef = useRef(null);

    useEffect(() => {
        calculateStats();
        if (activeTab === 'requests') {
            fetchPendingRequests();
        }
    }, [events, activeTab]);

    // Scroll to top when editing or creating starts
    useEffect(() => {
        if (editingEvent || showCreateForm) {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    }, [editingEvent, showCreateForm]);

    const calculateStats = () => {
        const upcomingEvents = events?.filter(e => new Date(e.date) >= new Date()).length || 0;
        const totalRegistrations = events?.reduce((sum, e) => sum + (e.registrations?.length || 0), 0) || 0;
        const totalRevenue = events?.reduce((sum, e) => sum + ((e.registrations?.length || 0) * (e.ticket_price || 0)), 0) || 0;

        setStats({
            totalEvents: events?.length || 0,
            upcomingEvents,
            totalRegistrations,
            totalRevenue,
            pendingRequests: pendingRequests.length
        });
    };

    const fetchPendingRequests = async () => {
        setLoadingRequests(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                alert('Please login first');
                setLoadingRequests(false);
                return;
            }

            console.log('Fetching pending requests from:', `${API_BASE_URL}/api/admin/pending`);
            const response = await axios.get(`${API_BASE_URL}/api/admin/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Pending events response:', response.data);
            setPendingRequests(response.data || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            console.error('Full error:', error.response);

            if (error.response?.status === 401) {
                alert('Session expired. Please login again.');
                localStorage.removeItem('admin_token');
                window.location.reload();
            } else if (error.response?.status === 404) {
                alert('Pending events endpoint not found. Please check server configuration.');
            } else {
                alert('Failed to load pending requests. Please try again.');
            }
            setPendingRequests([]);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleApproveRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to approve this event request?')) return;

        setLoadingActions(prev => ({ ...prev, [requestId]: 'approving' }));

        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.post(
                `${API_BASE_URL}/api/admin/pending/${requestId}/approve`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Approval response:', response.data);

            setPendingRequests(prev => prev.filter(req => req.id !== requestId));

            if (typeof window.refreshEvents === 'function') {
                window.refreshEvents();
            }

            alert('✅ Event approved successfully!');
        } catch (error) {
            console.error('Error approving request:', error);
            alert(`❌ Failed to approve event request: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoadingActions(prev => ({ ...prev, [requestId]: null }));
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to reject this event request?')) return;

        setLoadingActions(prev => ({ ...prev, [requestId]: 'rejecting' }));

        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(
                `${API_BASE_URL}/api/admin/pending/${requestId}/reject`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Remove from pending list
            setPendingRequests(prev => prev.filter(req => req.id !== requestId));

            alert('✅ Event request rejected.');
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert(`❌ Failed to reject event request: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoadingActions(prev => ({ ...prev, [requestId]: null }));
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;

        setLoadingActions(prev => ({ ...prev, [requestId]: 'deleting' }));

        try {
            const token = localStorage.getItem('admin_token');
            await axios.delete(
                `${API_BASE_URL}/api/admin/pending/${requestId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setPendingRequests(prev => prev.filter(req => req.id !== requestId));

            alert('✅ Request deleted successfully.');
        } catch (error) {
            console.error('Error deleting request:', error);
            alert(`❌ Failed to delete request: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoadingActions(prev => ({ ...prev, [requestId]: null }));
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setSelectedEventId(event.id);
        setActiveTab('events');
        setShowCreateForm(false);

        // Scroll to top
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    const handleSaveEdit = async (formData) => {
        // Add the existing_image if available
        if (editingEvent.image_url) {
            formData.append('existing_image', editingEvent.image_url);
        }

        const result = await onUpdate(editingEvent.id, formData);
        if (result.success) {
            setEditingEvent(null);
            // Scroll to top after saving
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        } else {
            alert(result.error || 'Failed to update event');
        }
    };

    const handleCreateNewEvent = async (formData) => {
        const result = await onCreate(formData);
        if (result.success) {
            setShowCreateForm(false);
            // Scroll to top after creating
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        } else {
            alert(result.error || 'Failed to create event');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        const result = await onDelete(id);
        if (!result.success) {
            alert(result.error || 'Failed to delete event');
        }
    };

    const handleCancelEdit = () => {
        setEditingEvent(null);
        // Scroll to top after cancel
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
        // Scroll to top after cancel
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    return (
        <div ref={topRef} className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Event Management</h1>

                {activeTab === 'events' && !editingEvent && !showCreateForm && (
                    <div className="flex space-x-4">
                        <button
                            onClick={() => {
                                setShowCreateForm(true);
                                setEditingEvent(null);
                                // Scroll to top
                                setTimeout(() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }, 100);
                            }}
                            className="bg-[#FC350B] text-white px-4 py-2 rounded-md hover:bg-[#D92B0A] transition-colors"
                        >
                            + Create Event
                        </button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard label="Total Events" value={stats.totalEvents} color="blue" />
                <StatCard label="Upcoming Events" value={stats.upcomingEvents} color="green" />
                <StatCard label="Total Registrations" value={stats.totalRegistrations} color="purple" />
                <StatCard label="Total Revenue" value={`$${stats.totalRevenue}`} color="orange" />
                <StatCard
                    label="Pending Requests"
                    value={stats.pendingRequests}
                    color="yellow"
                    className={stats.pendingRequests > 0 ? 'ring-2 ring-yellow-400' : ''}
                />
            </section>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => {
                            setActiveTab('events');
                            setEditingEvent(null);
                            setShowCreateForm(false);
                            // Scroll to top when switching tabs
                            setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                        }}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'events'
                            ? 'border-[#FC350B] text-[#FC350B]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Events
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('requests');
                            setEditingEvent(null);
                            setShowCreateForm(false);
                            // Scroll to top when switching tabs
                            setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                        }}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests'
                            ? 'border-[#FC350B] text-[#FC350B]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Pending Requests
                        {pendingRequests.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'events' ? (
                <>
                    {/* Edit Form */}
                    {editingEvent ? (
                        <div ref={editFormRef} className="mb-8">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Event</h2>
                            <EventForm
                                onSubmitForm={handleSaveEdit}
                                initialData={editingEvent}
                                buttonText="Save Changes"
                            />
                            <button
                                onClick={handleCancelEdit}
                                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Cancel Edit
                            </button>
                        </div>
                    ) : showCreateForm ? (
                        <div ref={editFormRef} className="mb-8">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Event</h2>
                            <EventForm
                                onSubmitForm={handleCreateNewEvent}
                                buttonText="Create Event"
                            />
                            <button
                                onClick={handleCancelCreate}
                                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">All Events ({events.length})</h2>

                            {events.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No events found. Create your first event!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {events.map(event => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            setPage={setPage}
                                            setSelectedEventId={setSelectedEventId}
                                            showActions={true}
                                            onEdit={handleEdit}
                                            onDelete={() => handleDelete(event.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* Pending Requests Tab */
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Pending Event Requests</h2>
                        <button
                            onClick={fetchPendingRequests}
                            className="bg-[#FC350B] text-white px-4 py-2 rounded-md hover:bg-[#D92B0A] transition-colors text-sm"
                            disabled={loadingRequests}
                        >
                            {loadingRequests ? '🔄 Loading...' : '🔄 Refresh'}
                        </button>
                    </div>

                    {loadingRequests ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FC350B] mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading pending requests...</p>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No pending requests.</p>
                            <p className="text-gray-400 text-sm mt-2">When users submit event requests, they will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {pendingRequests.map(request => {
                                const imageUrl = request.image_filename
                                    ? `${API_BASE_URL}/uploads/${request.image_filename}`
                                    : (request.image_url || null);

                                return (
                                    <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-gray-800">{request.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Requested by: <span className="font-medium">{request.created_by || 'User'}</span>
                                                    ({request.user_email || 'user@example.com'})
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Submitted: {new Date(request.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                                                    ⏳ Pending Review
                                                </span>
                                            </div>
                                        </div>

                                        {/* Event Image if available */}
                                        {imageUrl && (
                                            <div className="mb-4">
                                                <div className="h-48 bg-gray-100 rounded-lg overflow-hidden">
                                                    <img
                                                        src={imageUrl}
                                                        alt={request.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = `
                                                                <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                                                    <span class="text-gray-500">Image preview not available</span>
                                                                </div>
                                                            `;
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Date & Time</p>
                                                <p className="font-medium">
                                                    {request.date} {request.time ? `at ${request.time}` : ''}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Location</p>
                                                <p className="font-medium">{request.location}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Category</p>
                                                <p className="font-medium">{request.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Ticket Price</p>
                                                <p className="font-medium">${request.ticket_price || 'Free'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Max Attendees</p>
                                                <p className="font-medium">{request.max_attendees || 100}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm text-gray-500">Description</p>
                                            <p className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-700">{request.description}</p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => handleApproveRequest(request.id)}
                                                disabled={loadingActions[request.id]}
                                                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingActions[request.id] === 'approving' ? (
                                                    <span className="flex items-center justify-center">
                                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                                        Approving...
                                                    </span>
                                                ) : '✅ Approve & Publish'}
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(request.id)}
                                                disabled={loadingActions[request.id]}
                                                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingActions[request.id] === 'rejecting' ? (
                                                    <span className="flex items-center justify-center">
                                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                                        Rejecting...
                                                    </span>
                                                ) : '❌ Reject'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRequest(request.id)}
                                                disabled={loadingActions[request.id]}
                                                className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loadingActions[request.id] === 'deleting' ? (
                                                    <span className="flex items-center justify-center">
                                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                                        Deleting...
                                                    </span>
                                                ) : '🗑️ Delete'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ManageEventsPage;