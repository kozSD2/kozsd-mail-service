import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

const schema = yup.object({
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and dash')
    .required('Username is required'),
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

type FormData = yup.InferType<typeof schema>;

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const email = watch('email');
  const isEduEmail = email && email.toLowerCase().endsWith('.edu');

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await registerUser(data.username, data.email, data.password);
      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mx-auto mb-4 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-white font-bold text-2xl">K</span>
            </motion.div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Join KozSD Mail
            </h1>
            <p className="text-white/80">
              Create your secure email account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                className="input-glass w-full"
                placeholder="Choose a username"
                autoComplete="username"
              />
              {errors.username && (
                <p className="mt-1 text-red-400 text-sm">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email Address
                {isEduEmail && (
                  <span className="ml-2 inline-flex items-center text-primary-300 text-xs">
                    <CheckIcon className="w-3 h-3 mr-1" />
                    Educational Domain
                  </span>
                )}
              </label>
              <input
                {...register('email')}
                type="email"
                className="input-glass w-full"
                placeholder="Enter your email"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-red-400 text-sm">
                  {errors.email.message}
                </p>
              )}
              {isEduEmail && (
                <p className="mt-1 text-primary-300 text-xs">
                  ✓ You'll get higher sending limits with .edu domains
                </p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-glass w-full pr-10"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-red-400 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-glass w-full pr-10"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-red-400 text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 rounded border-white/30 bg-white/10 text-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-white/80 text-sm">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-300 hover:text-primary-200">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-300 hover:text-primary-200">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/80 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-300 hover:text-primary-200 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Security Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 glass-card p-6"
        >
          <h3 className="text-white font-semibold text-sm mb-4">
            Why choose KozSD Mail?
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-white/80 text-xs">
              <CheckIcon className="w-4 h-4 text-primary-400 mr-2" />
              End-to-end encryption for all emails
            </div>
            <div className="flex items-center text-white/80 text-xs">
              <CheckIcon className="w-4 h-4 text-primary-400 mr-2" />
              Educational domain verification
            </div>
            <div className="flex items-center text-white/80 text-xs">
              <CheckIcon className="w-4 h-4 text-primary-400 mr-2" />
              Modern, responsive design
            </div>
            <div className="flex items-center text-white/80 text-xs">
              <CheckIcon className="w-4 h-4 text-primary-400 mr-2" />
              GDPR compliant data handling
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;