"use client";
import { useState } from "react";
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useRouter } from "next/navigation";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
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
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full bg-indigo-600 py-3 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : isLogin ? "Log In" : "Sign Up"}
                    </button>
                </form>

                {isLogin && (
                    <div className="mt-6 text-center">
                        <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                            Forgot Password?
                        </a>
                    </div>
                )}
            </div>

            {/* Right Side - Image */}
            <div className="hidden w-1/2 bg-gray-50 md:flex items-center justify-center p-12">
                <div className="relative h-full w-full overflow-hidden rounded-3xl bg-gray-200">
                    {/* Placeholder for the abstract 3D shape */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                        <div className="h-64 w-64 rounded-full bg-gradient-to-tr from-gray-100 to-gray-300 shadow-2xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
