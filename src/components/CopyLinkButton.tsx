import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface CopyLinkButtonProps {
  getUrl: () => string;
  className?: string;
  compactOnMobile?: boolean;
}

export const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({
  getUrl,
  className = '',
  compactOnMobile = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const url = getUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Clipboard write failed, fallbacking:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy shareable link to this analysis"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border whitespace-nowrap shrink-0 ${
        copied
          ? 'bg-[#EAE5DA] border-[#1A1A1A] text-[#1A1A1A]'
          : 'bg-[#FAF8F4] hover:bg-[#F2EEE6] border-[#D8D3C8] text-[#1A1A1A]'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-[#1A1A1A]" aria-hidden="true" />
          <span>{compactOnMobile ? 'Copied' : 'Link copied'}</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5 text-[#52504A]" aria-hidden="true" />
          <span className={compactOnMobile ? 'hidden sm:inline' : ''}>Share link</span>
        </>
      )}
    </button>
  );
};
