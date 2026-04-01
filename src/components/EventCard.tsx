import { useState, useEffect } from 'react';
import type { ShipmentEvent } from '../types';

interface EventCardProps {
  event: ShipmentEvent;
  index: number;
}

function formatTimestamp(ts?: string): string {
  if (!ts) return 'TIMESTAMP_UNKNOWN';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default function EventCard({ event, index }: EventCardProps) {
  const allMedia = event.evidence_photos ?? [];
  const signatures = allMedia.filter(m => m.type === 'signature');
  const photos = allMedia.filter(m => m.type !== 'signature');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(photos.length - 1, i + 1) : null);
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(0, i - 1) : null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, photos.length]);

  return (
    <div className="relative pl-8">
      {/* Timeline connector */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-subtle" />
      <div className="absolute left-[7px] top-4 w-3 h-3 border-2 border-accent-primary bg-base" />

      <div className="bg-surface border border-subtle p-6 mb-6">
        {/* Header row */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-[9px] text-text-muted tracking-widest">
              EVENT_{String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="font-display text-3xl text-accent-primary tracking-tight uppercase">
              {event.event_type}
            </h3>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-text-muted">
              {formatTimestamp(event.created_at)}
            </p>
            {event.handler_id && (
              <p className="font-mono text-[10px] text-text-muted mt-0.5">
                HANDLER: <span className="text-text-primary">{event.handler_id}</span>
              </p>
            )}
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[10px] text-text-muted">◉ LOC:</span>
            <span className="font-mono text-sm text-text-primary">{event.location}</span>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <p className="font-sans text-sm text-text-primary mb-3 border-l-2 border-subtle pl-3">
            {event.notes}
          </p>
        )}

        {/* Hardware details */}
        {event.hardware_details && (
          <div className="mb-4">
            <p className="font-mono text-[9px] text-text-muted uppercase mb-1 tracking-widest">HARDWARE_DETAILS</p>
            <pre className="bg-base border border-subtle p-3 font-mono text-xs text-text-primary overflow-x-auto whitespace-pre-wrap">
              {event.hardware_details}
            </pre>
          </div>
        )}

        {/* Delivery signature */}
        {signatures.length > 0 && (
          <div className="mb-4">
            <p className="font-mono text-[9px] text-text-muted uppercase mb-2 tracking-widest">
              DELIVERY_SIGNATURE
            </p>
            {signatures.map(sig => {
              const url = `/uploads/${sig.path.replace(/^uploads\//, '')}`;
              return (
                <div key={sig.media_id} className="border border-accent-primary/40 inline-block">
                  <img
                    src={url}
                    alt="Delivery signature"
                    className="h-20 w-auto object-contain"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Photo evidence */}
        {photos.length > 0 ? (
          <div>
            <p className="font-mono text-[9px] text-text-muted uppercase mb-2 tracking-widest">
              EVIDENCE_PHOTOS // {photos.length} FILE{photos.length !== 1 ? 'S' : ''}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo, i) => {
                const url = `/uploads/${photo.path.replace(/^uploads\//, '')}`;
                return (
                  <button
                    key={photo.media_id}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="flex-shrink-0 text-left group"
                  >
                    <img
                      src={url}
                      alt={`Evidence ${photo.media_id.slice(0, 8)}`}
                      className="w-24 h-24 object-cover border border-subtle group-hover:border-accent-primary group-hover:opacity-80 transition-all"
                    />
                    {(photo.lat !== null && photo.lon !== null) && (
                      <p className="font-mono text-[8px] text-text-muted mt-1 text-center">
                        {Number(photo.lat).toFixed(4)}, {Number(photo.lon).toFixed(4)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
              <div
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center"
                onClick={() => setLightboxIndex(null)}
              >
                <div
                  className="relative max-w-4xl w-full mx-8 flex flex-col gap-3"
                  onClick={e => e.stopPropagation()}
                  tabIndex={-1}
                  autoFocus
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] text-text-muted tracking-widest">
                      EVIDENCE_{String(lightboxIndex + 1).padStart(2, '0')} // {photos[lightboxIndex].media_id.slice(0, 8)}
                    </span>
                    <button
                      onClick={() => setLightboxIndex(null)}
                      className="font-mono text-[10px] text-text-muted border border-subtle px-3 py-1 hover:border-status-danger hover:text-status-danger transition-colors"
                    >
                      [ESC] CLOSE
                    </button>
                  </div>

                  <img
                    src={`/uploads/${photos[lightboxIndex].path.replace(/^uploads\//, '')}`}
                    alt={`Evidence ${lightboxIndex + 1}`}
                    className="max-h-[75vh] w-full object-contain border border-subtle"
                  />

                  {(photos[lightboxIndex].lat !== null && photos[lightboxIndex].lon !== null) && (
                    <p className="font-mono text-[9px] text-text-muted text-center">
                      ◉ GEO: {Number(photos[lightboxIndex].lat).toFixed(6)}, {Number(photos[lightboxIndex].lon).toFixed(6)}
                    </p>
                  )}

                  {photos.length > 1 && (
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setLightboxIndex(i => i !== null ? Math.max(0, i - 1) : null)}
                        disabled={lightboxIndex === 0}
                        className="font-mono text-xs border border-subtle px-4 py-2 text-text-muted hover:border-accent-primary hover:text-accent-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        &lt; PREV
                      </button>
                      <span className="font-mono text-[9px] text-text-muted">
                        {lightboxIndex + 1} / {photos.length}
                      </span>
                      <button
                        onClick={() => setLightboxIndex(i => i !== null ? Math.min(photos.length - 1, i + 1) : null)}
                        disabled={lightboxIndex === photos.length - 1}
                        className="font-mono text-xs border border-subtle px-4 py-2 text-text-muted hover:border-accent-primary hover:text-accent-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        NEXT &gt;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : signatures.length === 0 ? (
          <p className="font-mono text-[10px] text-text-muted">[NO_MEDIA_ATTACHED]</p>
        ) : null}
      </div>
    </div>
  );
}
