"use client";
import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await account.get();
                setUser(session);
            } catch (error) {
                router.push("/auth");
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, [router]);

    const handleLogout = async () => {
        try {
            await account.deleteSession("current");
            router.push("/auth");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: "LayoutGrid" },
        { name: "Courses", href: "/dashboard/courses", icon: "BookOpen" },
        { name: "Notes", href: "/dashboard/notes", icon: "FileText" },
        { name: "Settings", href: "/dashboard/settings", icon: "Settings" },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 bg-white">
                <div className="flex h-16 items-center px-6 border-b border-gray-100">
                    <span className="text-xl font-bold text-gray-900">SelfOS</span>
                </div>
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive
                                        ? "bg-indigo-50 text-indigo-600"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                {/* Icon Placeholder */}
                                <span className="h-5 w-5 bg-current opacity-20 rounded-sm"></span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-4 left-0 w-full px-4">
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                        <span className="h-5 w-5 bg-current opacity-20 rounded-sm"></span>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {navItems.find((i) => i.href === pathname)?.name || "Dashboard"}
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Welcome back, {user.name}</span>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </header>
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
