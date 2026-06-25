import { Request, Response } from 'express';
import { db } from './db.js';
import { platformMetrics } from './schema.js';
import { ApiResponse } from '@platform/shared-types';

/**
 * Returns instantaneous platform metric views with sub-millisecond execution overhead
 */
export const getDashboardSummary = (logger: any) => async (_req: Request, res: Response) => {
  try {
    const [summary] = await db.select().from(platformMetrics).limit(1);

    const successRes: ApiResponse = {
      success: true,
      message: 'Dashboard stats compiled successfully',
      data: summary || { totalAuctions: 0, totalBids: 0, totalVolumeCents: 0 },
      timestamp: new Date().toISOString(),
    };
    return res.status(200).json(successRes);
  } catch (err) {
    logger.error('Failed to parse dashboard metric summary response:', err);
    const errorRes: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR' },
      timestamp: new Date().toISOString(),
    };
    return res.status(500).json(errorRes);
  }
};
