export type UploadedAsset = {
  name: string;
  title: string;
  type: 'image' | 'video' | 'raw';
  url: string;
  thumbnail: string;
  size: number;
  duration?: number | '';
  width?: number;
  height?: number;
  publicId: string;
  format?: string;
  cloudinaryData: any;
};

declare global {
  interface Window {
    cloudinary?: any;
  }
}

// Pull Cloudinary config from build env vars when available
const CLOUD_NAME: string = (typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME) || 'dzrw8nopf';
const UPLOAD_PRESET: string = (typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET) || 'HIBF_MASTER';
const WIDGET_SRC = 'https://upload-widget.cloudinary.com/latest/global/all.js';

/**
 * Dynamically load the Cloudinary widget script exactly once.
 */
function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cloudinary widget script'));
    document.head.appendChild(script);
  });
}

/**
 * Derive a small thumbnail URL from the Cloudinary upload info.
 */
function thumbFrom(info: any): string {
  const url = info?.secure_url || '';
  if (!url) return '';
  if (info.resource_type === 'image') {
    return url.replace('/upload/', '/upload/w_300,h_300,c_fill,q_auto,f_auto/');
  }
  if (info.resource_type === 'video') {
    return url.replace('/upload/', '/upload/so_0,w_300,h_300,c_fill,q_auto,f_jpg/').replace(/\.[^.]+$/, '.jpg');
  }
  return '';
}

/**
 * Normalize the Cloudinary widget info into our UploadedAsset type.
 */
export function normalize(info: any): UploadedAsset {
  return {
    name: `${info.original_filename}${info.format ? '.' + info.format : ''}`,
    title: info.original_filename,
    type: info.resource_type,
    url: info.secure_url,
    thumbnail: thumbFrom(info),
    size: info.bytes,
    duration: info.duration ?? '',
    width: info.width,
    height: info.height,
    publicId: info.public_id,
    format: info.format,
    cloudinaryData: info
  };
}

export type WidgetOptions = Partial<{
  maxChunkSize: number;
  folder: string;
  multiple: boolean;
}>;

/**
 * Open the Cloudinary Upload Widget. Loads the script if necessary.
 * Returns nothing; the result is delivered via the onAsset callback.
 */
export async function openCloudinaryWidget(
  onAsset: (asset: UploadedAsset) => void,
  onClose?: () => void,
  options: WidgetOptions = {}
): Promise<void> {
  await loadScriptOnce(WIDGET_SRC);
  if (!window.cloudinary || !window.cloudinary.createUploadWidget) {
    throw new Error('Cloudinary widget script failed to load');
  }
  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      resourceType: 'auto',
      multiple: options.multiple ?? true,
      folder: options.folder ?? 'uploads',
      maxChunkSize: options.maxChunkSize ?? 20 * 1024 * 1024,
      sources: ['local', 'url', 'camera', 'google_drive', 'dropbox']
    },
    (error: any, result: any) => {
      if (error) {
        console.error('[Cloudinary] widget error', error);
        return;
      }
      if (!result) return;
      if (result.event === 'success' && result.info) {
        onAsset(normalize(result.info));
      }
      if (result.event === 'close') {
        onClose?.();
      }
    }
  );
  widget.open();
}
