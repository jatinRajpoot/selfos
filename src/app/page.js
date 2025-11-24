"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, BarChart2, FileText, CheckCircle, Menu, X } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">SelfOS</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Log In
            </Link>
            <Link
              href="/auth"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-4 shadow-lg">
            <Link
              href="/auth"
              className="block text-base font-medium text-gray-600 hover:text-gray-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              href="/auth"
              className="block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-base font-medium text-white hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-6">
              Master Your Future with <span className="text-indigo-600">SelfOS</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-8 text-gray-600 px-4">
              The all-in-one platform to create, manage, and track your self-learning journey.
              Organize courses, take notes, and visualize your progress.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <Link
                href="/auth"
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Start Learning Now
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -z-10 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] -translate-x-1/2 rounded-full bg-indigo-50 blur-3xl opacity-50"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Everything you need</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built for the modern self-learner
            </p>
          </div>
          <div className="mx-auto mt-12 sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 sm:gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-white p-2 ring-1 ring-gray-900/10">
                  <BookOpen className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <dt className="mt-4 font-semibold text-gray-900">Course Management</dt>
                <dd className="mt-2 leading-7 text-gray-600">
                  Create your own curriculum. Add videos, articles, and resources to build structured learning paths.
                </dd>
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-white p-2 ring-1 ring-gray-900/10">
                  <BarChart2 className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <dt className="mt-4 font-semibold text-gray-900">Progress Tracking</dt>
                <dd className="mt-2 leading-7 text-gray-600">
                  Visualize your growth with daily streaks, completion stats, and activity logs. Stay motivated.
                </dd>
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-lg bg-white p-2 ring-1 ring-gray-900/10">
                  <FileText className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <dt className="mt-4 font-semibold text-gray-900">Smart Notes</dt>
                <dd className="mt-2 leading-7 text-gray-600">
                  Take notes directly alongside your course content. Organize them hierarchically for easy review.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden bg-gray-900 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-2">
            <div className="max-w-xl lg:max-w-lg">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to start your journey?
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                Join thousands of self-learners who are mastering new skills every day with SelfOS.
              </p>
              <div className="mt-6 flex max-w-md gap-x-4">
                <Link
                  href="/auth"
                  className="flex-none rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Get Started for Free
                </Link>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:pt-2">
              <div className="flex flex-col items-start">
                <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                  <CheckCircle className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <dt className="mt-4 font-semibold text-white">Free Forever</dt>
                <dd className="mt-2 leading-7 text-gray-400">
                  Core features are free. No credit card required.
                </dd>
              </div>
              <div className="flex flex-col items-start">
                <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                  <CheckCircle className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <dt className="mt-4 font-semibold text-white">Open Source</dt>
                <dd className="mt-2 leading-7 text-gray-400">
                  Self-hostable and customizable to your needs.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2024 SelfOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
