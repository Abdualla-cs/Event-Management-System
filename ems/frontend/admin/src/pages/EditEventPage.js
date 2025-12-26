import React from 'react';
import EventForm from '../components/EventForm.js';

function EditEventPage({ event, editEvent, setPage }) {
    const handleSubmit = (formData) => {
        editEvent(event.id, formData);
        setPage('manage');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Event</h1>
            <EventForm
                onSubmitForm={handleSubmit}
                initialData={event}
                buttonText="Save Changes"
            />
        </div>
    );
}

export default EditEventPage;