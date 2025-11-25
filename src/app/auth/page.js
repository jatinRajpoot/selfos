"use client";
import { useState } from "react";
import { account } from "@/lib/appwrite";
import { ID, OAuthProvider } from "appwrite";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const SoundWaveAnimation = () => {
    return (
        <div className="flex items-center justify-center gap-2 h-64">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-3 rounded-full bg-indigo-500"
                    animate={{
                        height: ["20%", "80%", "20%"],
                        backgroundColor: ["#6366f1", "#a855f7", "#6366f1"]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                    }}
                    style={{
                        boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)"
                    }}
                />
            ))}
        </div>
    );
};
export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const router = useRouter();

    // Password validation
    const validatePassword = (pwd) => {
        const minLength = pwd.length >= 8;
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasLowerCase = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        return { minLength, hasUpperCase, hasLowerCase, hasNumber, isValid: minLength && hasUpperCase && hasLowerCase && hasNumber };
    };

    const passwordValidation = validatePassword(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validate password on signup
        if (!isLogin && !passwordValidation.isValid) {
            setError("Password must be at least 8 characters with uppercase, lowercase, and numbers");
            setLoading(false);
            return;
        }

        try {
            // Clear any existing session first
            try {
                await account.deleteSession("current");
            } catch (e) {
                // Ignore error if no session exists
            }

            if (isLogin) {
                await account.createEmailPasswordSession(email, password);
                router.push("/dashboard");
            } else {
                await account.create(ID.unique(), email, password, name);
                await account.createEmailPasswordSession(email, password);
                router.push("/dashboard");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setError("");
        
        try {
            await account.createRecovery(
                resetEmail,
                `${window.location.origin}/auth/reset-password`
            );
            setResetSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white">
            {/* Left Side - Form */}
            <div className="flex w-full flex-col justify-center px-6 md:w-1/2 lg:px-24">
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome to SelfOS</h1>
                    <p className="mt-2 text-gray-500">Unlock your potential and master new skills.</p>
                </div>

                {/* Toggle */}
                <div className="mb-8 flex w-full rounded-full bg-gray-100 p-1">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${isLogin ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${!isLogin ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border-b border-gray-300 py-2 focus:border-indigo-600 focus:outline-none"
                                placeholder="John Doe"
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-b border-gray-300 py-2 focus:border-indigo-600 focus:outline-none"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-b border-gray-300 py-2 focus:border-indigo-600 focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                        {/* Password strength indicator for signup */}
                        {!isLogin && password.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <div className="flex gap-1">
                                    {[
                                        passwordValidation.minLength,
                                        passwordValidation.hasLowerCase,
                                        passwordValidation.hasUpperCase,
                                        passwordValidation.hasNumber
                                    ].map((valid, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${
                                                valid ? "bg-green-500" : "bg-gray-200"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <ul className="text-xs space-y-1">
                                    <li className={passwordValidation.minLength ? "text-green-600" : "text-gray-500"}>
                                        {passwordValidation.minLength ? "✓" : "○"} At least 8 characters
                                    </li>
                                    <li className={passwordValidation.hasLowerCase ? "text-green-600" : "text-gray-500"}>
                                        {passwordValidation.hasLowerCase ? "✓" : "○"} One lowercase letter
                                    </li>
                                    <li className={passwordValidation.hasUpperCase ? "text-green-600" : "text-gray-500"}>
                                        {passwordValidation.hasUpperCase ? "✓" : "○"} One uppercase letter
                                    </li>
                                    <li className={passwordValidation.hasNumber ? "text-green-600" : "text-gray-500"}>
                                        {passwordValidation.hasNumber ? "✓" : "○"} One number
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full bg-indigo-600 py-3 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : isLogin ? "Log In" : "Sign Up"}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-4 text-gray-500">or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            account.createOAuth2Session(
                                OAuthProvider.Google,
                                `${window.location.origin}/dashboard`,
                                `${window.location.origin}/auth`
                            );
                        }}
                        className="w-full flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white py-3 text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>
                </form>

                {isLogin && (
                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-gray-500 hover:text-gray-900"
                        >
                            Forgot Password?
                        </button>
                    </div>
                )}

                {/* Forgot Password Modal */}
                {showForgotPassword && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => {
                                setShowForgotPassword(false);
                                setResetSuccess(false);
                                setResetEmail("");
                                setError("");
                            }}
                        />
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                            {resetSuccess ? (
                                <div className="text-center">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        We've sent a password reset link to {resetEmail}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setResetSuccess(false);
                                            setResetEmail("");
                                        }}
                                        className="w-full rounded-full bg-indigo-600 py-2 text-white hover:bg-indigo-700"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Enter your email address and we'll send you a link to reset your password.
                                    </p>
                                    <form onSubmit={handleForgotPassword} className="space-y-4">
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                                            placeholder="name@example.com"
                                            required
                                        />
                                        {error && <p className="text-sm text-red-600">{error}</p>}
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotPassword(false);
                                                    setResetEmail("");
                                                    setError("");
                                                }}
                                                className="flex-1 rounded-full border border-gray-300 py-2 text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="flex-1 rounded-full bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {resetLoading ? "Sending..." : "Send Link"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side - Image */}
            <div className="hidden w-1/2 bg-slate-900 md:flex items-center justify-center p-12 overflow-hidden relative">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                
                <div className="relative h-full w-full flex items-center justify-center z-10">
                    <SoundWaveAnimation />
                </div>
            </div>
        </div>
    );
}
