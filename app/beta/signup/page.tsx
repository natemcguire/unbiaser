'use client';

import { useState } from 'react';

export default function BetaSignup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/beta/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });

    if (response.ok) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1e9] p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8">Join the Beta</h1>
        {submitted ? (
          <div className="bg-green-50 p-4 rounded">
            Thanks! We'll be in touch with your access key.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Form fields */}
          </form>
        )}
      </div>
    </div>
  );
} 