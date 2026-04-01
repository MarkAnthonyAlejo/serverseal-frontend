import { useState, useEffect, useRef } from 'react';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { apiFetch } from '../api';

interface LogEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shipmentId: string;
}

const EVENT_TYPES = ['Pickup', 'Transit Check', 'Transfer', 'Delivery', 'Exception'];

interface FormData {
  event_type: string;
  location: string;
  hardware_details: string;
  notes: string;
}

export default function LogEventDrawer({ isOpen, onClose, onSuccess, shipmentId }: LogEventDrawerProps) {
  const [formData, setFormData] = useState<FormData>({
    event_type: '',
    location: '',
    hardware_details: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature state
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const {
    ready: locationReady,
    value: locationValue,
    suggestions: { status: locationStatus, data: locationData },
    setValue: setLocationValue,
    clearSuggestions: clearLocationSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  // Create / revoke the object URL whenever the selected file changes
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Request geolocation when drawer opens
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords(null)
      );
    }
  }, [isOpen]);

  // Set up canvas drawing when Delivery is selected
  useEffect(() => {
    if (formData.event_type !== 'Delivery') return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    // Size the canvas to its displayed dimensions
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let drawing = false;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      const scaleX = canvas.width / r.width;
      const scaleY = canvas.height / r.height;
      const point = e instanceof TouchEvent ? e.touches[0] : e;
      return {
        x: (point.clientX - r.left) * scaleX,
        y: (point.clientY - r.top) * scaleY,
      };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSignature(true);
    };

    const stop = () => { drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stop);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stop);
      canvas.removeEventListener('mouseleave', stop);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stop);
    };
  }, [formData.event_type]);

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getSignatureFile = (): Promise<File | null> => {
    return new Promise((resolve) => {
      const canvas = signatureCanvasRef.current;
      if (!canvas || !hasSignature) { resolve(null); return; }

      // Export with white background so it renders clearly in PDFs
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(canvas, 0, 0);

      exportCanvas.toBlob((blob) => {
        if (!blob) { resolve(null); return; }
        resolve(new File([blob], `sig_${Date.now()}.png`, { type: 'image/png' }));
      }, 'image/png');
    });
  };

  const isDelivery = formData.event_type === 'Delivery';

  const isFormValid =
    formData.event_type.length > 0 &&
    formData.location.trim().length > 0 &&
    (!isDelivery || hasSignature);

  const handleSelectLocation = (description: string) => {
    setLocationValue(description, false);
    setFormData(prev => ({ ...prev, location: description }));
    clearLocationSuggestions();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({ event_type: '', location: '', hardware_details: '', notes: '' });
    setLocationValue('');
    setFile(null);
    setError(null);
    clearSignature();
    setHasSignature(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the event — handler_id is set server-side from the JWT
      const eventRes = await apiFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: shipmentId,
          event_type: formData.event_type,
          location: formData.location,
          hardware_details: formData.hardware_details || null,
          notes: formData.notes || null,
        }),
      });

      if (!eventRes.ok) {
        setError('ERR_EVENT_CREATE_FAILED // SERVER_REJECTED');
        return;
      }

      const { event_id } = await eventRes.json();

      // Step 2: Upload photo evidence if attached
      if (file) {
        const form = new FormData();
        form.append('file', file);
        form.append('event_id', event_id);
        form.append('media_type', 'image');
        if (coords) {
          form.append('latitude', String(coords.lat));
          form.append('longitude', String(coords.lon));
        }
        await apiFetch('/api/media/upload', { method: 'POST', body: form });
      }

      // Step 3: Upload signature for Delivery events
      if (isDelivery) {
        const sigFile = await getSignatureFile();
        if (sigFile) {
          const sigForm = new FormData();
          sigForm.append('file', sigFile);
          sigForm.append('event_id', event_id);
          sigForm.append('media_type', 'signature');
          if (coords) {
            sigForm.append('latitude', String(coords.lat));
            sigForm.append('longitude', String(coords.lon));
          }
          await apiFetch('/api/media/upload', { method: 'POST', body: sigForm });
        }
      }

      onSuccess();
      resetForm();
      onClose();
    } catch {
      setError('ERR_NETWORK_FAILURE // CHECK_CONNECTION');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const inputClass = "w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none transition-all placeholder:opacity-30";
  const labelClass = "block font-mono text-[10px] text-accent-primary uppercase mb-2 tracking-widest";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40" onClick={handleClose} />
      )}

      <div className={`fixed top-0 right-0 h-full w-[420px] bg-surface border-l border-subtle z-50 transform transition-transform duration-500 shadow-2xl overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8">
          <header className="mb-8 border-b border-subtle pb-4">
            <h2 className="font-display text-4xl text-accent-primary uppercase tracking-tighter">
              LOG_EVENT // CHAIN_UPDATE
            </h2>
          </header>

          {error && (
            <div className="border border-status-danger bg-status-danger/10 p-3 font-mono text-status-danger text-xs mb-6">
              [!] {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* EVENT_TYPE */}
            <div>
              <label className={labelClass}>EVENT_TYPE</label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">-- SELECT_TYPE --</option>
                {EVENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* LOCATION with Google Places */}
            <div className="relative">
              <label className={labelClass}>LOCATION</label>
              <input
                value={locationValue}
                disabled={!locationReady}
                onChange={(e) => {
                  setLocationValue(e.target.value);
                  setFormData(prev => ({ ...prev, location: '' }));
                }}
                className={inputClass}
                placeholder={locationReady ? 'Search address or facility...' : 'SYSTEM_INITIALIZING...'}
                required
              />
              {locationStatus === 'OK' && (
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl max-h-52 overflow-y-auto">
                  {locationData.map(({ place_id, description }) => (
                    <li
                      key={place_id}
                      onClick={() => handleSelectLocation(description)}
                      className="p-3 font-mono text-[11px] text-text-primary hover:bg-accent-primary hover:text-base cursor-pointer border-b border-subtle last:border-0 transition-colors"
                    >
                      {description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* HARDWARE_DETAILS */}
            <div>
              <label className={labelClass}>HARDWARE_DETAILS</label>
              <textarea
                name="hardware_details"
                value={formData.hardware_details}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Serial numbers, asset tags..."
              />
            </div>

            {/* NOTES */}
            <div>
              <label className={labelClass}>NOTES</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Observations, condition notes..."
              />
            </div>

            {/* ATTACH_MEDIA */}
            <div>
              <label className={labelClass}>ATTACH_MEDIA (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full font-mono text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:border file:border-subtle file:bg-base file:text-text-primary file:font-mono file:text-xs file:cursor-pointer hover:file:border-accent-primary"
              />
              {previewUrl && (
                <div className="relative mt-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover border border-accent-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-1 right-1 bg-base border border-subtle font-mono text-[9px] text-text-muted px-2 py-1 hover:border-status-danger hover:text-status-danger transition-colors"
                  >
                    REMOVE
                  </button>
                  <p className="font-mono text-[9px] text-status-ok mt-1">
                    ◉ MEDIA_ATTACHED: {file?.name}
                  </p>
                </div>
              )}
              {coords && (
                <p className="font-mono text-[9px] text-status-ok mt-1">
                  ◉ GEO_LOCK: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
                </p>
              )}
            </div>

            {/* RECIPIENT SIGNATURE — Delivery events only */}
            {isDelivery && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass + ' mb-0'}>
                    RECIPIENT_SIGNATURE <span className="text-status-danger">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="font-mono text-[9px] text-text-muted border border-subtle px-2 py-1 hover:border-status-danger hover:text-status-danger transition-colors"
                  >
                    CLEAR
                  </button>
                </div>
                <div className="relative border border-subtle bg-base">
                  <canvas
                    ref={signatureCanvasRef}
                    className="w-full h-36 cursor-crosshair touch-none block"
                    style={{ display: 'block' }}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="font-mono text-[10px] text-text-muted opacity-40 tracking-widest">
                        SIGN HERE
                      </span>
                    </div>
                  )}
                  {/* signing line */}
                  <div className="absolute bottom-6 left-6 right-6 border-b border-subtle pointer-events-none" />
                </div>
                {hasSignature ? (
                  <p className="font-mono text-[9px] text-status-ok mt-1">
                    ◉ SIGNATURE_CAPTURED
                  </p>
                ) : (
                  <p className="font-mono text-[9px] text-status-danger mt-1">
                    [!] SIGNATURE_REQUIRED FOR DELIVERY
                  </p>
                )}
              </div>
            )}

            {/* SUBMIT */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`btn-industrial w-full py-4 flex items-center justify-center transition-all duration-300
                  ${(!isFormValid || isSubmitting)
                    ? 'opacity-20 cursor-not-allowed grayscale scale-[0.98]'
                    : 'opacity-100 cursor-pointer active:scale-[0.97]'
                  }`}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">COMMITTING_EVENT...</span>
                ) : (
                  'COMMIT_EVENT'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
