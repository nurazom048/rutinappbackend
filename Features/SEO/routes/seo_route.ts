import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { generateSitemap } from '../controllers/sitemap.controller';
import { getFrontendDomain } from '../services/jsonLdGenerator';

const router = express.Router();

// SEO-specific CORS Middleware: Always allow GET requests from any origin for SEO routes
const seoCorsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'User-Agent', 'Accept'],
});

// Middleware to bypass custom bot restrictions and set open headers for SEO crawlers
const allowSeoCrawlers = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};

// Dynamic Sitemap Route with CORS & bot access policy
router.options('/sitemap.xml', seoCorsMiddleware);
router.get('/sitemap.xml', seoCorsMiddleware, allowSeoCrawlers, generateSitemap);

// Robots.txt Route with CORS & bot access policy
router.options('/robots.txt', seoCorsMiddleware);
router.get('/robots.txt', seoCorsMiddleware, allowSeoCrawlers, (req: Request, res: Response) => {
  const domain = getFrontendDomain();
  const robots = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
  res.set('Content-Type', 'text/plain');
  res.status(200).send(robots.trimStart());
});

export default router;
