import React, { useMemo } from 'react';
import type { ElementType } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  /** The raw HTML string to sanitize and render */
  html: string;
  /** Optional class name for the wrapper element */
  className?: string;
  /** Optional wrapper element type, defaults to 'div' */
  as?: ElementType;
}

/**
 * A component that safely renders HTML by sanitizing it first using DOMPurify.
 * This prevents Cross-Site Scripting (XSS) attacks.
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className = '', as: Component = 'div' }) => {
  // Sanitize the HTML string. useMemo ensures we only re-sanitize if the input changes.
  const sanitizedHtml = useMemo(() => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      // Configuration options can be added here if needed (e.g., ALLOWED_TAGS)
      USE_PROFILES: { html: true },
    });
  }, [html]);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SafeHtml;
