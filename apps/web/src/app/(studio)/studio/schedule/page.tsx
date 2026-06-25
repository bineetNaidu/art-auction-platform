"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarClock, Loader2, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function StudioSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core state metrics mapped to backend specification
  const [artworkId, setArtworkId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [priceInput, setPriceInput] = useState(""); // Managed as raw decimal string on UI thread
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const queryArtworkId = searchParams.get("artworkId");
    const queryArtistId = searchParams.get("artistId");

    if (queryArtworkId) setArtworkId(queryArtworkId);
    if (queryArtistId) setSellerId(queryArtistId);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    // Enforce chronological correctness before executing network traffic
    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();

    if (endTimestamp <= startTimestamp) {
      setFeedback({
        type: "error",
        message: "Temporal paradox detected. The ending ceiling limit must strictly exceed the initialization timestamp.",
      });
      setIsLoading(false);
      return;
    }

    const floatPrice = parseFloat(priceInput);
    if (isNaN(floatPrice) || floatPrice <= 0) {
      setFeedback({
        type: "error",
        message: "Opening valuation metadata must be a positive numeric metric.",
      });
      setIsLoading(false);
      return;
    }

    // STRICT CURRENCY VALUE RULE: Absolute conversion to integer cents
    const startPriceInCents = Math.round(floatPrice * 100);

    // Extract authorization context securely
    const match = document.cookie.match(/(^| )aura_session_token=([^;]+)/);
    const token = match ? match[2] : undefined;

    if (!token) {
      setFeedback({
        type: "error",
        message: "Authorization expired. Re-authenticate to broadcast market windows.",
      });
      setIsLoading(false);
      return;
    }

    // Dispatch parameters to the transaction layer matrix
    const response = await apiClient("/auctions", {
      method: "POST",
      token,
      body: JSON.stringify({
        artworkId,
        sellerId,
        startPrice: startPriceInCents, // Forwarded safely as integer cents
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      }),
    });

    if (response.success) {
      setFeedback({
        type: "success",
        message: "Auction parameters registered and queued. Relocating to catalog overview boards...",
      });

      // Purge state inputs cleanly
      setArtworkId("");
      setSellerId("");
      setPriceInput("");
      setStartTime("");
      setEndTime("");

      // Transition to global landing floor
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } else {
      setFeedback({
        type: "error",
        message: response.message || "Ecosystem gateway rejected the temporal event layout.",
      });
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
          className={`mb-8 p-4 rounded-xl border text-xs font-interface flex items-center gap-3 ${
            feedback.type === "error"
              ? "bg-crimson-alert/10 border-crimson-alert/20 text-crimson-alert"
              : "bg-gold-accent/10 border-gold-accent/20 text-gold-accent"
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
              Target Artwork Hash Reference (Artwork ID)
            </label>
            <input
              type="text"
              required
              value={artworkId}
              onChange={(e) => setArtworkId(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker outline-none transition-colors duration-200"
              placeholder="e.g., art_ledger_0411b"
            />
          </div>

          <div>
            <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
              Consignor Identity Reference (Seller ID)
            </label>
            <input
              type="text"
              required
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker outline-none transition-colors duration-200"
              placeholder="e.g., usr_ledger_9921x"
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
              className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary pl-10 pr-4 py-3 rounded-lg font-ticker outline-none transition-colors duration-200"
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
              className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker uppercase outline-none transition-colors duration-200"
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
              className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker uppercase outline-none transition-colors duration-200"
            />
          </div>
        </div>

        {/* Form Action Controls with Micro Scaling Physics */}
        <div className="pt-4 border-t border-white/4 flex justify-end">
          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.99 }}
            type="submit"
            disabled={isLoading}
            className="bg-text-primary hover:bg-gold-accent disabled:bg-white/2 text-bg-main disabled:text-text-muted font-interface font-medium text-xs uppercase tracking-widest py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                Queue Event Parameters <CalendarClock size={14} />
              </>
            )}
          </motion.button>
        </div>

      </form>
    </div>
  );
}