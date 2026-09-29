import { useEffect } from 'react';
import { useLightbox } from '../../../components/UI/ImageLightbox/ImageLightbox';

export default function AnnouncementLightbox({ isOpen, photos = [], activeIndex = 0 }) {
  const { openLightbox } = useLightbox();

  useEffect(() => {
    if (isOpen && photos.length > 0) {
      const images = photos.map((p, idx) => {
        if (typeof p === 'string') {
          return { url: p, title: `Announcement Photo ${idx + 1}` };
        }
        return {
          url: p.url,
          title: p.name || p.title || `Announcement Photo ${idx + 1}`
        };
      });
      openLightbox({
        images,
        activeIndex
      });
    }
  }, [isOpen, photos, activeIndex, openLightbox]);

  return null;
}
