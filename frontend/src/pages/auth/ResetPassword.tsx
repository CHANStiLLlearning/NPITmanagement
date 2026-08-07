import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (!token) {
      return setError('Invalid or missing reset token');
    }

    try {
      const response = await axios.post('/auth/reset-password', { 
        token, 
        new_password: password 
      });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 ">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-2xl "
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#0a1f44] ">
            Create New Password
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && <div className="text-green-600 text-sm text-center p-3 bg-green-50 rounded">{message}</div>}
          {error && <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded">{error}</div>}
          
          <div className="space-y-4">
            <Input
              type="password"
              required
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
            <Input
              type="password"
              required
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
          </div>
          
          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Back to sign in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
