import React, { useState } from 'react';
import Modal from './Modal.js';
import Input from './Input.js';
import Button from './Button.js';

export default function LoginModal({ isOpen, onClose, onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const validate = () => {
        const e = {};
        if (!email) e.email = 'Email is required';
        if (!password) e.password = 'Password is required';
        if (password && password.length < 6) e.password = 'Password must be at least 6 characters';
        return e;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setLoginError('');

        const eobj = validate();
        if (Object.keys(eobj).length) {
            setErrors(eobj);
            return;
        }

        setLoading(true);
        const result = await onLogin(email, password);
        setLoading(false);

        if (!result.success) {
            setLoginError(result.error || 'Login failed');
        } else {
            setEmail('');
            setPassword('');
            setErrors({});
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Admin Login">
            <form onSubmit={handleSubmit}>
                {loginError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{loginError}</p>
                    </div>
                )}

                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    error={errors.email}
                    placeholder="Enter admin email"
                />

                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={errors.password}
                    placeholder="Enter password"
                />

                <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
}