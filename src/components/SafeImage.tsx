import React from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  fallbackSrc?: string;
}

// Image wrapper with lazy loading, async decoding and a graceful
// fallback when the remote source is missing or returns a 404.
const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc = '/logo.jpg',
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) => {
  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const { onError } = rest as { onError?: React.ReactEventHandler<HTMLImageElement> };
    if (onError) onError(event);

    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === 'true') return;
    img.dataset.fallbackApplied = 'true';
    img.src = fallbackSrc;
  };

  return (
    <img
      src={src || fallbackSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      {...rest}
      onError={handleError}
    />
  );
};

export default SafeImage;
