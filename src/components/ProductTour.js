"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles, BookOpen, FileText, Settings, LayoutGrid, Plus, CheckCircle } from "lucide-react";

// Tour steps configuration
const TOUR_STEPS = [
    {
        id: "welcome",
        title: "Welcome to SelfOS! 🎉",
        description: "Your personal Learning Management System. Let's take a quick tour to help you get started and make the most of your learning journey.",
        target: null, // No target, just welcome modal
        placement: "center",
        icon: Sparkles,
    },
    {
        id: "dashboard",
        title: "Your Dashboard",
        description: "This is your home base. See your learning streak, completed lessons, and quick-capture notes. Track your daily progress at a glance!",
        target: "[data-tour='dashboard-link']",
        placement: "right",
        icon: LayoutGrid,
    },
    {
        id: "streak",
        title: "Learning Streak",
        description: "Stay consistent! Your streak tracks how many consecutive days you've been learning. Complete lessons daily to keep it going.",
        target: "[data-tour='streak-card']",
        placement: "bottom",
        icon: Sparkles,
    },
    {
        id: "quick-capture",
        title: "Quick Capture",
        description: "Had a brilliant idea? Jot it down instantly! Quick capture lets you save thoughts without interrupting your flow.",
        target: "[data-tour='quick-capture']",
        placement: "left",
        icon: FileText,
    },
    {
        id: "courses",
        title: "Your Courses",
        description: "Access all your courses here. Create structured learning paths with chapters to master any subject.",
        target: "[data-tour='courses-link']",
        placement: "right",
        icon: BookOpen,
    },
    {
        id: "create-course",
        title: "Create Your First Course",
        description: "Ready to start learning? Create a course by clicking 'Create New Course'. Add chapters to organize your learning material.",
        target: "[data-tour='create-course-btn']",
        placement: "bottom",
        icon: Plus,
    },
    {
        id: "notes",
        title: "Your Notes",
        description: "All your notes organized in one place! Notes are automatically organized by course and chapter for easy reference.",
        target: "[data-tour='notes-link']",
        placement: "right",
        icon: FileText,
    },
    {
        id: "settings",
        title: "Settings",
        description: "Customize your experience! Update your profile, set your daily learning goal, and manage your account preferences.",
        target: "[data-tour='settings-link']",
        placement: "right",
        icon: Settings,
    },
    {
        id: "daily-goal",
        title: "Daily Learning Goal",
        description: "Set a daily goal to stay on track. Complete your target number of lessons each day to build a strong learning habit!",
        target: "[data-tour='daily-goal']",
        placement: "left",
        icon: CheckCircle,
    },
    {
        id: "complete",
        title: "You're All Set! 🚀",
        description: "That's the tour! Start by creating your first course or exploring the dashboard. Happy learning!",
        target: null,
        placement: "center",
        icon: Sparkles,
    },
];

// Local storage key
const TOUR_COMPLETED_KEY = "selfos_tour_completed";
const TOUR_DISMISSED_KEY = "selfos_tour_dismissed";

// Calculate tooltip position based on target element and placement
function getTooltipPosition(targetRect, placement, tooltipSize = { width: 380, height: 200 }) {
    if (!targetRect) {
        // Center in viewport
        return {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
        };
    }

    const gap = 16;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    switch (placement) {
        case "top":
            return {
                top: targetRect.top + scrollY - tooltipSize.height - gap,
                left: targetRect.left + scrollX + targetRect.width / 2 - tooltipSize.width / 2,
            };
        case "bottom":
            return {
                top: targetRect.bottom + scrollY + gap,
                left: targetRect.left + scrollX + targetRect.width / 2 - tooltipSize.width / 2,
            };
        case "left":
            return {
                top: targetRect.top + scrollY + targetRect.height / 2 - tooltipSize.height / 2,
                left: targetRect.left + scrollX - tooltipSize.width - gap,
            };
        case "right":
            return {
                top: targetRect.top + scrollY + targetRect.height / 2 - tooltipSize.height / 2,
                left: targetRect.right + scrollX + gap,
            };
        default:
            return {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            };
    }
}

// Spotlight overlay component
function Spotlight({ targetRect }) {
    if (!targetRect) return null;

    const padding = 8;
    const borderRadius = 12;

    return (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
            <svg className="w-full h-full">
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left - padding}
                            y={targetRect.top - padding}
                            width={targetRect.width + padding * 2}
                            height={targetRect.height + padding * 2}
                            rx={borderRadius}
                            ry={borderRadius}
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.75)"
                    mask="url(#spotlight-mask)"
                />
            </svg>
            {/* Animated ring around target */}
            <div
                className="absolute border-2 border-indigo-400 rounded-xl animate-pulse"
                style={{
                    top: targetRect.top - padding,
                    left: targetRect.left - padding,
                    width: targetRect.width + padding * 2,
                    height: targetRect.height + padding * 2,
                }}
            />
        </div>
    );
}

