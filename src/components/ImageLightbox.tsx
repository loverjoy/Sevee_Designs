import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveImageUrl } from '../lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  altText?: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  altText = 'Product image',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
      if (e.key === 'ArrowRight') setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    },
    [isOpen, onClose, images.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) {
      setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    } else if (diff < -threshold) {
      setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
    }
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  };

  if (!isOpen || images.length === 0) return null;

  const hasMultiple = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white transition-colors z-50 p-2"
        aria-label="Close lightbox"
      >
        <X size={28} />
      </button>

      {/* Image counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 sm:top-6 text-white/60 text-xs font-sans tracking-wider uppercase z-50">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Previous arrow */}
      {hasMultiple && (
        <button
          onClick={goToPrev}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50 p-2 sm:p-3"
          aria-label="Previous image"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Next arrow */}
      {hasMultiple && (
        <button
          onClick={goToNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50 p-2 sm:p-3"
          aria-label="Next image"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Image */}
      <img
        src={resolveImageUrl(images[currentIndex])}
        alt={`${altText} ${currentIndex + 1}`}
        className="max-w-[95vw] max-h-[85vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
};

export default ImageLightbox;
