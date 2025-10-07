
import { openCloudinaryWidget, UploadedAsset } from '@/lib/cloudinaryWidget';

/**
 * Persist the uploaded asset by sending it to your backend via Netlify Functions.
 * Adjust this implementation to fit your existing Xano/Webflow sync pipeline.
 */
async function saveAsset(asset: UploadedAsset): Promise<void> {
  const res = await fetch('/.netlify/functions/save-asset', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(asset)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Save failed: ${errText}`);
  }

  // Reload the page after a successful save to refresh the file list.
  // Without a refresh, newly uploaded assets may not appear until the next load.
  // You can replace this with a more targeted state update if you have a file list context.
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

export default function UploadButton() {
  const handleUpload = () => {
    openCloudinaryWidget(async (asset) => {
      console.log('[UploadButton] Uploaded asset', asset);
      try {
        await saveAsset(asset);
      } catch (error) {
        console.error('Error saving asset:', error);
        alert(String(error));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleUpload}
      aria-label="Upload files"
      style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #111827', background: '#111827', color: '#fff' }}
    >
      Upload files
    </button>
  );
}
