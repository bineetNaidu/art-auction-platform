import Link from "next/link";
import { cookies } from "next/headers";
import { ShieldCheck, ShieldAlert, ArrowLeft, Calendar, User, Eye } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Artwork } from "@platform/shared-types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtworkEditorialProfile({ params }: PageProps) {
  // Await the dynamic routing promise parameters per Next.js 16 requirements
  const resolvedParams = await params;
  const artworkId = resolvedParams.id;

  // Extract authentication token if available to forward credentials
  const cookieStore = await cookies();
  const token = cookieStore.get("aura_session_token")?.value;

  // Query the artwork record securely from the gateway ledger
  const response = await apiClient<Artwork>(`/artworks/${artworkId}`, {
    token,
    cache: "no-store",
  });


  // HIGH-FIDELITY RECORD EXCEPTION HANDLING
  if (!response.success || !response.data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center">
        <div className="bg-bg-card border border-white/6 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/4 text-text-muted mb-4">
            <ShieldAlert size={22} />
          </div>
          <h2 className="font-editorial text-2xl text-text-primary italic mb-2">
            Asset Missing From Ledger
          </h2>
          <p className="font-interface text-xs text-text-muted mb-6 leading-relaxed">
            The requested artwork hash could not be retrieved. It may have been unlisted, or the provenance trail is broken.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-text-primary hover:bg-gold-accent text-bg-main font-interface text-xs uppercase tracking-widest py-3 px-6 rounded-lg transition-colors cursor-pointer w-full"
          >
            <ArrowLeft size={14} /> Return to Exhibition
          </Link>
        </div>
      </div>
    );
  }

  const artwork = response.data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      {/* Back to Catalog Breadcrumb Anchor */}
      <div className="mb-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 font-interface text-xs uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors group"
        >
          <ArrowLeft size={14} className="transform group-hover:-translate-x-1 transition-transform" /> 
          Back to Exhibition Floors
        </Link>
      </div>

      {/* Asymmetric Editorial Grid Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Massive Cinematic Media Viewport (5 Columns) */}
        <div className="lg:col-span-6 xl:col-span-5">
          <div className="relative aspect-4/5 w-full bg-bg-card border border-white/6 rounded-xl overflow-hidden shadow-2xl">
            {artwork.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="object-cover w-full h-full"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-editorial italic text-text-muted">
                Canvas Not Allocated
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Typographic Information Frame (7 Columns) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
          
          {/* Provenance Verification Badge */}
          <div className="mb-4">
            {artwork.isVerified ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-accent/10 border border-gold-accent/20 text-gold-accent text-[10px] uppercase tracking-widest font-medium">
                <ShieldCheck size={12} /> Legal Provenance Verified
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/4 border border-white/8 text-text-muted text-[10px] uppercase tracking-widest font-medium">
                <ShieldAlert size={12} /> Verification Audit Pending
              </div>
            )}
          </div>

          {/* Masterwork Header */}
          <h1 className="font-editorial text-4xl md:text-5xl lg:text-6xl text-text-primary tracking-wide italic font-medium mb-6 leading-tight">
            {artwork.title}
          </h1>

          {/* Relational Metadata Badges */}
          <div className="grid grid-cols-2 gap-4 border-y border-white/6 py-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/3 border border-white/6 flex items-center justify-center text-text-muted">
                <User size={14} />
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-text-muted">Creator Reference</span>
                <span className="font-ticker text-xs text-text-primary truncate block max-w-[140px]">
                  {artwork.artistId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/3 border border-white/6 flex items-center justify-center text-text-muted">
                <Calendar size={14} />
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-text-muted">Registry Date</span>
                <span className="font-ticker text-xs text-text-primary">
                  {new Date(artwork.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Description Block */}
          <div className="mb-10">
            <h3 className="font-interface text-xs uppercase tracking-widest text-text-muted mb-3">
              Curator&apos;s Exhibition Notes
            </h3>
            <p className="font-editorial text-lg text-text-primary/90 leading-relaxed font-light whitespace-pre-line">
              {artwork.description || "No descriptions or physical dimension attributes have been logged for this canvas container asset."}
            </p>
          </div>

          {/* Contextual CTA Routing Block */}
          <div className="pt-4 border-t border-white/4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 bg-white hover:bg-gold-accent text-bg-main font-interface text-xs uppercase tracking-widest py-3.5 px-6 rounded-lg font-medium transition-all duration-300 shadow-xl cursor-pointer"
            >
              <Eye size={14} /> Scan Active Auction Rooms
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}