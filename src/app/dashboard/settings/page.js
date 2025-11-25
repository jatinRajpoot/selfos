"use client";
import { useState, useEffect } from "react";
import { account, databases } from "@/lib/appwrite";
import { DATABASE_ID, COLLECTION_USER_SETTINGS_ID } from "@/lib/config";
import { Query, ID } from "appwrite";
import { useToast } from "@/components/Toast";
import { TourResetButton } from "@/components/ProductTour";

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [dailyGoal, setDailyGoal] = useState(5);
    const [settingsDocId, setSettingsDocId] = useState(null);
    const [savingGoal, setSavingGoal] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await account.get();
                setUser(userData);
                setName(userData.name || "");
                
                // Fetch user settings (daily goal)
                try {
                    const settings = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_USER_SETTINGS_ID,
                        [Query.equal("userId", userData.$id)]
                    );
                    if (settings.documents.length > 0) {
                        setDailyGoal(settings.documents[0].dailyGoal);
                        setSettingsDocId(settings.documents[0].$id);
                    }
                } catch (settingsError) {
                    console.log("Settings collection may not exist yet:", settingsError.message);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleUpdateName = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            await account.updateName(name);
            toast.success("Name updated successfully");
            const userData = await account.get();
            setUser(userData);
        } catch (error) {
            toast.error(error.message || "Failed to update name");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        setSaving(true);
        try {
            await account.updatePassword(newPassword, currentPassword);
            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateDailyGoal = async (e) => {
        e.preventDefault();
        if (dailyGoal < 1 || dailyGoal > 50) {
            toast.error("Daily goal must be between 1 and 50");
            return;
        }
        setSavingGoal(true);
        try {
            if (settingsDocId) {
                // Update existing settings
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTION_USER_SETTINGS_ID,
                    settingsDocId,
                    { dailyGoal: dailyGoal }
                );
            } else {
                // Create new settings
                const newSettings = await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_USER_SETTINGS_ID,
                    ID.unique(),
                    { userId: user.$id, dailyGoal: dailyGoal }
                );
                setSettingsDocId(newSettings.$id);
            }
            toast.success("Daily goal updated successfully");
        } catch (error) {
            console.error("Error updating daily goal:", error);
            toast.error(error.message || "Failed to update daily goal");
        } finally {
            setSavingGoal(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
                <div className="bg-white rounded-xl shadow-sm p-8 space-y-4">
                    <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
                    <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile</h2>
                <form onSubmit={handleUpdateName} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Learning Goals Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Learning Goals</h2>
                <p className="text-sm text-gray-500 mb-6">Set your daily learning target to stay on track</p>
                <form onSubmit={handleUpdateDailyGoal} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Daily Goal (lessons per day)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={dailyGoal}
                                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 1)}
                                min="1"
                                max="50"
                                className="w-32 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-sm text-gray-500">lessons</span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Complete {dailyGoal} {dailyGoal === 1 ? 'lesson' : 'lessons'} daily to maintain your streak
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={savingGoal}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {savingGoal ? "Saving..." : "Update Goal"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            placeholder="••••••••"
                            required
                            minLength={8}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {saving ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Help & Tour Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Help & Tour</h2>
                <p className="text-sm text-gray-500 mb-6">Need a refresher on how to use SelfOS?</p>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-700">Product Tour</p>
                        <p className="text-xs text-gray-500">Take a guided tour of all features</p>
                    </div>
                    <TourResetButton />
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h2>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Account ID</span>
                        <span className="text-gray-900 font-mono text-xs">{user?.$id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Created</span>
                        <span className="text-gray-900">{user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Email Verified</span>
                        <span className={user?.emailVerification ? "text-green-600" : "text-yellow-600"}>
                            {user?.emailVerification ? "Yes" : "No"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
