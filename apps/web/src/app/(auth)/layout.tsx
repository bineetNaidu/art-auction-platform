import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-bg-main flex items-center justify-center px-4 overflow-hidden">
      {/* Premium Cinematic Ambient Lighting Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-white/2 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Architectural Background Grid Texture */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#121214_1px,transparent_1px),linear-gradient(to_bottom,#121214_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" 
      />

      {/* Main Form Container */}
      <div className="relative w-full max-w-md z-10 my-8">
        {children}
      </div>
    </div>
  );
}