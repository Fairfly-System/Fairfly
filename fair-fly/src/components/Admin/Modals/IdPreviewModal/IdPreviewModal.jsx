import { useEffect } from 'react';
import { useLightbox } from '../../../UI/ImageLightbox/ImageLightbox';

/**
 * IdPreviewModal - High-resolution inspection view for Government IDs
 * Powered by Universal ImageLightbox.
 */
export default function IdPreviewModal({
  isOpen,
  imageUrl,
  title = 'Government ID',
  side = 'Front Side',
  idType = 'Government ID'
}) {
  const { openLightbox } = useLightbox();

  useEffect(() => {
    if (isOpen && imageUrl) {
      openLightbox({
        url: imageUrl,
        title: `${title} — ${side}`,
        subtitle: `${idType} · High-Resolution Verification`
      });
    }
  }, [isOpen, imageUrl, title, side, idType, openLightbox]);

  return null;
}
