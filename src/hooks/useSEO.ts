import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
}

export const useSEO = ({ title, description, keywords, ogImage }: SEOProps) => {
  useEffect(() => {
    // 1. Update Title
    const baseTitle = 'SeVee Designs';
    const formattedTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} | Premium Hardwood Furniture Accra`;
    document.title = formattedTitle;

    // Helper function to update or create a meta tag
    const updateMetaTag = (attribute: string, attrValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // 2. Update Primary Meta Tags
    updateMetaTag('name', 'title', formattedTitle);
    updateMetaTag('name', 'description', description);
    
    if (keywords) {
      updateMetaTag('name', 'keywords', keywords);
    }

    // 3. Update Open Graph Meta Tags
    updateMetaTag('property', 'og:title', formattedTitle);
    updateMetaTag('property', 'og:description', description);
    if (ogImage) {
      updateMetaTag('property', 'og:image', ogImage);
    }

    // 4. Update Twitter Card Meta Tags
    updateMetaTag('property', 'twitter:title', formattedTitle);
    updateMetaTag('property', 'twitter:description', description);
    if (ogImage) {
      updateMetaTag('property', 'twitter:image', ogImage);
    }
  }, [title, description, keywords, ogImage]);
};

export default useSEO;
