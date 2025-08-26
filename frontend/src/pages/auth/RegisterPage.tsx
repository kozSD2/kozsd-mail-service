import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isEduDomain } from '@kozsd/shared'

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const email = watch('email')
  const password = watch('password')
  const isEdu = email ? isEduDomain(email) : false

  const passwordRequirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /[a-z]/, text: 'One lowercase letter' },
    { regex: /\d/, text: 'One number' },
    { regex: /[^A-Za-z0-9]/, text: 'One special character' },
  ]

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data
      await registerUser(registerData)
      navigate('/', { replace: true })
    } catch (error: any) {
      // Error is already handled by the auth service
      console.error('Registration error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-semibold text-gray-900 dark:text-gray-100"
        >
          Create your account
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
        >
          Get started with your secure email platform
        </motion.p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('firstName')}
                type="text"
                id="firstName"
                placeholder="First name"
                className={`input-glass pl-10 pr-4 py-3 w-full ${
                  errors.firstName ? 'border-red-300 dark:border-red-600' : ''
                }`}
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.firstName.message}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('lastName')}
                type="text"
                id="lastName"
                placeholder="Last name"
                className={`input-glass pl-10 pr-4 py-3 w-full ${
                  errors.lastName ? 'border-red-300 dark:border-red-600' : ''
                }`}
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.lastName.message}
              </p>
            )}
          </motion.div>
        </div>

        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('email')}
              type="email"
              id="email"
              placeholder="Enter your email"
              className={`input-glass pl-10 pr-4 py-3 w-full ${
                errors.email ? 'border-red-300 dark:border-red-600' : ''
              }`}
            />
            {isEdu && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  .edu
                </span>
              </div>
            )}
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
          {isEdu && (
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              Educational domain detected - you'll get enhanced features!
            </p>
          )}
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Create a password"
              className={`input-glass pl-10 pr-12 py-3 w-full ${
                errors.password ? 'border-red-300 dark:border-red-600' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}

          {/* Password Requirements */}
          {password && (
            <div className="mt-3 space-y-2">
              {passwordRequirements.map((req, index) => {
                const isValid = req.regex.test(password)
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs ${
                      isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      isValid ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {isValid && <Check className="w-2 h-2" />}
                    </div>
                    {req.text}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Confirm Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="Confirm your password"
              className={`input-glass pl-10 pr-12 py-3 w-full ${
                errors.confirmPassword ? 'border-red-300 dark:border-red-600' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </div>
          ) : (
            'Create account'
          )}
        </motion.button>
      </form>

      {/* Login Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-sm text-gray-600 dark:text-gray-400"
      >
        Already have an account?{' '}
        <Link
          to="/auth/login"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Sign in
        </Link>
      </motion.div>

      {/* Terms Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-xs text-gray-500 dark:text-gray-400"
      >
        By creating an account, you agree to our{' '}
        <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
          Privacy Policy
        </Link>
      </motion.div>
    </div>
  )
}