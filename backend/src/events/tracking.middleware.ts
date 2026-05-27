import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { EventsStore } from './events.store';

@Injectable()
export class TrackingMiddleware implements NestMiddleware {
  constructor(private readonly store: EventsStore) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    res.on('finish', () => {
      // Skip self-tracking to avoid feedback loop on any /events route variant.
      const url = req.originalUrl ?? req.path ?? '';
      if (url.endsWith('/events') || url.includes('/events?')) return;
      this.store.push({
        ts: start,
        type: 'http.request',
        durationMs: Date.now() - start,
        payload: { method: req.method, path: req.path, status: res.statusCode },
      });
    });
    next();
  }
}
