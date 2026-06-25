export enum PlatformEventName {
  USER_CREATED = 'user.created',
  ARTWORK_CREATED = 'artwork.created',
  AUCTION_CREATED = 'auction.created',
  AUCTION_STARTED = 'auction.started',
  AUCTION_ENDED = 'auction.ended',
  BID_PLACED = 'bid.placed',
  BID_OUTBID = 'bid.outbid',
}

export interface EventPayloadMap {
  [PlatformEventName.USER_CREATED]: { userId: string; email: string; role: string };
  [PlatformEventName.ARTWORK_CREATED]: { artworkId: string; title: string; artistId: string };
  [PlatformEventName.AUCTION_CREATED]: { auctionId: string; artworkId: string; startPrice: number };
  [PlatformEventName.AUCTION_STARTED]: { auctionId: string; endTime: string };
  [PlatformEventName.AUCTION_ENDED]: {
    auctionId: string;
    winningBidId?: string;
    winnerId?: string;
    finalPrice: number;
  };
  [PlatformEventName.BID_PLACED]: {
    bidId: string;
    auctionId: string;
    bidderId: string;
    amount: number;
  };
  [PlatformEventName.BID_OUTBID]: {
    auctionId: string;
    outbidBidderId: string;
    newHighestPrice: number;
  };
}

export interface CloudEvent<T extends PlatformEventName> {
  event: T;
  traceId: string;
  timestamp: string;
  data: EventPayloadMap[T];
}
