export const getFrontendDomain = (): string => {
  const env = (globalThis as any).process?.env || {};
  const domain = env.FRONTEND_URL || env.SITE_DOMAIN || 'https://classmaster.top';
  return domain.replace(/\/+$/, '');
};

/**
 * 1. WebSite & Sitelinks Schema Generator (Enables Google Sitelinks Search Box and Direct Navigation Sitelinks)
 */
export function generateWebSiteSchema() {
  const DOMAIN = getFrontendDomain();
  
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Classmaster",
      "alternateName": ["Classmaster Top", "Classmaster Educational Platform"],
      "url": DOMAIN,
      "description": "Classmaster is an all-in-one educational platform connecting students, teachers, and institutions with dynamic class routines, notices, and academic tools.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${DOMAIN}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Classmaster Navigation Sitelinks",
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "About Classmaster",
          "description": "Learn more about Classmaster educational platform and services.",
          "url": `${DOMAIN}/about`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "Notices & Announcements",
          "description": "View official notices, exam routines, and academic updates.",
          "url": `${DOMAIN}/search`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "User & Academy Profiles",
          "description": "Explore institutions, teachers, and student profiles on Classmaster.",
          "url": `${DOMAIN}/profile`
        },
        {
          "@type": "SiteNavigationElement",
          "position": 4,
          "name": "Contact & Support",
          "description": "Get in touch with Classmaster support and institution admins.",
          "url": `${DOMAIN}/contact`
        }
      ]
    }
  ];
}

/**
 * 2. Person Schema Generator (User Profiles)
 */
export function generatePersonSchema(user: any) {
  const DOMAIN = getFrontendDomain();
  const profileUrl = `${DOMAIN}/profile/${encodeURIComponent(user.username)}`;
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": user.name,
    "alternateName": `@${user.username}`,
    "identifier": user.username,
    "url": profileUrl,
    "description": extractTextFromDescription(user.about) || `Profile of ${user.name} (@${user.username}) on Classmaster.`
  };

  if (user.image) {
    schema.image = user.image.startsWith("http") ? user.image : `${DOMAIN}/${user.image}`;
  }

  if (user.address) {
    const { streetAddress, upazila, district } = user.address;
    schema.address = {
      "@type": "PostalAddress",
      ...(streetAddress && { streetAddress }),
      ...(upazila && { addressLocality: upazila }),
      ...(district && { addressRegion: district }),
      "addressCountry": "BD"
    };
  }

  return schema;
}

/**
 * 3. EducationalOrganization Schema Generator (Institutions/Coaching Centers)
 */
export function generateEducationalOrganizationSchema(institution: any) {
  const DOMAIN = getFrontendDomain();
  const instUrl = `${DOMAIN}/institution/${encodeURIComponent(institution.username || institution.name)}`;
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": institution.name,
    "url": instUrl,
    "description": extractTextFromDescription(institution.about) || `${institution.name} - Educational organization on Classmaster.`
  };

  if (institution.image) {
    schema.logo = institution.image.startsWith("http") ? institution.image : `${DOMAIN}/${institution.image}`;
    schema.image = schema.logo;
  }
  if (institution.coverImage) {
    schema.image = institution.coverImage.startsWith("http") ? institution.coverImage : `${DOMAIN}/${institution.coverImage}`;
  }

  if (institution.address) {
    const { streetAddress, upazila, district, latitude, longitude } = institution.address;
    schema.address = {
      "@type": "PostalAddress",
      ...(streetAddress && { streetAddress }),
      ...(upazila && { addressLocality: upazila }),
      ...(district && { addressRegion: district }),
      "addressCountry": "BD"
    };

    if (latitude && longitude) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": latitude,
        "longitude": longitude
      };
    }
  }

  return schema;
}

export function extractTextFromDescription(desc: any): string {
  if (!desc) return '';
  if (typeof desc === 'string') {
    try {
      const parsed = JSON.parse(desc);
      return extractTextFromDescription(parsed);
    } catch {
      return desc;
    }
  }
  if (Array.isArray(desc)) {
    return desc.map((op: any) => (typeof op?.insert === 'string' ? op.insert : '')).join('').trim();
  }
  if (typeof desc === 'object') {
    return JSON.stringify(desc);
  }
  return String(desc);
}

/**
 * 4. Article / Announcement Schema Generator (Notices)
 */
export function generateArticleSchema(notice: any) {
  const DOMAIN = getFrontendDomain();
  const LOGO_URL = `${DOMAIN}/assets/logo.png`;
  const noticeUrl = `${DOMAIN}/notice/${notice.id}`;
  const publisherName = notice.Account?.name || "Classmaster";

  const plainDesc = extractTextFromDescription(notice.description);

  return {
    "@context": "https://schema.org",
    "@type": notice.category === "notice" ? "Announcement" : "Article",
    "headline": notice.title,
    "description": plainDesc || notice.title,
    "url": noticeUrl,
    "datePublished": notice.createdAt ? new Date(notice.createdAt).toISOString() : undefined,
    "dateModified": notice.updatedAt ? new Date(notice.updatedAt).toISOString() : undefined,
    "author": notice.Account ? (
      notice.Account.accountType === "academy"
        ? generateEducationalOrganizationSchema(notice.Account)
        : generatePersonSchema(notice.Account)
    ) : {
      "@type": "Organization",
      "name": publisherName
    },
    "publisher": {
      "@type": "Organization",
      "name": "Classmaster",
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": noticeUrl
    }
  };
}
