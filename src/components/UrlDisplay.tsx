import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface UrlDisplayProps {
  url: string;
  title: string;
  showCopy?: boolean;
  showOpen?: boolean;
  className?: string;
}

export const UrlDisplay: React.FC<UrlDisplayProps> = ({
  url,
  title,
  showCopy = true,
  showOpen = true,
  className = ''
}) => {
  const handleCopyUrl = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('URL copied to clipboard!');
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            toast.success('URL copied to clipboard!');
          } else {
            throw new Error('execCommand failed');
          }
        } catch (err) {
          console.error('Fallback copy failed:', err);
          toast.error('Failed to copy URL. Please copy manually.');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast.error('Failed to copy URL. Please copy manually.');
    }
  };

  const handleOpenUrl = () => {
    window.open(url, '_blank');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">{title}:</div>
        <div className="text-sm font-mono bg-muted p-2 rounded-md break-all">
          {url}
        </div>
      </div>
      
      {showCopy && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyUrl}
          className="h-8 px-2"
          title="Copy URL for Webflow"
        >
          <Copy className="w-4 h-4" />
        </Button>
      )}
      
      {showOpen && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleOpenUrl}
          className="h-8 px-2"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export const UrlBadge: React.FC<{ url: string }> = ({ url }) => {
  const isCloudinary = url.includes('cloudinary.com');
  const isWebflow = url.includes('webflow.com');
  
  const getBadgeStyle = () => {
    if (isCloudinary) return 'bg-blue-100 text-blue-800';
    if (isWebflow) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle()}`}>
      {isCloudinary ? 'Cloudinary' : isWebflow ? 'Webflow' : 'External'}
    </span>
  );
};