import { useState } from 'react';
import type { Process } from '../../data/processes';

interface PhotoGalleryProps {
  process: Process;
}

interface PhotoItem {
  url: string;
  activityTitle: string;
  date: string;
}

export function PhotoGallery({ process }: PhotoGalleryProps) {
  const [lightbox, setLightbox] = useState<PhotoItem | null>(null);

  const photos: PhotoItem[] = process.activities.flatMap(a =>
    a.photos.map(url => ({
      url,
      activityTitle: a.title,
      date: new Date(a.date + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
      }),
    }))
  );

  if (photos.length === 0) {
    return (
      <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Roboto Condensed', sans-serif" }}>
        No hay fotos registradas aún.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setLightbox(photo)}
            className="relative group rounded-xl overflow-hidden aspect-square cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <img
              src={photo.url}
              alt={photo.activityTitle}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div
              className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'linear-gradient(0deg, rgba(19,65,116,0.9) 0%, transparent 60%)' }}
            >
              <p
                className="text-xs font-medium truncate"
                style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#fff' }}
              >
                {photo.activityTitle}
              </p>
              <p
                className="text-xs"
                style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#D4AF37' }}
              >
                {photo.date}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-3xl w-full rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(212,175,55,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.activityTitle}
              className="w-full object-contain max-h-[70vh]"
            />
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: '#134174' }}
            >
              <div>
                <p style={{ fontFamily: "'Antonio', sans-serif", color: '#fff', fontSize: 16 }}>
                  {lightbox.activityTitle}
                </p>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#D4AF37', fontSize: 13 }}>
                  {lightbox.date}
                </p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
