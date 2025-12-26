import React, { useState, useEffect } from 'react';
import Input from './Input.js';
import Select from './Select.js';
import Button from './Button.js';

function EventForm({ onSubmitForm, initialData, buttonText = "Submit", disabled = false }) {
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
            imageFile: null,
        };
        return initialData || defaultFormState;
    });

    const [errors, setErrors] = useState({});
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            if (initialData.image_url) {
                setPreviewUrl(initialData.image_url);
            }
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
                imageFile: null,
            });
            setPreviewUrl('');
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('❌ File size should be less than 5MB');
                e.target.value = '';
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('❌ Please upload a valid image file (JPEG, PNG, GIF, WebP)');
                e.target.value = '';
                return;
            }

            setFormData(prev => ({
                ...prev,
                imageFile: file
            }));

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
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
        if (!formData.imageFile && !initialData) newErrors.imageFile = 'Event image is required';

        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        // Create FormData for file upload
        const formDataToSubmit = new FormData();

        // Append all text fields with correct database column names
        formDataToSubmit.append('name', formData.name);
        formDataToSubmit.append('date', formData.date);
        formDataToSubmit.append('location', formData.location);
        formDataToSubmit.append('category', formData.category);
        formDataToSubmit.append('description', formData.description);
        formDataToSubmit.append('max_attendees', formData.maxAttendees);
        formDataToSubmit.append('ticket_price', formData.ticketPrice);

        if (formData.time) {
            formDataToSubmit.append('time', formData.time);
        }

        // Append image file if exists
        if (formData.imageFile) {
            formDataToSubmit.append('image', formData.imageFile);
        } else if (!initialData) {
            // For new events, image is required
            alert('⚠️ Please select an image for the event');
            return;
        }

        // For editing events with existing image
        if (initialData && initialData.image_url) {
            formDataToSubmit.append('existing_image', initialData.image_url);
        }

        console.log('📤 Submitting Event FormData (Admin):');
        for (let pair of formDataToSubmit.entries()) {
            console.log(`${pair[0]}:`, pair[1]);
        }

        onSubmitForm(formDataToSubmit);

        if (!initialData) {
            // Reset form
            setFormData({
                name: '',
                date: '',
                time: '',
                location: '',
                category: '',
                description: '',
                maxAttendees: 100,
                ticketPrice: 0,
                imageFile: null,
            });

            setPreviewUrl('');

            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
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

                {/* Image Upload Section */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Image {!initialData && <span className="text-red-500">*</span>}
                    </label>

                    {/* Image Preview */}
                    {(previewUrl || (initialData && initialData.image_url)) && (
                        <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">Preview:</p>
                            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
                                <img
                                    src={previewUrl || initialData.image_url}
                                    alt="Event preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `
                                            <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                                <span class="text-gray-500">Image failed to load</span>
                                            </div>
                                        `;
                                    }}
                                />
                            </div>
                            {initialData && initialData.image_url && (
                                <p className="text-xs text-green-600 mt-1">
                                    📁 Current: {initialData.image_url.split('/').pop()}
                                </p>
                            )}
                        </div>
                    )}

                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FC350B] focus:border-transparent"
                        required={!initialData}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        📸 Upload an event image (max 5MB, JPG/PNG/GIF/WebP)
                        {initialData && ' - Leave empty to keep current image'}
                    </p>
                    {errors.imageFile && (
                        <p className="text-red-500 text-xs mt-1">{errors.imageFile}</p>
                    )}
                </div>
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

            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={disabled}
                    variant="primary"
                >
                    {disabled ? '⏳ Submitting...' : buttonText}
                </Button>
                {(initialData || buttonText === "Submit for Review") && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            setTimeout(() => {
                                window.history.back();
                            }, 100);
                        }}
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