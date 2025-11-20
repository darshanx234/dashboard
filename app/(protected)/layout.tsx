

'use client';
import { useAuthStore } from "@/lib/store/auth";
import { redirect } from "next/navigation";
import React from "react";



export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    const { user } = useAuthStore();
    const checkAuth = useAuthStore((state) => state.checkAuth);
    const [hasInitialized, setHasInitialized] = React.useState(false);
    // Initialize auth on mount - runs only once
    React.useEffect(() => {
        const initAuth = async () => {
            await checkAuth();
            setHasInitialized(true);
        };
        initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once

    // if (!user) {
    //     redirect('/login');  
    // }

    if (!hasInitialized) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }


    return (
        <>
            {children}
        </>
    );
}
