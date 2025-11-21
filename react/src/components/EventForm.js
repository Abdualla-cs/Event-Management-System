import React, { useState, useEffect } from 'react';
import Input from './Input.js';
import Select from './Select.js';
import Button from './Button.js';

function EventForm({ onSubmitForm, initialData, buttonText = "Submit" }) {
    const [formData, setFormData] = useState(() => {
        const defaultFormState = {
            name: '',
            date: '',
            time: '',
            location: '',
            category: '',
            description: '',
            maxAttendees: 100,
            ticketPrice: 0,
            image: '',
        };
        return initialData || defaultFormState;
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                date: '',
                time: '',
                location: '',
                category: '',
                description: '',
                maxAttendees: 100,
                ticketPrice: 0,
                image: '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Event name is required';
        if (!formData.date) newErrors.date = 'Date is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.maxAttendees < 1) newErrors.maxAttendees = 'Must have at least 1 attendee';
        if (formData.ticketPrice < 0) newErrors.ticketPrice = 'Ticket price cannot be negative';

        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        onSubmitForm(formData);
        if (!initialData) {
            setFormData({
                name: '',
                date: '',
                time: '',
                location: '',
                category: '',
                description: '',
                maxAttendees: 100,
                ticketPrice: 0,
                image: '',
            });
        }
    };

    const categoryOptions = [
        { value: '', label: 'Select Category' },
        { value: 'Technology', label: 'Technology' },
        { value: 'Entertainment', label: 'Entertainment' },
        { value: 'Community', label: 'Community' },
        { value: 'Business', label: 'Business' },
        { value: 'Education', label: 'Education' },
        { value: 'Sports', label: 'Sports' },
        { value: 'Arts', label: 'Arts & Culture' },
    ];

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            {/* Updated grid for mobile responsiveness */}
            <div className="grid grid-cols-1 gap-4">
                <Input
                    label="Event Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Enter event name"
                    required
                />

                <Select
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={categoryOptions}
                    error={errors.category}
                    required
                />

                <Input
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    error={errors.date}
                    required
                />

                <Input
                    label="Time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    helperText="Optional"
                />

                <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    error={errors.location}
                    placeholder="Enter event location"
                    required
                />

                <Input
                    label="Max Attendees"
                    name="maxAttendees"
                    type="number"
                    value={formData.maxAttendees}
                    onChange={handleChange}
                    error={errors.maxAttendees}
                    min="1"
                    helperText="Maximum number of attendees"
                />

                <Input
                    label="Ticket Price ($)"
                    name="ticketPrice"
                    type="number"
                    value={formData.ticketPrice}
                    onChange={handleChange}
                    error={errors.ticketPrice}
                    min="0"
                    step="0.01"
                    helperText="Enter 0 for free events"
                />

                <Input
                    label="Image URL"
                    name="image"
                    type="url"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    helperText="Optional event image"
                />
            </div>

            <div className="mb-6 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`
                        w-full px-3 py-3 border rounded-md 
                        bg-white text-gray-900 text-sm sm:text-base
                        focus:outline-none focus:ring-2 focus:ring-[#FC350B] focus:border-transparent
                        transition-all duration-200
                        ${errors.description ? 'border-red-500' : 'border-gray-300'}
                    `}
                    rows="4"
                    placeholder="Describe your event..."
                    required
                />
                {errors.description && (
                    <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
            </div>

            {/* Updated button layout for mobile */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1">
                    {buttonText}
                </Button>
                {initialData && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}

export default EventForm;