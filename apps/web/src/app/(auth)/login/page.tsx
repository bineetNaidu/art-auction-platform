"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Enforce high-level API communication via our type-safe client wrapper
    const response = await apiClient<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      // Set secure token in cookie storage (simulated client layer here)
      document.cookie = `aura_session_token=${response.data.token}; path=/; max-age=86400; SameSite=Strict; Secure`;
      
      // Navigate to the gallery catalog board on successful entry
      router.push("/");
    } else {
      setErrorMessage(response.message || "Invalid credentials. Please verify your collection keys.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-bg-card/70 backdrop-blur-xl border border-white/6 rounded-2xl p-8 shadow-2xl"
    >
      {/* Editorial Header Block */}
      <div className="text-center mb-8">
        <h1 className="font-editorial text-4xl text-text-primary tracking-wide mb-2 italic font-semibold">
          Aura
        </h1>
        <p className="font-interface text-xs text-text-muted uppercase tracking-widest">
          Access the Exhibition Floor
        </p>
      </div>

      {/* Dynamic Network / Validation Alert Bar */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 p-3 bg-crimson-alert/10 border border-crimson-alert/30 text-crimson-alert text-xs font-interface rounded-lg tracking-wide"
        >
          {errorMessage}
        </motion.div>
      )}

      {/* Structural Interactive Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
            Email Identity
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full bg-bg-main border border-white/8 focus:border-gold-accent text-sm text-text-primary px-4 py-3 rounded-lg font-interface outline-none transition-colors duration-200 disabled:opacity-50"
            placeholder="collector@aura.gallery"
          />
        </div>

        <div>
          <label className="block font-interface text-xs uppercase tracking-wider text-text-muted mb-2">
            Security Passphrase
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-main border border-white/8 focus:border-gold-accent text-sm text-text-primary pl-4 pr-10 py-3 rounded-lg font-ticker outline-none transition-colors duration-200 disabled:opacity-50"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Micro-Scaling Premium Action Button */}
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.99 }}
          type="submit"
          disabled={isLoading}
          className="w-full bg-text-primary hover:bg-gold-accent text-bg-main font-interface font-medium text-xs uppercase tracking-widest py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Initialize Authentication <ArrowRight size={14} />
            </>
          )}
        </motion.button>
      </form>

      {/* Secondary Interface Navigation Elements */}
      <div className="mt-6 text-center">
        <p className="font-interface text-xs text-text-muted">
          New to the ecosystem?{" "}
          <Link
            href="/register"
            className="text-text-primary hover:text-gold-accent underline underline-offset-4 transition-colors font-medium ml-1"
          >
            Register Collector Profile
          </Link>
        </p>
      </div>
    </motion.div>
  );
}