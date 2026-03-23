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
  const photos = event.evidence_photos ?? [];

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

        {/* Photo evidence */}
        {photos.length > 0 ? (
          <div>
            <p className="font-mono text-[9px] text-text-muted uppercase mb-2 tracking-widest">
              EVIDENCE_PHOTOS // {photos.length} FILE{photos.length !== 1 ? 'S' : ''}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo) => {
                // Backend stores path as "uploads/filename.ext" — convert to "/uploads/filename.ext"
                const filename = photo.path.replace(/^uploads\//, '');
                const url = `/uploads/${filename}`;
                return (
                  <a
                    key={photo.media_id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <img
                      src={url}
                      alt={`Evidence ${photo.media_id.slice(0, 8)}`}
                      className="w-24 h-24 object-cover border border-subtle hover:border-accent-primary transition-colors"
                    />
                    {(photo.lat !== null && photo.lon !== null) && (
                      <p className="font-mono text-[8px] text-text-muted mt-1 text-center">
                        {Number(photo.lat).toFixed(4)}, {Number(photo.lon).toFixed(4)}
                      </p>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="font-mono text-[10px] text-text-muted">[NO_MEDIA_ATTACHED]</p>
        )}
      </div>
    </div>
  );
}
