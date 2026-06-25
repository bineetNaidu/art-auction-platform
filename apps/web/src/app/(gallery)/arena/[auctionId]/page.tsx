import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Auction, Artwork, Bid } from "@platform/shared-types";
import { ArenaRoomClient } from "./ArenaRoomClient";

interface PageProps {
  params: Promise<{ auctionId: string }>;
}

export default async function LiveAuctionArenaPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { auctionId } = resolvedParams;

  // Extract authentication token from session cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("aura_session_token")?.value;

  // 1. Fetch the Active Auction Event profile
  const auctionResponse = await apiClient<Auction>(`/auctions/${auctionId}`, {
    token,
    cache: "no-store",
  });

  if (!auctionResponse.success || !auctionResponse.data) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center px-6">
        <div className="bg-bg-card border border-white/6 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-crimson-alert/10 text-crimson-alert mb-4">
            <AlertTriangle size={22} />
          </div>
          <h2 className="font-editorial text-2xl text-text-primary italic mb-2">
            Arena Link Invalidation
          </h2>
          <p className="font-interface text-xs text-text-muted mb-6 leading-relaxed">
            The requested auction house parameters could not be synchronized. The execution block may have expired or been expunged.
          </p>
          <Link
            href="/"
            className="w-full bg-white hover:bg-gold-accent text-bg-main font-interface text-xs uppercase tracking-widest py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300"
          >
            <ArrowLeft size={14} /> Return to Exhibition
          </Link>
        </div>
      </div>
    );
  }

  const auction = auctionResponse.data;

  // 2. Resolve the relational artwork data and chronological bid history parallel stack
  const [artworkResponse, bidsResponse] = await Promise.all([
    apiClient<Artwork>(`/artworks/${auction.artworkId}`, { token, cache: "no-store" }),
    apiClient<Bid[]>(`/bids/auction/${auctionId}`, { token, cache: "no-store" }),
  ]);

  const artwork = artworkResponse.data || null;
  const initialBids = bidsResponse.data || [];

  return (
    <ArenaRoomClient
      auction={auction}
      artwork={artwork}
      initialBids={initialBids}
      token={token}
    />
  );
}