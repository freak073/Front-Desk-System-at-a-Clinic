/**
 * Utility functions for image optimization
 */

/**
 * Configuration for image optimization
 */
export const IMAGE_CONFIG = {
  // Default image quality (1-100)
  DEFAULT_QUALITY: 80,
  // Default image width for thumbnails
  THUMBNAIL_WIDTH: 100,
  // Default image width for profile pictures
  PROFILE_WIDTH: 200,
  // Default image width for banners
  BANNER_WIDTH: 1200,
  // Supported image formats in order of preference
  FORMATS: ['webp', 'avif', 'jpg', 'png'],
  // Default placeholder image
  PLACEHOLDER: '/images/placeholder.svg',
};

/**
 * Generate optimized image URL with Next.js Image Optimization API
 * @param src - Original image URL
 * @param width - Desired width
 * @param quality - Image quality (1-100)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(src: string, width: number = 0, quality: number = IMAGE_CONFIG.DEFAULT_QUALITY): string {
  // If src is already an optimized URL or SVG, return as is
  if (src.includes('_next/image') || src.endsWith('.svg')) {
    return src;
  }
  
  // If src is a remote URL (not from our domain), return as is
  if (src.startsWith('http') && !src.includes(window.location.hostname)) {
    return src;
  }
  
  // For local images, use Next.js Image Optimization API
  const baseUrl = '/_next/image';
  const params = new URLSearchParams();
  
  // Add image URL
  params.append('url', encodeURIComponent(src));
  
  // Add width if specified
  if (width > 0) {
    params.append('w', width.toString());
  }
  
  // Add quality
  params.append('q', quality.toString());
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Get appropriate image size based on device viewport
 * @param defaultSize - Default image size
 * @returns Appropriate image size for current viewport
 */
export function getResponsiveImageSize(defaultSize: number = IMAGE_CONFIG.PROFILE_WIDTH): number {
  // Use window object safely (only in browser)
  if (typeof window === 'undefined') {
    return defaultSize;
  }
  
  const width = window.innerWidth;
  
  // Scale image size based on viewport width
  if (width < 640) { // Mobile
    return Math.min(defaultSize, Math.floor(width * 0.8));
  } else if (width < 1024) { // Tablet
    return Math.min(defaultSize, Math.floor(width * 0.5));
  } else { // Desktop
    return defaultSize;
  }
}

/**
 * Generate a set of srcSet URLs for responsive images
 * @param src - Original image URL
 * @param sizes - Array of image widths
 * @param quality - Image quality (1-100)
 * @returns srcSet string for use in img tag
 */
export function generateSrcSet(
  src: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1536],
  quality: number = IMAGE_CONFIG.DEFAULT_QUALITY
): string {
  return sizes
    .map(size => `${getOptimizedImageUrl(src, size, quality)} ${size}w`)
    .join(', ');
}

/**
 * Generate appropriate sizes attribute for responsive images
 * @returns sizes attribute string for use in img tag
 */
export function generateSizesAttribute(): string {
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
}

/**
 * Check if the browser supports a specific image format
 * @param format - Image format to check (webp, avif, etc.)
 * @returns Promise resolving to boolean indicating support
 */
export async function supportsImageFormat(format: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = `data:image/${format};base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=`;
  });
}

/**
 * Get the best supported image format for the current browser
 * @returns Promise resolving to the best supported format
 */
export async function getBestSupportedFormat(): Promise<string> {
  for (const format of IMAGE_CONFIG.FORMATS) {
    if (await supportsImageFormat(format)) {
      return format;
    }
  }
  
  // Fallback to jpg if no modern formats are supported
  return 'jpg';
}