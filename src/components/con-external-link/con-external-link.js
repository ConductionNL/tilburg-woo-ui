import { AcLink } from '@src/molecules';

/**
 * ConExternalLink - A wrapper around AcLink for external URLs
 *
 * Automatically handles URL normalization:
 * - Adds https:// prefix if the URL doesn't have a protocol
 * - Opens in a new tab with proper security attributes
 *
 * @param {string} href - The URL to link to
 * @param {React.ReactNode} children - Link content (defaults to displaying the href)
 * @param {object} restProps - Additional props passed to AcLink
 *
 * @example
 * // Basic usage - displays URL as link text
 * <ConExternalLink href="example.com" />
 *
 * // With full URL
 * <ConExternalLink href="https://example.com">Visit Example</ConExternalLink>
 */
const ConExternalLink = ({ href, children, ...restProps }) => {
  if (!href) {
    return <span>{children || '-'}</span>;
  }

  const normalizedUrl = href.startsWith('http') ? href : `https://${href}`;

  return (
    <AcLink
      href={normalizedUrl}
      target='_blank'
      rel='noopener noreferrer'
      {...restProps}
    >
      {children || href}
    </AcLink>
  );
};

export default ConExternalLink;
