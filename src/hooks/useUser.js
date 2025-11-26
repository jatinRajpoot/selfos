"use client";
import useSWR from "swr";
import { account } from "@/lib/appwrite";

const fetcher = async () => {
    try {
        return await account.get();
    } catch (error) {
        // Return null if not authenticated
        if (error.code === 401) return null;
        throw error;
    }
};

export function useUser() {
    const { data: user, error, isLoading, mutate } = useSWR("user", fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000, // Cache for 1 minute
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user && !error,
        error,
        mutate,
    };
}
