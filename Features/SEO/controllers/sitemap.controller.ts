import prisma from '../../../prisma/schema/prisma.clint';

const getFrontendDomain = (): string => {
  const env = (globalThis as any).process?.env || {};
  const domain = env.FRONTEND_URL || env.SITE_DOMAIN || 'https://classmaster.top';
  return domain.replace(/\/+$/, '');
};

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date?: Date | null): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Controller to generate dynamic XML sitemap conforming to sitemaps.org spec
 */
export const generateSitemap = async (req: any, res: any) => {
  try {
    const DOMAIN = getFrontendDomain();

    // 1. Static Pages
    const staticUrls = [
      { url: `${DOMAIN}/`, priority: '1.0', changefreq: 'daily' },
      { url: `${DOMAIN}/about`, priority: '0.8', changefreq: 'monthly' },
      { url: `${DOMAIN}/contact`, priority: '0.6', changefreq: 'monthly' },
      { url: `${DOMAIN}/search`, priority: '0.8', changefreq: 'daily' },
    ];

    // 2. Top 100 User Profiles
    const userProfiles = await prisma.account.findMany({
      where: {
        accountType: { in: ['user', 'student'] },
      },
      select: {
        username: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 100,
    });

    // 3. All Institution Profiles
    const institutions = await prisma.account.findMany({
      where: {
        accountType: 'academy',
      },
      select: {
        username: true,
        name: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // 4. All Recent Notices (up to 1000)
    const notices = await prisma.notice.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 1000,
    });

    // XML Construction - Ensure NO leading whitespace or blank lines before <?xml
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static URLs
    for (const item of staticUrls) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(item.url)}</loc>\n`;
      xml += `    <lastmod>${formatDate(new Date())}</lastmod>\n`;
      xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
      xml += `    <priority>${item.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add User Profile URLs
    for (const user of userProfiles) {
      if (user.username) {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(`${DOMAIN}/profile/${encodeURIComponent(user.username)}`)}</loc>\n`;
        xml += `    <lastmod>${formatDate(user.updatedAt)}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // Add Institution URLs
    for (const inst of institutions) {
      const slug = inst.username || inst.name;
      if (slug) {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(`${DOMAIN}/institution/${encodeURIComponent(slug)}`)}</loc>\n`;
        xml += `    <lastmod>${formatDate(inst.updatedAt)}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // Add Notice URLs
    for (const notice of notices) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(`${DOMAIN}/notice/${notice.id}`)}</loc>\n`;
      xml += `    <lastmod>${formatDate(notice.updatedAt)}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    // Set headers strictly as requested
    res.set('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=14400');
    return res.status(200).send(xml.slice(xml.indexOf('<?xml')));
  } catch (error: any) {
    console.error('Error generating sitemap.xml:', error);
    return res.status(500).json({ message: 'Failed to generate sitemap', error: error.message });
  }
};
