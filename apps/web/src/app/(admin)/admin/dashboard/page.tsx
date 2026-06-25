import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Artwork } from "@platform/shared-types";
import AdminDashboardClient from "./AdminDashboardClient";

interface AnalyticsData {
    totalAuctions: number;
    totalBids: number;
    totalVolumeCents: number;
    updatedAt: string;
}

export default async function AdminDashboardPage() {
    // Extract session tokens from incoming server headers context
    const cookieStore = await cookies();
    const token = cookieStore.get("aura_session_token")?.value;

    // Catch unauthenticated access requests instantly before invoking heavy API traffic
    if (!token) {
        return (
            <div className="min-h-screen bg-bg-main flex items-center justify-center px-6">
                <div className="bg-bg-card border border-crimson-alert/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-crimson-alert/10 text-crimson-alert mb-4">
                        <ShieldAlert size={22} />
                    </div>
                    <h2 className="font-editorial text-2xl text-text-primary italic mb-2">
                        Clearance Level Violation
                    </h2>
                    <p className="font-interface text-xs text-text-muted mb-6 leading-relaxed">
                        Your current identity profile lacks the cryptographic authorization signatures required to access administrative diagnostic nodes.
                    </p>
                    <Link
                        href="/"
                        className="w-full bg-white hover:bg-gold-accent text-bg-main font-interface text-xs uppercase tracking-widest py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300"
                    >
                        <ArrowLeft size={14} /> Escape Floor
                    </Link>
                </div>
            </div>
        );
    }

    // Execute protected data-pipeline resolutions in parallel
    const [analyticsResponse, artworksResponse] = await Promise.all([
        apiClient<AnalyticsData>("/analytics/dashboard", { token, cache: "no-store" }),
        apiClient<Artwork[]>("/artworks", { token, cache: "no-store" }),
    ]);

    // Handle authorization or gateway errors securely
    if (!analyticsResponse.success || !artworksResponse.success) {
        return (
            <div className="min-h-screen bg-bg-main flex items-center justify-center px-6">
                <div className="bg-bg-card border border-white/6 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/4 text-text-muted mb-4">
                        <ShieldAlert size={22} />
                    </div>
                    <h2 className="font-editorial text-2xl text-text-primary italic mb-2">
                        Ledger Synchronization Fault
                    </h2>
                    <p className="font-interface text-xs text-text-muted mb-6 leading-relaxed">
                        {analyticsResponse.message || "Failed to parse platform health metrics. Gateway connection dropped."}
                    </p>
                    <Link
                        href="/"
                        className="w-full bg-white/4 text-text-primary border border-white/8 font-interface text-xs uppercase tracking-widest py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={14} /> Return to Security Entry
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AdminDashboardClient
            initialMetrics={analyticsResponse.data!}
            initialArtworks={artworksResponse.data || []}
            token={token}
        />
    );
}