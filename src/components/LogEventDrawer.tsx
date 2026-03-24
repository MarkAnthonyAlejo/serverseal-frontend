import { useState, useEffect, useRef } from 'react';
import usePlacesAutocomplete from 'use-places-autocomplete';

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
  handler_id: string;
  hardware_details: string;
  notes: string;
}

export default function LogEventDrawer({ isOpen, onClose, onSuccess, shipmentId }: LogEventDrawerProps) {
  const [formData, setFormData] = useState<FormData>({
    event_type: '',
    location: '',
    handler_id: localStorage.getItem('serverseal_handler_id') ?? '',
    hardware_details: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isFormValid =
    formData.event_type.length > 0 &&
    formData.location.trim().length > 0 &&
    formData.handler_id.trim().length > 0;

  const handleSelectLocation = (description: string) => {
    setLocationValue(description, false);
    setFormData(prev => ({ ...prev, location: description }));
    clearLocationSuggestions();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({
      event_type: '',
      location: '',
      handler_id: localStorage.getItem('serverseal_handler_id') ?? '',
      hardware_details: '',
      notes: '',
    });
    setLocationValue('');
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the event
      const eventRes = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: shipmentId,
          event_type: formData.event_type,
          location: formData.location,
          hardware_details: formData.hardware_details || null,
          notes: formData.notes || null,
          handler_id: formData.handler_id,
        }),
      });

      if (!eventRes.ok) {
        setError('ERR_EVENT_CREATE_FAILED // SERVER_REJECTED');
        return;
      }

      const { event_id } = await eventRes.json();

      // Step 2: Upload media if a file was selected
      if (file) {
        const form = new FormData();
        form.append('file', file);
        form.append('event_id', event_id);
        form.append('media_type', 'image');
        if (coords) {
          form.append('latitude', String(coords.lat));
          form.append('longitude', String(coords.lon));
        }

        await fetch('/api/media/upload', { method: 'POST', body: form });
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

            {/* HANDLER_ID */}
            <div>
              <label className={labelClass}>HANDLER_ID</label>
              <input
                name="handler_id"
                value={formData.handler_id}
                onChange={handleChange}
                className={inputClass}
                placeholder="Badge number or name"
                required
              />
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
