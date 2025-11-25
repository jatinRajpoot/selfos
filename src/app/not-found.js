import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
            <div className="text-center max-w-md">
                <div className="mx-auto w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                    <span className="text-4xl font-bold text-indigo-600">404</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
                <p className="text-gray-500 mb-8">
                    Sorry, we couldn't find the page you're looking for. It might have been removed or the link is incorrect.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
