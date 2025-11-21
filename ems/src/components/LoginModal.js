import React, { useState } from 'react';
import Modal from './Modal.js';
import Input from './Input.js';
import Button from './Button.js';
import { useAuth, useToast } from '../context/Providers.js';

export default function LoginModal({ isOpen, onClose, setPage }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const { addToast } = useToast();

    const validate = () => {
        const e = {};
        if (!username) e.username = 'Username is required';
        if (!password) e.password = 'Password is required';
        if (password && password.length < 6) e.password = 'Password must be at least 6 characters';
        return e;
    };

    const handleSubmit = (ev) => {
        ev.preventDefault();
        const eobj = validate();
        if (Object.keys(eobj).length) return setErrors(eobj);

        const success = login(username, password);
        if (success) {
            addToast('Login successful!', 'success');
            onClose();
            setUsername('');
            setPassword('');
            setErrors({});
        } else {
            addToast('Invalid credentials', 'error');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Login">
            <form onSubmit={handleSubmit}>
                <Input
                    label="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    error={errors.username}
                    placeholder="Enter username"
                />

                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={errors.password}
                    placeholder="Enter password"
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                        <strong>Demo Credentials:</strong><br />
                        Admin: admin / admin123<br />
                        User: any username / any password (6+ chars)
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                        Login
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