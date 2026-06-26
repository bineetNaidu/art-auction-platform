"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarClock, Loader2, AlertCircle, CheckCircle2, DollarSign, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Artwork } from "@platform/shared-types";
import { getClientSession, getClientToken } from "@/lib/auth";

export default function StudioSchedulePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [artworkId, setArtworkId] = useState("");
    const [sellerId, setSellerId] = useState(""); // Immutably resolved from profile context
    const [priceInput, setPriceInput] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
    const [isFetchingVault, setIsFetchingVault] = useState(false);

    useEffect(() => {
        const session = getClientSession();
        if (!session) {
            router.replace("/login");
            return;
        }

        // ROLE GUARD: Buyers cannot access scheduling tools
        if (session.role === "buyer") {
            router.replace("/");
            return;
        }

        // Enforce immutable seller payload alignment matching current user context identity
        const currentUserId = session.userId || session.id;
        if (currentUserId) {
            setSellerId(currentUserId);
        }

        const queryArtworkId = searchParams.get("artworkId");
        if (queryArtworkId) {
            setArtworkId(queryArtworkId);
        } else {
            // Direct access fallback lookup loop
            const loadCreatorVault = async () => {
                setIsFetchingVault(true);
                const token = getClientToken();

                if (token) {
                    const response = await apiClient<Artwork[]>("/artworks", { token });
                    if (response.success && response.data) {
                        setMyArtworks(response.data);
                    }
                }
                setIsFetchingVault(false);
            };

            loadCreatorVault();
        }
    }, [searchParams, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFeedback(null);

        const startTimestamp = new Date(startTime).getTime();
        const endTimestamp = new Date(endTime).getTime();

        if (endTimestamp <= startTimestamp) {
            setFeedback({ type: "error", message: "The ending timestamp must strictly exceed the start window." });
            setIsLoading(false);
            return;
        }

        const floatPrice = parseFloat(priceInput);
        if (isNaN(floatPrice) || floatPrice <= 0) {
            setFeedback({ type: "error", message: "Opening valuation must be a positive number." });
            setIsLoading(false);
            return;
        }

        const startPriceInCents = Math.round(floatPrice * 100);
        const token = getClientToken();

        if (!token || !sellerId) {
            setFeedback({ type: "error", message: "Authorization context lost. Re-login." });
            setIsLoading(false);
            return;
        }

        const response = await apiClient("/auctions", {
            method: "POST",
            token,
            body: JSON.stringify({
                artworkId,
                sellerId, // Safely tied to the verified user session state
                startPrice: startPriceInCents,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
            }),
        });

        if (response.success) {
            setFeedback({ type: "success", message: "Auction live framework successfully established." });
            setArtworkId("");
            setPriceInput("");
            setStartTime("");
            setEndTime("");

            // Transition to global landing floor
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } else {
            setFeedback({ type: "error", message: response.message || "Gateway rejected the event parameters." });
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20">

            {/* Editorial Navigation Headers */}
            <div className="border-b border-white/6 pb-6 mb-10">
                <span className="font-ticker text-xs uppercase tracking-widest text-gold-accent mb-2 block">
                    Curator Scheduling Matrix
                </span>
                <h1 className="font-editorial text-3xl md:text-4xl text-text-primary tracking-wide italic">
                    Initialize Auction Event Floor
                </h1>
            </div>

            {/* Reactive Feedback Messaging Context */}
            {feedback && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-8 p-4 rounded-xl border text-xs font-interface flex items-center gap-3 ${feedback.type === "error" ? "bg-crimson-alert/10 border-crimson-alert/20 text-crimson-alert" : "bg-gold-accent/10 border-gold-accent/20 text-gold-accent"
                        }`}
                >
                    {feedback.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{feedback.message}</span>
                </motion.div>
            )}

            {/* Structural Forms Mapping */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
                            Target Artwork Hash Reference
                        </label>
                        {myArtworks.length > 0 ? (
                            <select
                                value={artworkId}
                                onChange={(e) => setArtworkId(e.target.value)}
                                className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg outline-none font-interface"
                            >
                                <option value="">Select from your registered vault...</option>
                                {myArtworks.map((art) => (
                                    <option key={art.id} value={art.id}>
                                        {art.title} (Ref: {art.id.slice(0, 8)}...)
                                    </option>
                                ))}
                            </select>
                        ) : (
                            /* Fallback text input if vault is empty or offline */
                            <input
                                type="text"
                                required
                                value={artworkId}
                                onChange={(e) => setArtworkId(e.target.value)}
                                placeholder="Enter cryptographic artwork hash reference..."
                                className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker outline-none"
                            />
                        )}
                    </div>

                    <div>
                        <label className="font-interface text-xs uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                            Consignor Identity Reference (Seller ID)
                            <span className="text-gold-accent inline-flex items-center gap-0.5 normal-case text-[10px]">
                                <ShieldCheck size={11} /> Verified Account
                            </span>
                        </label>
                        <input
                            type="text"
                            required
                            readOnly
                            disabled
                            value={sellerId}
                            className="w-full bg-white/1 border border-white/4 text-sm text-text-muted px-4 py-3 rounded-lg font-ticker outline-none select-none cursor-not-allowed opacity-50"
                            placeholder="Resolving account reference..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
                        Opening Valuation Reserve (Amount in USD)
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                            <DollarSign size={14} />
                        </div>
                        <input
                            type="number"
                            required
                            step="0.01"
                            min="0.01"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary pl-10 pr-4 py-3 rounded-lg font-ticker outline-none"
                            placeholder="15000.00"
                        />
                    </div>
                    <span className="text-[10px] font-interface text-text-muted mt-1.5 block">
                        Values will automatically scale integer-wise down to absolute cents within platform databases.
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
                            Bidding System Initialization Timestamp
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker uppercase outline-none"
                        />
                    </div>

                    <div>
                        <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
                            Exhibition Lock/Ceiling Timestamp
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker uppercase outline-none"
                        />
                    </div>
                </div>

                {/* Form Action Controls with Micro Scaling Physics */}
                <div className="pt-4 border-t border-white/4 flex justify-end">
                    <motion.button
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.99 }}
                        type="submit"
                        disabled={isLoading || !sellerId}
                        className="bg-text-primary hover:bg-gold-accent disabled:bg-white/2 text-bg-main disabled:text-text-muted font-interface font-medium text-xs uppercase tracking-widest py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <>Queue Event Parameters <CalendarClock size={14} /></>}
                    </motion.button>
                </div>

            </form>
        </div>
    );
}