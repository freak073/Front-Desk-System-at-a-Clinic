'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  getOptimizedImageUrl, 
  getResponsiveImageSize, 
  generateSrcSet, 
  generateSizesAttribute,
  IMAGE_CONFIG 
} from '../../lib/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'blur' | 'empty';
  sizes?: string;
}

/**
 * Optimized image component that uses Next.js Image with additional optimizations
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = IMAGE_CONFIG.DEFAULT_QUALITY,
  objectFit = 'cover',
  placeholder = 'empty',
  sizes,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || IMAGE_CONFIG.PLACEHOLDER);
  const [imgWidth, setImgWidth] = useState<number>(width || 0);
  const [imgHeight, setImgHeight] = useState<number>(height || 0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Handle image load error
  const handleError = () => {
    setError(true);
    setImgSrc(IMAGE_CONFIG.PLACEHOLDER);
    setIsLoading(false);
  };

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Update image dimensions based on viewport size
  useEffect(() => {
    const updateDimensions = () => {
      if (!width) {
        const responsiveWidth = getResponsiveImageSize();
        setImgWidth(responsiveWidth);
        
        // If height is not provided, maintain aspect ratio (assuming 16:9)
        if (!height) {
          setImgHeight(Math.floor(responsiveWidth * 9 / 16));
        }
      }
    };

    // Set initial dimensions
    updateDimensions();

    // Update dimensions on window resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  return (
    <div className={`relative ${className}`} style={{ width: imgWidth || 'auto', height: imgHeight || 'auto' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse rounded-md bg-gray-200 w-full h-full"></div>
        </div>
      )}
      
      <Image
        src={imgSrc}
        alt={alt}
        width={imgWidth || undefined}
        height={imgHeight || undefined}
        quality={quality}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ objectFit }}
        sizes={sizes || generateSizesAttribute()}
        placeholder={placeholder}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-sm text-gray-500">Image not available</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;