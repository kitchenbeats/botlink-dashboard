import { MetadataRoute } from 'next'
import { XMLParser } from 'fast-xml-parser'
import { LANDING_PAGE_DOMAIN, replaceUrls } from '@/configs/domains'
import { BLOG_FRAMER_DOMAIN } from '@/configs/domains'
import { BASE_URL } from '@/configs/urls'

// Cache the sitemap for 24 hours (in seconds)
const SITEMAP_CACHE_TIME = 24 * 60 * 60

type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

type Site = {
  sitemapUrl: string
  lastModified?: string | Date
  changeFrequency?: ChangeFrequency
  priority?: number
  baseUrl?: string
}

const sites: Site[] = [
  {
    sitemapUrl: `https://${LANDING_PAGE_DOMAIN}/sitemap.xml`,
    priority: 1.0,
    changeFrequency: 'daily',
    baseUrl: BASE_URL,
  },
  {
    sitemapUrl: `https://${BLOG_FRAMER_DOMAIN}/sitemap.xml`,
    priority: 0.9,
    changeFrequency: 'daily',
    baseUrl: BASE_URL,
  },
]

type SitemapData = {
  loc: string
  lastmod?: string | Date
  changefreq?: ChangeFrequency
  priority?: number
}

type Sitemap = {
  urlset: {
    url: SitemapData | SitemapData[]
  }
}

async function getXmlData(url: string): Promise<Sitemap> {
  const parser = new XMLParser()

  try {
    const response = await fetch(url, {
      next: { revalidate: SITEMAP_CACHE_TIME },
      headers: {
        Accept: 'application/xml',
      },
    })

    if (!response.ok) {
      console.warn(`Failed to fetch sitemap from ${url}:`, response.statusText)
      return { urlset: { url: [] } }
    }

    const text = await response.text()
    return parser.parse(text) as Sitemap
  } catch (error) {
    console.error(`Error fetching sitemap from ${url}:`, error)
    return { urlset: { url: [] } }
  }
}

async function getSitemap(site: Site): Promise<MetadataRoute.Sitemap> {
  const data = await getXmlData(site.sitemapUrl)

  if (!data) {
    return []
  }

  const processUrl = (line: SitemapData) => {
    const url = new URL(line.loc)
    const properUrl = `${site.baseUrl}${url.pathname}`
    return {
      url: replaceUrls(properUrl, url.pathname),
      priority: line?.priority || site.priority,
      changeFrequency: line?.changefreq || site.changeFrequency,
      lastModified: line?.lastmod || site.lastModified,
    }
  }

  if (Array.isArray(data.urlset.url)) {
    return data.urlset.url.map(processUrl)
  } else {
    return [processUrl(data.urlset.url)]
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let mergedSitemap: MetadataRoute.Sitemap = []

  // Fetch sitemaps from all configured sites (Webflow & Framer sites + docs)
  for (const site of sites) {
    const urls = await getSitemap(site)
    mergedSitemap = mergedSitemap.concat(urls)
  }

  // Sort all URLs alphabetically
  return mergedSitemap.sort((a, b) => a.url.localeCompare(b.url))
}
