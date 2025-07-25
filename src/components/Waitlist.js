
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@supabase/supabase-js';
import './LandingPage.css';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Waitlist = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const onSubmit = async (data) => {
    setMessage('');
    setIsError(false);

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email: data.email }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation (duplicate email)
            setMessage(`You're already on the waitlist!`);
          } else {
            setMessage(`Error joining waitlist: ${error.message}`);
          }
        } else {
          setMessage(`Thanks for joining the waitlist! We'll keep you updated.`);
        reset(); // Clear the form
      }
    } catch (err) {
      setMessage(`An unexpected error occurred: ${err.message}`);
      setIsError(true);
    }
  };

  return (
    <div className="waitlist-container" id="waitlist">
      <h2>Request Enterprise Demo</h2>
      <p>Get early access to Keisha AI's enterprise platform with special pilot pricing for qualifying organizations.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="waitlist-form">
        <input
          type="email"
          placeholder="Enter your business email"
          {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Requesting...' : 'Request Demo'}
        </button>
      </form>
      {errors.email && <p className="error-message">A valid business email is required.</p>}
      {message && (
        <p className={`form-message ${isError ? 'error-message' : 'success-message'}`}>
          {message}
        </p>
      )}
      <div className="enterprise-note">
        <p><strong>Enterprise Features:</strong> API Integration • Custom Deployment • Dedicated Support • Compliance Reporting</p>
      </div>
    </div>
  );
};

export default Waitlist;
