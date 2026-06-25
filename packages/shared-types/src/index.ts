export interface User {
  id: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  createdAt: Date;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  artistId: string;
  imageUrl: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface Auction {
  id: string;
  artworkId: string;
  sellerId: string;
  startPrice: number;
  currentHighestBid: number;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'active' | 'ended' | 'cancelled';
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
}
