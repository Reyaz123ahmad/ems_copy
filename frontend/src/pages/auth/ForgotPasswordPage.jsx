import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import authService from '../../services/auth.service.js';

export function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  // Validate Step 1 (Email)
  const validateStep1 = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Step 2 (Passwords)
  const validateStep2 = () => {
    const errs = {};
    if (!newPassword) {
      errs.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm password is required';
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setErrors({});
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const response = await authService.resetPasswordWithEmail(email.trim().toLowerCase(), newPassword);
      const message = response?.message || 'Password has been reset. Please log in.';
      toast.success(message);
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 1 ? (
        /* STEP 1 — Enter Email */
        <>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white">Reset Password</h2>
            <p className="text-xs text-slate-400">Enter your email to reset your password</p>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="admin@mindstocs.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              autoFocus
            />

            <Button type="submit" variant="primary" size="lg" className="w-full">
              <span>Continue</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </>
      ) : (
        /* STEP 2 — Set New Password */
        <>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white">Set New Password</h2>
            <p className="text-xs text-slate-400">
              Choose a new password for <span className="font-semibold text-slate-300">{email}</span>
            </p>
          </div>

          <form onSubmit={handleStep2Submit} className="space-y-4">
            {errors.form && (
              <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                {errors.form}
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              name="newPassword"
              placeholder="••••••••••••"
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
              autoComplete="new-password"
              autoFocus
            />

            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••••••"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Save Password
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setErrors({});
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors pt-1"
            >
              ← Change Email
            </button>
          </form>
        </>
      )}

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
