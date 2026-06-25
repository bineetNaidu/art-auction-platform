"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, Paintbrush, ShieldCheck, LogOut, LogIn } from "lucide-react";
import { User } from "@platform/shared-types";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<User["role"] | null>(null);

    // Synchronize client-side session state tracking on mount or path shift
    useEffect(() => {
        const match = document.cookie.match(/(^| )aura_session_token=([^;]+)/);

        if (match) {
            setIsAuthenticated(true);
            const token = match[2];

            try {
                // Natively unpack the cryptographic base64 JWT payload segment
                const payloadBase64 = token.split(".")[1];
                if (payloadBase64) {
                    const decodedPayload = JSON.parse(window.atob(payloadBase64));
                    setUserRole(decodedPayload.role || "buyer"); // Fallback to safe lower privilege
                }
            } catch (error) {
                console.error("Security core signature unpacking failure:", error);
                setUserRole(null);
            }
        } else {
            setIsAuthenticated(false);
            setUserRole(null);
        }
    }, [pathname]);

    const handleLogout = () => {
        // Evict session token from client domain memory context
        document.cookie = "aura_session_token=; path=/; max-age=0; SameSite=Strict; Secure";
        setIsAuthenticated(false);
        setUserRole(null);
        router.refresh();
        router.push("/login");
    };

    // Hide the global navigation layout completely while inside authentication screens
    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
    if (isAuthPage) return null;

    return (
        <header className="sticky top-0 left-0 right-0 z-50 w-full px-6 py-4">
            <nav className="max-w-7xl mx-auto bg-bg-card/40 backdrop-blur-md border border-white/4 rounded-full px-6 py-3 flex items-center justify-between shadow-xl transition-all duration-300">

                {/* Brand Core Node */}
                <Link
                    href="/"
                    className="font-editorial text-2xl text-text-primary tracking-wider italic font-semibold hover:text-gold-accent transition-colors"
                >
                    Aura
                </Link>

                {/* Global Navigation Links Map */}
                <div className="flex items-center gap-1 sm:gap-4 font-interface text-[11px] uppercase tracking-widest font-medium">
                    <Link
                        href="/"
                        className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${pathname === "/"
                                ? "bg-white/6 text-gold-accent border border-gold-accent/20"
                                : "text-text-muted hover:text-text-primary"
                            }`}
                    >
                        <Eye size={12} /> Exhibition
                    </Link>

                    <Link
                        href="/studio/create"
                        className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${pathname.startsWith("/studio")
                                ? "bg-white/6 text-gold-accent border border-gold-accent/20"
                                : "text-text-muted hover:text-text-primary"
                            }`}
                    >
                        <Paintbrush size={12} /> Studio
                    </Link>

                    <Link
                        href="/admin/dashboard"
                        className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${pathname.startsWith("/admin")
                                ? "bg-white/6 text-gold-accent border border-gold-accent/20"
                                : "text-text-muted hover:text-text-primary"
                            }`}
                    >
                        <ShieldCheck size={12} /> Registry
                    </Link>
                </div>

                {/* Action Call Context Node */}
                <div className="flex items-center">
                    {isAuthenticated ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="font-interface text-[10px] uppercase tracking-widest font-medium text-text-muted hover:text-crimson-alert flex items-center gap-1.5 bg-white/2 hover:bg-crimson-alert/5 border border-white/6 hover:border-crimson-alert/20 px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-300"
                        >
                            Disconnect <LogOut size={12} />
                        </motion.button>
                    ) : (
                        <Link
                            href="/login"
                            className="font-interface text-[10px] uppercase tracking-widest font-medium text-bg-main bg-text-primary hover:bg-gold-accent px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-300"
                        >
                            Access Identity <LogIn size={12} />
                        </Link>
                    )}
                </div>

            </nav>
        </header>
    );
}