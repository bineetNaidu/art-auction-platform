import Link from "next/link";
import { cookies } from "next/headers";
import { AlertCircle, RefreshCw, Clock, Tag } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Auction, Artwork } from "@platform/shared-types";

// Format currency securely converting backend integer cents to viewable decimals
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function GlobalCatalogBoard() {
  // Read the cookie storage container asynchronously on the server engine
  const cookieStore = await cookies();
  const token = cookieStore.get("aura_session_token")?.value;

  // Execute parallel fetch architecture passing the token down securely
  const [auctionsResponse, artworksResponse] = await Promise.all([
    apiClient<Auction[]>("/auctions", { token, cache: "no-store" }),
    apiClient<Artwork[]>("/artworks", { token, cache: "no-store" }),
  ]);

  // HIGH-FIDELITY ERROR HANDLING MATRIX
  // If either endpoint fails, catch cleanly and display an elite, styled feedback board
  if (!auctionsResponse.success || !artworksResponse.success) {
    const errorCode = auctionsResponse.error?.code || artworksResponse.error?.code || "EXHIBITION_FETCH_ERROR";
    const errorMessage = auctionsResponse.message || artworksResponse.message || "Unable to synchronize with the gallery ledger.";

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="bg-bg-card border border-crimson-alert/20 max-w-md w-full rounded-2xl p-8 text-center shadow-xl backdrop-blur-md">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-crimson-alert/10 text-crimson-alert mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="font-editorial text-2xl text-text-primary italic mb-2">
            Exhibition Temporarily Closed
          </h2>
          <p className="font-interface text-xs text-text-muted mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <div className="bg-bg-main border border-white/4 rounded-lg py-2 px-3 mb-6 inline-block">
            <span className="font-ticker text-[10px] uppercase text-crimson-alert tracking-wider">
              Status Flag: {errorCode}
            </span>
          </div>
          <a
            href="/"
            className="w-full bg-white/4 hover:bg-white/8 border border-white/8 text-text-primary font-interface text-xs uppercase tracking-widest py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} /> Reinitialize Connection
          </a>
        </div>
      </div>
    );
  }

  const auctions = auctionsResponse.data || [];
  const artworks = artworksResponse.data || [];

  // Map data fields accurately into an interactive composite structure
  const aggregatedCards = auctions.map((auction) => {
    const associatedArtwork = artworks.find((art) => art.id === auction.artworkId);
    return {
      ...auction,
      artwork: associatedArtwork,
    };
  });


  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Editorial Curatorial Heading */}
      <div className="border-b border-white/6 pb-8 mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="font-ticker text-xs uppercase tracking-widest text-gold-accent mb-2 block">
            Live Global Boards {token ? "• Authenticated" : "• Public View"}
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl text-text-primary tracking-wide italic">
            Current Exhibitions
          </h1>
        </div>
        <p className="font-interface text-xs text-text-muted max-w-xs leading-relaxed md:text-right">
          A highly curated landscape of premium, high-water mark assets moving through global decentralized verification windows.
        </p>
      </div>

      {/* Empty Collection Fallback State */}
      {aggregatedCards.length === 0 ? (
        <div className="text-center py-24 bg-bg-card border border-white/4 rounded-2xl">
          <p className="font-editorial text-xl text-text-muted italic">
            The viewing rooms are currently vacant.
          </p>
          <p className="font-interface text-xs text-text-muted mt-2">
            Scheduled curations are undergoing cryptographic authentication signatures.
          </p>
        </div>
      ) : (
        /* Structural Masonry Layout Matrix */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Replace the contents of the grid layout container with this snippet */}
          {aggregatedCards.map((item) => (
            <div
              key={item.id}
              className="group relative bg-bg-card border border-white/5 hover:border-white/12 rounded-xl overflow-hidden transition-all duration-300 shadow-lg flex flex-col h-full"
            >
              {/* INTERACTIVE ZONE A: Media Aspect Frame -> Routes strictly to the Live Auction Arena */}
              <Link
                href={`/arena/${item.id}`}
                className="relative aspect-square w-full bg-bg-main overflow-hidden border-b border-white/4 block z-0"
              >
                {item.artwork?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.artwork.imageUrl}
                    alt={item.artwork.title}
                    className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-102"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-editorial italic text-text-muted text-sm">
                    No Canvas Registered
                  </div>
                )}

                {/* Floating Status Pill */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`font-interface text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-md font-medium ${item.status === "active"
                      ? "bg-gold-accent/10 border-gold-accent/30 text-gold-accent"
                      : item.status === "pending"
                        ? "bg-text-muted/10 border-text-muted/30 text-text-muted"
                        : "bg-crimson-alert/10 border-crimson-alert/30 text-crimson-alert"
                    }`}>
                    {item.status}
                  </span>
                </div>
              </Link>

              {/* CONTENT & METADATA FRAME */}
              <div className="p-6 flex flex-col grow justify-between">
                <div>
                  <span className="font-interface text-[10px] tracking-widest text-text-muted uppercase block mb-1">
                    {item.artwork?.isVerified ? "✓ Verified Provenance" : "Pending Authentication"}
                  </span>

                  {/* INTERACTIVE ZONE B: Editorial Asset Title -> Elevated via relative z-indexing to link directly to long-term documentation profile */}
                  <h3 className="mb-4 relative z-10">
                    <Link
                      href={`/artworks/${item.artworkId}`}
                      className="font-editorial text-xl text-text-primary hover:text-gold-accent transition-colors block truncate hover:underline underline-offset-4"
                    >
                      {item.artwork?.title || "Untitled Exhibition Block"}
                    </Link>
                  </h3>
                </div>

                {/* INTERACTIVE ZONE C: Financial Analytics Ticker -> Routes cleanly back to Arena for instant trading floor interactions */}
                <Link
                  href={`/arena/${item.id}`}
                  className="grid grid-cols-2 gap-4 border-t border-white/4 pt-4 hover:bg-white/1 transition-colors rounded-lg relative z-0"
                >
                  <div>
                    <span className="font-interface text-[9px] uppercase text-text-muted tracking-wider flex items-center gap-1 mb-1">
                      <Tag size={10} /> {item.status === "active" ? "Highest Bid" : "Opening Valuation"}
                    </span>
                    <span className="font-ticker text-sm font-semibold text-text-primary">
                      {formatCurrency(item.status === "active" ? item.currentHighestBid : item.startPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="font-interface text-[9px] uppercase text-text-muted tracking-wider flex items-center gap-1 mb-1">
                      <Clock size={10} /> Temporal Limit
                    </span>
                    <span className="font-ticker text-xs text-text-muted block truncate">
                      {new Date(item.endTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}