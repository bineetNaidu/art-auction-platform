"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Paintbrush, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Artwork } from "@platform/shared-types";
import { getClientSession, getClientToken } from "@/lib/auth";

export default function StudioCreatePage() {
  const router = useRouter();

  // Interactive form states mapping to backend API spec
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [artistId, setArtistId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Automatically resolve authenticated user context on component mount
  useEffect(() => {
    const session = getClientSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    // ROLE GUARD: Instantly deflect ordinary buyers away from administrative creator loops
    if (session.role === "buyer") {
      router.replace("/");
      return;
    }

    const resolvedId = session.userId || session.id;
    if (resolvedId) {
      setArtistId(resolvedId);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const token = getClientToken();
    if (!token || !artistId) {
      setFeedback({ type: "error", message: "Authorization profile missing. Re-authenticate." });
      setIsLoading(false);
      return;
    }

    // Execute protected asset dispatch
    const response = await apiClient<Artwork>("/artworks", {
      method: "POST",
      token,
      body: JSON.stringify({ title, description, imageUrl, artistId }),
    });

    if (response.success && response.data) {
      const createdArtwork = response.data;

      setFeedback({
        type: "success",
        message: "Asset permanently committed to verification ledger. Forwarding to scheduler...",
      });

      // Clear user editable form states gracefully
      setTitle("");
      setDescription("");
      setImageUrl("");

      // Deep transition into scheduling pipeline after registration
      // Automatically pass the identifiers forward on the query string matrix
      setTimeout(() => {
        router.push(`/studio/schedule?artworkId=${createdArtwork.id}&artistId=${createdArtwork.artistId}`);
      }, 2000);
    } else {
      setFeedback({ type: "error", message: response.message || "Failed to commit asset parameters." });
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20">

      {/* Editorial Navigation Headers */}
      <div className="border-b border-white/6 pb-6 mb-10">
        <span className="font-ticker text-xs uppercase tracking-widest text-gold-accent mb-2 block">
          Creator Studio Engine
        </span>
        <h1 className="font-editorial text-3xl md:text-4xl text-text-primary tracking-wide italic">
          Register New Masterwork Canvas
        </h1>
      </div>

      {/* Dynamic Feedback Messaging Frame */}
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
              Masterwork Exhibition Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-interface outline-none transition-colors duration-200"
              placeholder="e.g., Spatial Synthesis No. 12"
            />
          </div>

          <div>
            <label className="font-interface text-xs uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
              Creator Identity Key (Artist ID)
              <span className="text-gold-accent inline-flex items-center gap-0.5 normal-case text-[10px]">
                <ShieldCheck size={11} /> Secured Profile
              </span>
            </label>
            <input
              type="text"
              required
              readOnly
              disabled
              value={artistId}
              className="w-full bg-white/1 border border-white/4 text-sm text-text-muted px-4 py-3 rounded-lg font-ticker outline-none select-none cursor-not-allowed opacity-50"
              placeholder="Resolving context keys..."
            />
          </div>
        </div>

        <div>
          <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
            High-Resolution Media Canvas URL
          </label>
          <input
            type="url"
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={isLoading}
            className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker outline-none transition-colors duration-200"
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div>
          <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
            Curator Editorial Notes & Provenance
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-editorial outline-none transition-colors duration-200 resize-none leading-relaxed"
            placeholder="Elaborate extensively on historical canvas creation profiles..."
          />
        </div>

        {/* Action Dispatch Node with Fine Spring Motion Profile */}
        <div className="pt-4 border-t border-white/4 flex justify-end">
          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.99 }}
            type="submit"
            disabled={isLoading || !artistId}
            className="bg-text-primary hover:bg-gold-accent disabled:bg-white/2 text-bg-main disabled:text-text-muted font-interface font-medium text-xs uppercase tracking-widest py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <>Register Exhibition Asset <Paintbrush size={14} /></>}
          </motion.button>
        </div>

      </form>
    </div>
  );
}