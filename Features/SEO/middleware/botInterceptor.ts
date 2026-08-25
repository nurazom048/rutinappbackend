import { Request, Response, NextFunction } from 'express';
import prisma from '../../../prisma/schema/prisma.clint';
import {
  generateWebSiteSchema,
  generatePersonSchema,
  generateEducationalOrganizationSchema,
  generateArticleSchema,
  extractTextFromDescription,
  getFrontendDomain,
} from '../services/jsonLdGenerator';

// RegEx to identify search engine bots and social media crawlers
const BOT_USER_AGENTS = /googlebot|bingbot|yandexbot|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkShare|W3C_Validator|whatsapp|discordbot/i;

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderHtmlShell(params: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: string;
  jsonLd: object;
  bodyContent?: string;
  domain: string;
}): string {
  const { title, description, url, image, type = 'website', jsonLd, bodyContent = '', domain } = params;
  const safeImage = image
    ? (image.startsWith('http') ? image : `${domain}/${image}`)
    : `${domain}/assets/default-og.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${url}" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:site_name" content="Classmaster" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body>
  <div id="seo-prerender">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    ${bodyContent}
  </div>
</body>
</html>`;
}

/**
 * Express Middleware: Intercept search crawlers and return dynamic HTML shells with SEO Meta Tags & JSON-LD
 */
export const botInterceptor = async (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';

  // If not a crawler, continue normal user execution
  if (!BOT_USER_AGENTS.test(userAgent)) {
    return next();
  }

  const DOMAIN = getFrontendDomain();
  const urlPath = req.path;

  try {
    // 1. User Profile Route (/profile/:username)
    const profileMatch = urlPath.match(/^\/profile\/([^\/]+)/);
    if (profileMatch) {
      const username = decodeURIComponent(profileMatch[1]);
      const user = await prisma.account.findUnique({
        where: { username },
        include: { address: true },
      });

      if (user) {
        const title = `${user.name} (@${user.username}) | Classmaster`;
        const userAboutText = extractTextFromDescription(user.about);
        const description = userAboutText || `View ${user.name}'s profile, class routines, and educational updates on Classmaster.`;
        const profileUrl = `${DOMAIN}/profile/${encodeURIComponent(user.username)}`;
        const jsonLd = generatePersonSchema(user);

        const html = renderHtmlShell({
          title,
          description,
          url: profileUrl,
          image: user.image || undefined,
          type: 'profile',
          jsonLd,
          bodyContent: `<section>
  <h2>About ${escapeHtml(user.name)}</h2>
  <p>${escapeHtml(description)}</p>
</section>`,
          domain: DOMAIN,
        });

        return res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(html);
      }
    }

    // 2. Educational Organization / Institution Route (/institution/:name)
    const instMatch = urlPath.match(/^\/institution\/([^\/]+)/);
    if (instMatch) {
      const nameOrUsername = decodeURIComponent(instMatch[1]);
      const institution = await prisma.account.findFirst({
        where: {
          OR: [
            { username: nameOrUsername },
            { name: { equals: nameOrUsername, mode: 'insensitive' } },
          ],
          accountType: 'academy',
        },
        include: { address: true },
      });

      if (institution) {
        const title = `${institution.name} | Classmaster`;
        const instAboutText = extractTextFromDescription(institution.about);
        const description = instAboutText || `${institution.name} official academy page on Classmaster. Explore class routines, notices, and academic updates.`;
        const instUrl = `${DOMAIN}/institution/${encodeURIComponent(institution.username || institution.name)}`;
        const jsonLd = generateEducationalOrganizationSchema(institution);

        const html = renderHtmlShell({
          title,
          description,
          url: instUrl,
          image: institution.image || institution.coverImage || undefined,
          type: 'website',
          jsonLd,
          bodyContent: `<section>
  <h2>${escapeHtml(institution.name)}</h2>
  <p>${escapeHtml(description)}</p>
</section>`,
          domain: DOMAIN,
        });

        return res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(html);
      }
    }

    // 3. Notice Route (/notice/:id)
    const noticeMatch = urlPath.match(/^\/notice\/([^\/]+)/);
    if (noticeMatch) {
      const noticeId = noticeMatch[1];
      const notice = await prisma.notice.findUnique({
        where: { id: noticeId },
        include: { Account: true },
      });

      if (notice) {
        const plainDesc = extractTextFromDescription(notice.description);
        const title = `${notice.title} | Classmaster Notice`;
        const description = plainDesc || notice.title;
        const noticeUrl = `${DOMAIN}/notice/${notice.id}`;
        const jsonLd = generateArticleSchema(notice);

        const html = renderHtmlShell({
          title,
          description,
          url: noticeUrl,
          image: notice.Account?.image || undefined,
          type: 'article',
          jsonLd,
          bodyContent: `<article>
  <h1>${escapeHtml(notice.title)}</h1>
  <p>${escapeHtml(description)}</p>
  ${notice.Account?.name ? `<p>Published by: ${escapeHtml(notice.Account.name)}</p>` : ''}
</article>`,
          domain: DOMAIN,
        });

        return res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(html);
      }
    }

    // 4. Root / Homepage
    if (urlPath === '/' || urlPath === '/home') {
      const title = 'Classmaster - Educational Platform & Routine Management';
      const description = 'Classmaster is an all-in-one educational platform connecting students, teachers, and institutions with dynamic class routines, notices, and academic tools.';
      const jsonLd = generateWebSiteSchema();

      const html = renderHtmlShell({
        title,
        description,
        url: DOMAIN,
        type: 'website',
        jsonLd,
        bodyContent: `<main>
  <h2>Welcome to Classmaster</h2>
  <p>${escapeHtml(description)}</p>
  <nav>
    <ul>
      <li><a href="${DOMAIN}/about">About Classmaster</a></li>
      <li><a href="${DOMAIN}/search">Notices & Announcements</a></li>
      <li><a href="${DOMAIN}/profile">User & Institution Profiles</a></li>
      <li><a href="${DOMAIN}/contact">Contact & Support</a></li>
    </ul>
  </nav>
</main>`,
        domain: DOMAIN,
      });

      return res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(html);
    }

    // Default fallback to next route handler for standard requests
    return next();
  } catch (error) {
    console.error('Error in Bot Interceptor Middleware:', error);
    return next();
  }
};
