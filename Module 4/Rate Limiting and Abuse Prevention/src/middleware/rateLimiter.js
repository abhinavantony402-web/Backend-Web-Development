'use strict';
// middleware/rateLimiter.js
//
// Strict limiter for the auth routes (login / register / refresh).
// Auth endpoints are the classic brute-force target, so they get the tightest
// budget: 5 attempts per 15-minute window per IP, and only FAILED attempts
// count toward the limit (skipSuccessfulRequests) so a legitimate user who
// logs in successfully is never penalized.

const rateLimit = require('express-rate-limit');

/*
 * REDIS-BACKED STORE (multi-instance deployments)
 *
 * By default express-rate-limit keeps its counters in the Node process's
 * memory (MemoryStore). That works for a single instance, but it breaks
 * behind a load balancer running N instances: each instance maintains its
 * OWN independent counter, so a client whose requests are spread across all
 * N instances effectively gets N x the limit (5 per instance = 5N total),
 * defeating the protection entirely. Counters are also lost on every restart
 * or deploy, resetting the throttle window.
 *
 * In production, swap the store for a shared one, e.g. rate-limit-redis,
 * so every instance reads/writes the SAME counters in Redis:
 *
 *   const RedisStore = require('rate-limit-redis');
 *   const Redis = require('ioredis');
 *
 *   module.exports = rateLimit({
 *     windowMs: 15 * 60 * 1000,
 *     max: 5,
 *     store: new RedisStore({
 *       sendCommand: (...args) => redisClient.call(...args),
 *     }),
 *     ...
 *   });
 *
 * With a shared Redis store every instance enforces the same 5-per-window
 * budget regardless of which pod serves the request.
 */

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 attempts per window per IP
  standardHeaders: true,    // RateLimit-* headers (draft-6)
  legacyHeaders: false,     // no X-RateLimit-* headers
  skipSuccessfulRequests: true, // only failed attempts count
  handler: (req, res) => {
    // RateLimitHeaders expose resetTime; compute Retry-After from it.
    const reset = req.rateLimit && req.rateLimit.resetTime
      ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
      : 15 * 60;
    res.set('Retry-After', String(Math.max(reset, 1)));
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many attempts. Please try again later.',
    });
  },
});