// Tooltip component
function Tooltip({ step, stepIndex, totalSteps, onNext, onPrev, onSkip, position, targetRect }) {
    const Icon = step.icon;
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === totalSteps - 1;
    const isCentered = !targetRect;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-[9999] w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ${isCentered ? "" : ""}`}
            style={{
                ...position,
                maxWidth: "calc(100vw - 32px)",
            }}
        >
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
                <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                />
            </div>

            <div className="p-6">
                {/* Icon and title */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                        <span className="text-xs text-gray-400">
                            Step {stepIndex + 1} of {totalSteps}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{step.description}</p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onSkip}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Skip tour
                    </button>
                    <div className="flex items-center gap-2">
                        {!isFirst && (
                            <button
                                onClick={onPrev}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                        )}
                        <button
                            onClick={onNext}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            {isLast ? "Get Started" : "Next"}
                            {!isLast && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Welcome modal for starting tour
function WelcomePrompt({ onStart, onDismiss }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header illustration */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center">
                    <div className="w-20 h-20 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to SelfOS!</h2>
                    <p className="text-indigo-100 text-sm">Your personal learning journey starts here</p>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 text-center mb-6">
                        Would you like a quick tour to discover all the features and get the most out of your learning experience?
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onStart}
                            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            Take the Tour
                        </button>
                        <button
                            onClick={onDismiss}
                            className="w-full py-3 px-4 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 text-center mt-4">
                        You can always restart the tour from Settings
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Main ProductTour component
export default function ProductTour({ forceStart = false, onComplete }) {
    const [isActive, setIsActive] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({});

    // Check if tour should show on mount
    useEffect(() => {
        if (forceStart) {
            setIsActive(true);
            setCurrentStep(0);
            return;
        }

        // Check localStorage first
        const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
        const dismissed = localStorage.getItem(TOUR_DISMISSED_KEY);

        // For OAuth users, localStorage might not be set properly on first login
        // Also check sessionStorage as a fallback for current session
        const sessionChecked = sessionStorage.getItem("selfos_tour_session_checked");

        if (!completed && !dismissed) {
            // Mark this session as checked to avoid re-showing on navigation
            sessionStorage.setItem("selfos_tour_session_checked", "true");
            
            // Show welcome prompt for new users
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (!sessionChecked && !completed && dismissed) {
            // User previously dismissed but this is a new session - don't show again
            sessionStorage.setItem("selfos_tour_session_checked", "true");
        }
    }, [forceStart]);

    // Update target element position
    const updateTargetPosition = useCallback(() => {
        const step = TOUR_STEPS[currentStep];
        if (!step?.target) {
            setTargetRect(null);
            setTooltipPosition(getTooltipPosition(null, "center"));
            return;
        }

        const element = document.querySelector(step.target);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
            setTooltipPosition(getTooltipPosition(rect, step.placement));

            // Scroll element into view if needed
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            setTargetRect(null);
            setTooltipPosition(getTooltipPosition(null, "center"));
        }
    }, [currentStep]);

    // Update position on step change and window resize
    useEffect(() => {
        if (!isActive) return;

        updateTargetPosition();

        // Small delay to allow page navigation
        const timer = setTimeout(updateTargetPosition, 300);

        window.addEventListener("resize", updateTargetPosition);
        window.addEventListener("scroll", updateTargetPosition);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateTargetPosition);
            window.removeEventListener("scroll", updateTargetPosition);
        };
    }, [isActive, currentStep, updateTargetPosition]);

    const handleStartTour = () => {
        setShowPrompt(false);
        setIsActive(true);
        setCurrentStep(0);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(TOUR_DISMISSED_KEY, "true");
    };

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Complete tour
            setIsActive(false);
            localStorage.setItem(TOUR_COMPLETED_KEY, "true");
            onComplete?.();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSkip = () => {
        setIsActive(false);
        localStorage.setItem(TOUR_DISMISSED_KEY, "true");
    };

    return (
        <>
            {/* Welcome Prompt */}
            <AnimatePresence>
                {showPrompt && (
                    <WelcomePrompt onStart={handleStartTour} onDismiss={handleDismiss} />
                )}
            </AnimatePresence>

            {/* Active Tour */}
            <AnimatePresence>
                {isActive && (
                    <>
                        {/* Dark overlay with spotlight */}
                        <Spotlight targetRect={targetRect} />

                        {/* Tooltip */}
                        <Tooltip
                            step={TOUR_STEPS[currentStep]}
                            stepIndex={currentStep}
                            totalSteps={TOUR_STEPS.length}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            onSkip={handleSkip}
                            position={tooltipPosition}
                            targetRect={targetRect}
                        />
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// Hook to restart tour programmatically
export function useTour() {
    const resetTour = () => {
        localStorage.removeItem(TOUR_COMPLETED_KEY);
        localStorage.removeItem(TOUR_DISMISSED_KEY);
        window.location.reload();
    };

    const startTour = () => {
        // Dispatch custom event to start tour
        window.dispatchEvent(new CustomEvent("start-tour"));
    };

    return { resetTour, startTour };
}

// Export for settings page
export function TourResetButton() {
    const { resetTour } = useTour();

    return (
        <button
            onClick={resetTour}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
            <Sparkles className="w-4 h-4" />
            Restart Product Tour
        </button>
    );
}
