import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError('An error occurred. Please try again.');
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
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 ">
            Enter your email to receive a reset link
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && <div className="text-green-600 text-sm text-center p-3 bg-green-50 rounded">{message}</div>}
          {error && <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded">{error}</div>}
          
          <div>
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Button type="submit" className="w-full">
              Send Reset Link
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
