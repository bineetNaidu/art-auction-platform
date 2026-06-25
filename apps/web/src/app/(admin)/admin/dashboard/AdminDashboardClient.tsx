"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, Layers, TrendingUp, ShieldCheck, ShieldAlert, Check, RefreshCw, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Artwork } from "@platform/shared-types";

interface AnalyticsData {
    totalAuctions: number;
    totalBids: number;
    totalVolumeCents: number;
    updatedAt: string;
}

interface ClientProps {
    initialMetrics: AnalyticsData;
    initialArtworks: Artwork[];
    token: string;
}

export default function AdminDashboardClient({ initialMetrics, initialArtworks, token }: ClientProps) {
    const [metrics, setMetrics] = useState<AnalyticsData>(initialMetrics);
    const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [errorNotice, setErrorNotice] = useState<string | null>(null);

    // Securely format backend integer cents into viewable currency decimals
    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0, // Keeps macro metrics clean
        }).format(cents / 100);
    };

    // Process PATCH requests to transition validation tracking records
    const toggleVerification = async (id: string, currentStatus: boolean) => {
        setProcessingId(id);
        setErrorNotice(null);
        const targetStatus = !currentStatus;

        const response = await apiClient<Artwork>(`/artworks/${id}/verify`, {
            method: "PATCH",
            token,
            body: JSON.stringify({ isVerified: targetStatus }),
        });

        if (response.success && response.data) {
            // Re-map localized states instantly on the client thread upon database commitment
            setArtworks((prev) =>
                prev.map((art) => (art.id === id ? { ...art, isVerified: response.data!.isVerified } : art))
            );
        } else {
            setErrorNotice(response.message || "Failed to finalize ledger verification status modification.");
        }
        setProcessingId(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">

            {/* Editorial Dashboard Identity Block */}
            <div className="border-b border-white/6 pb-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <span className="font-ticker text-xs uppercase tracking-widest text-crimson-alert mb-2 block">
                        Core Security Level Vector
                    </span>
                    <h1 className="font-editorial text-3xl md:text-4xl text-text-primary tracking-wide italic">
                        Administrative Registry Workspace
                    </h1>
                </div>
                <div className="font-interface text-[10px] text-text-muted uppercase tracking-wider bg-bg-card px-3 py-1.5 rounded-lg border border-white/4">
                    Ledger Synchronization:{" "}
                    <span className="font-ticker text-text-primary">
                        {(() => {
                            const date = new Date(metrics.updatedAt);
                            const hours = String(date.getHours()).padStart(2, "0");
                            const minutes = String(date.getMinutes()).padStart(2, "0");
                            const seconds = String(date.getSeconds()).padStart(2, "0");
                            return `${hours}:${minutes}:${seconds}`;
                        })()}
                    </span>
                </div>
            </div>

            {/* Dynamic Security Feedback Framework */}
            <AnimatePresence>
                {errorNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-8 p-4 bg-crimson-alert/10 border border-crimson-alert/20 text-crimson-alert text-xs font-interface rounded-xl flex items-center gap-2"
                    >
                        <AlertCircle size={14} /> {errorNotice}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Flat Platform Health Summary Metrics Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

                <div className="bg-bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-interface text-xs text-text-muted uppercase tracking-wider">Total Active Auctions</span>
                        <div className="text-text-muted"><Gavel size={16} /></div>
                    </div>
                    <div className="font-ticker text-3xl font-bold text-text-primary">{metrics.totalAuctions}</div>
                    <div className="w-full h-px bg-[linear-gradient(to_right,rgba(212,175,55,0.2),transparent)] absolute bottom-0 left-0" />
                </div>

                <div className="bg-bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-interface text-xs text-text-muted uppercase tracking-wider">Accumulated Bids Placed</span>
                        <div className="text-text-muted"><Layers size={16} /></div>
                    </div>
                    <div className="font-ticker text-3xl font-bold text-text-primary">{metrics.totalBids}</div>
                    <div className="w-full h-px bg-[linear-gradient(to_right,rgba(212,175,55,0.2),transparent)] absolute bottom-0 left-0" />
                </div>

                <div className="bg-bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-interface text-xs text-text-muted uppercase tracking-wider">Gross Platform Volume</span>
                        <div className="text-text-muted"><TrendingUp size={16} /></div>
                    </div>
                    <div className="font-ticker text-3xl font-bold text-gold-accent">
                        {formatCurrency(metrics.totalVolumeCents)}
                    </div>
                    <div className="w-full h-px bg-[linear-gradient(to_right,rgba(212,175,55,0.2),transparent)] absolute bottom-0 left-0" />
                </div>

            </div>

            {/* Interactive Artwork Verification Management Grid */}
            <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/4">
                    <h2 className="font-editorial text-xl text-text-primary italic">
                        Asset Provenance Legal Master Log
                    </h2>
                    <p className="font-interface text-[11px] text-text-muted mt-1">
                        Authorize or restrict decentralized masterwork canvas entries moving across public gallery catalogs.
                    </p>
                </div>

                {artworks.length === 0 ? (
                    <div className="text-center py-12 font-editorial italic text-text-muted text-sm">
                        No canvas containers currently logged within the registry tree.
                    </div>
                ) : (
                    /* High-Fidelity Desktop Grid Management Matrix */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/4 bg-white/1 font-interface text-[10px] uppercase tracking-wider text-text-muted">
                                    <th className="p-4 pl-6">Artwork Title</th>
                                    <th className="p-4">Asset Reference / Hash</th>
                                    <th className="p-4">Consignor Reference</th>
                                    <th className="p-4">Legal Status</th>
                                    <th className="p-4 pr-6 text-right">Administrative Execution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/2 font-interface text-xs text-text-primary">
                                {artworks.map((art) => (
                                    <tr key={art.id} className="hover:bg-white/1 transition-colors">
                                        <td className="p-4 pl-6 font-medium font-editorial text-sm">{art.title}</td>
                                        <td className="p-4 font-ticker text-[11px] text-text-muted">{art.id}</td>
                                        <td className="p-4 font-ticker text-[11px] text-text-muted">{art.artistId}</td>
                                        <td className="p-4">
                                            {art.isVerified ? (
                                                <span className="inline-flex items-center gap-1 text-gold-accent font-medium uppercase tracking-wider text-[9px] bg-gold-accent/5 border border-gold-accent/20 px-2 py-0.5 rounded">
                                                    <ShieldCheck size={10} /> Certified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-text-muted uppercase tracking-wider text-[9px] bg-white/2 border border-white/6 px-2 py-0.5 rounded">
                                                    <ShieldAlert size={10} /> Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <button
                                                type="button"
                                                disabled={processingId === art.id}
                                                onClick={() => toggleVerification(art.id, art.isVerified)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-interface text-[10px] font-medium uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40 ${art.isVerified
                                                    ? "bg-transparent hover:bg-crimson-alert/10 border border-white/8 hover:border-crimson-alert/30 text-text-muted hover:text-crimson-alert"
                                                    : "bg-text-primary hover:bg-gold-accent text-bg-main"
                                                    }`}
                                            >
                                                {processingId === art.id ? (
                                                    <RefreshCw size={11} className="animate-spin" />
                                                ) : art.isVerified ? (
                                                    "Revoke Status"
                                                ) : (
                                                    <>
                                                        <Check size={11} /> Authorize
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}