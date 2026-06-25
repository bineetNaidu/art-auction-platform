"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ShieldCheck, Landmark, CornerDownLeft, Delete, AlertCircle, Eye } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Auction, Artwork, Bid } from "@platform/shared-types";

interface ClientProps {
  auction: Auction;
  artwork: Artwork | null;
  initialBids: Bid[];
  token?: string;
}

export function ArenaRoomClient({ auction, artwork, initialBids, token }: ClientProps) {
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [currentHighest, setCurrentHighest] = useState<number>(
    auction.currentHighestBid > 0 ? auction.currentHighestBid : auction.startPrice
  );
  
  // Bid input state stored strictly as a string representing accumulated dollar dimensions
  const [bidInput, setBidInput] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFinalMinute, setIsFinalMinute] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Core Countdown Engine Cycle
  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(auction.endTime).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft(0);
        setIsFinalMinute(false);
        return;
      }
      setTimeLeft(difference);
      setIsFinalMinute(difference <= 60000); // Trigger crimson threshold state under 60s
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [auction.endTime]);

  // Format Milliseconds to Sharp Monospace Ticker Output (HH:MM:SS)
  const formatTicker = (ms: number) => {
    if (ms <= 0) return "00:00:00 - EXPIRED";
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Tactile Keypad Input Appender
  const handleKeyPress = (val: string) => {
    if (feedback) setFeedback(null);
    if (bidInput.length >= 7) return; // Prevent unreasonable threshold inputs
    setBidInput((prev) => prev + val);
  };

  const handleClear = () => {
    setBidInput("");
  };

  // Place Transaction Submission Routine
  const executeBidSubmission = async () => {
    if (!token) {
      setFeedback({ type: "error", message: "Authentication token missing. Access denied." });
      return;
    }

    const dollarValue = parseFloat(bidInput);
    if (isNaN(dollarValue) || dollarValue <= 0) {
      setFeedback({ type: "error", message: "Specify a valid numeric configuration." });
      return;
    }

    // Convert decimal input securely to absolute integer cents
    const amountInCents = Math.round(dollarValue * 100);

    if (amountInCents <= currentHighest) {
      setFeedback({
        type: "error",
        message: `Value must strictly outbid the current high mark: ${formatCurrency(currentHighest)}`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const response = await apiClient<Bid>("/bids", {
      method: "POST",
      token,
      body: JSON.stringify({
        auctionId: auction.id,
        amount: amountInCents,
        // The API Gateway layer resolves the matching bidderId out of the authorization token context
        bidderId: "SYSTEM_RESOLVED", 
      }),
    });

    if (response.success && response.data) {
      const verifiedBid = response.data;
      setBids((prev) => [...prev, verifiedBid]);
      setCurrentHighest(verifiedBid.amount);
      setBidInput("");
      setFeedback({ type: "success", message: "Bid transaction verified and committed to historical ledger." });
    } else {
      setFeedback({ type: "error", message: response.message || "Transaction dropped by core architecture." });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
      {/* Dynamic Split Screening Layout Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT COLUMN: Cinematic Media & Editorial Linking (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative aspect-4/5 w-full bg-bg-card border border-white/6 rounded-xl overflow-hidden shadow-2xl">
            {artwork?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-editorial text-text-muted italic">
                Media Framework Missing
              </div>
            )}
          </div>
          
          {/* Explicit Cross-Linking Node to Static Editorial Profile */}
          <Link
            href={`/artworks/${artwork?.id}`}
            className="w-full bg-bg-card hover:bg-white/2 border border-white/6 hover:border-white/10 text-text-muted hover:text-text-primary font-interface text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
          >
            <Eye size={14} /> Review Full Editorial & Provenance Ledger
          </Link>
        </div>

        {/* RIGHT COLUMN: Real-Time Bidding Control Panel (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Transaction Card Ticker - Pulsates Crimson in final 60 seconds */}
          <div className={`bg-bg-card border rounded-2xl p-6 transition-all duration-500 ${
            isFinalMinute 
              ? "animate-pulse-crimson border-crimson-alert" 
              : "border-white/6"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/4 pb-4 mb-6">
              <div>
                <span className="font-interface text-[10px] text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Clock size={12} className={isFinalMinute ? "text-crimson-alert animate-pulse" : ""} /> 
                  Temporal Core Counter
                </span>
                <div className={`font-ticker text-2xl font-bold tracking-tight ${isFinalMinute ? "text-crimson-alert" : "text-text-primary"}`}>
                  {formatTicker(timeLeft)}
                </div>
              </div>
              
              <div className="md:text-right">
                <span className="font-interface text-[10px] text-text-muted uppercase tracking-widest block mb-1">
                  Current High Mark Valuation
                </span>
                <div className="font-ticker text-2xl font-bold text-gold-accent">
                  {formatCurrency(currentHighest)}
                </div>
              </div>
            </div>

            {/* Financial Ledger Keypad Interface Layout Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Keypad Display Block Input (5 Columns) */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-bg-main border border-white/8 rounded-xl p-4 text-center min-h-[72px] flex flex-col justify-center">
                  <span className="block font-interface text-[9px] uppercase tracking-wider text-text-muted mb-1">
                    Intent Payload Allocation
                  </span>
                  <div className="font-ticker text-xl font-bold text-text-primary tracking-wide">
                    {bidInput ? `$${bidInput}` : "$0.00"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={executeBidSubmission}
                  disabled={isSubmitting || !bidInput || timeLeft === 0}
                  className="w-full bg-text-primary hover:bg-gold-accent disabled:bg-white/2 text-bg-main disabled:text-text-muted font-interface font-semibold text-xs uppercase tracking-widest py-4 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:cursor-not-allowed shadow-xl"
                >
                  <Landmark size={14} /> Commit Bid Frame
                </button>
              </div>

              {/* Physical Touch Keypad Node Core (7 Columns) */}
              <div className="md:col-span-7 grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeyPress(key)}
                    disabled={timeLeft === 0}
                    className="bg-bg-main hover:bg-white/3 border border-white/4 text-text-primary py-3 rounded-lg font-ticker font-semibold text-sm transition-colors cursor-pointer disabled:opacity-20"
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={timeLeft === 0}
                  className="bg-bg-main hover:bg-crimson-alert/10 border border-white/4 hover:border-crimson-alert/30 text-text-muted hover:text-crimson-alert py-3 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-20"
                >
                  <Delete size={16} />
                </button>
              </div>
            </div>

            {/* Error / Success Feedback Notifications */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-3 rounded-lg border text-xs font-interface flex items-center gap-2 ${
                    feedback.type === "error"
                      ? "bg-crimson-alert/10 border-crimson-alert/20 text-crimson-alert"
                      : "bg-gold-accent/10 border-gold-accent/20 text-gold-accent"
                  }`}
                >
                  <AlertCircle size={14} /> {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chronological Sequential Bid Ledger Display Array */}
          <div className="bg-bg-card border border-white/6 rounded-2xl p-6">
            <h3 className="font-interface text-xs uppercase tracking-widest text-text-muted border-b border-white/4 pb-3 mb-4 flex items-center gap-2">
              <ShieldCheck size={14} className="text-gold-accent" /> Chronological Platform Audit Log
            </h3>
            
            {bids.length === 0 ? (
              <p className="font-editorial text-sm italic text-text-muted text-center py-6">
                No ledger transactions broadcasted. Standard openings apply.
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/4">
                {/* Display ascending linear transaction events */}
                {[...bids].reverse().map((bid, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={bid.id || index}
                    className="flex items-center justify-between bg-bg-main/50 border border-white/2 p-3 rounded-xl font-ticker text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CornerDownLeft size={12} className="text-text-muted" />
                      <span className="text-text-muted truncate max-w-[120px] sm:max-w-none">
                        Ref: ...{bid.bidderId?.slice(-8) || "ANON_BLOCK"}
                      </span>
                    </div>
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(bid.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}