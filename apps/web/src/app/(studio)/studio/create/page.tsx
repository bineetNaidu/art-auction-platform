"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Paintbrush, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Artwork } from "@platform/shared-types";

export default function StudioCreatePage() {
  const router = useRouter();
  
  // Interactive form states mapping to backend API spec
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [artistId, setArtistId] = useState(""); // Shared identity pointer

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    // Pull token directly from client context cookies
    const match = document.cookie.match(/(^| )aura_session_token=([^;]+)/);
    const token = match ? match[2] : undefined;

    if (!token) {
      setFeedback({
        type: "error",
        message: "Authorization missing. Please authenticate to register creative assets.",
      });
      setIsLoading(false);
      return;
    }

    // Execute protected asset dispatch
    const response = await apiClient<Artwork>("/artworks", {
      method: "POST",
      token,
      body: JSON.stringify({ title, description, imageUrl, artistId }),
    });

    if (response.success) {
      const createdArtwork = response.data;

      setFeedback({
        type: "success",
        message: "Asset permanently committed to verification ledger. Forwarding to scheduler...",
      });
      
      // Clear form states gracefully
      setTitle("");
      setDescription("");
      setImageUrl("");
      setArtistId("");

      // Deep transition into scheduling pipeline after registration
      // Automatically pass the identifiers forward on the query string matrix
      setTimeout(() => {
        router.push(`/studio/schedule?artworkId=${createdArtwork!.id}&artistId=${createdArtwork!.artistId}`);
      }, 2000);
    } else {
      setFeedback({
        type: "error",
        message: response.message || "Failed to commit asset parameters to the decentralized node.",
      });
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
            <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
              Creator Identity Key (Artist ID)
            </label>
            <input
              type="text"
              required
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker outline-none transition-colors duration-200"
              placeholder="e.g., usr_ledger_9921x"
            />
          </div>
        </div>

        <div>
          <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
            High-Resolution Media Canvas Uniform Resource Locator (Image URL)
          </label>
          <input
            type="url"
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={isLoading}
            className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-ticker outline-none transition-colors duration-200"
            placeholder="https://images.unsplash.com/your-premium-curated-art-asset"
          />
        </div>

        <div>
          <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
            Curator Editorial Notes & Provenance Framework Description
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className="w-full bg-bg-card border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-editorial outline-none transition-colors duration-200 resize-none leading-relaxed"
            placeholder="Elaborate extensively on historical canvas creation profiles, dimension materials, medium choices, and contextual collection themes..."
          />
        </div>

        {/* Action Dispatch Node with Fine Spring Motion Profile */}
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
                Register Exhibition Asset <Paintbrush size={14} />
              </>
            )}
          </motion.button>
        </div>

      </form>
    </div>
  );
}