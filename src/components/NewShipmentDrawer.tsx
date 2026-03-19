import { useState } from 'react';
import usePlacesAutocomplete from "use-places-autocomplete";
import type { DrawerProps } from '../types';

export default function NewShipmentDrawer({ isOpen, onClose, onSuccess }: DrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bol_number: '',
    origin: '',
    destination: '',
  });

  // 1. Hook for ORIGIN
  const {
    ready: originReady,
    value: originValue,
    suggestions: { status: originStatus, data: originData },
    setValue: setOriginValue,
    clearSuggestions: clearOriginSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { types: ["(cities)"], componentRestrictions: { country: "us" } },
    debounce: 300,
  });

  // 2. Hook for DESTINATION
  const {
    ready: destReady,
    value: destValue,
    suggestions: { status: destStatus, data: destData },
    setValue: setDestValue,
    clearSuggestions: clearDestSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { types: ["(cities)"], componentRestrictions: { country: "us" } },
    debounce: 300,
  });

  // --- LOGIC GATE: VALIDATION ---
  // The button only unlocks if BOL has length and both cities are selected
  const isFormValid = 
    formData.bol_number.trim().length >= 3 && 
    formData.origin.length > 0 && 
    formData.destination.length > 0;

  const handleSelectOrigin = (description: string) => {
    setOriginValue(description, false);
    setFormData(prev => ({ ...prev, origin: description }));
    clearOriginSuggestions();
  };

  const handleSelectDest = (description: string) => {
    setDestValue(description, false);
    setFormData(prev => ({ ...prev, destination: description }));
    clearDestSuggestions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return; // Extra safety check

    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5050/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Success: Trigger the Toast in the Dashboard
        onSuccess(formData.bol_number); 
        onClose();
        
        // Reset local states
        setFormData({ bol_number: '', origin: '', destination: '' });
        setOriginValue('');
        setDestValue('');
      } else {
        console.error("SERVER_ERROR: TRANSACTION_REJECTED");
      }
    } catch (err) {
      console.error("NETWORK_ERROR:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-all" onClick={onClose} />
      )}

      <div className={`fixed top-0 right-0 h-full w-96 bg-surface border-l border-subtle z-50 transform transition-transform duration-500 shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8">
          <header className="mb-8 border-b border-subtle pb-4">
            <h2 className="font-display text-4xl text-accent-primary uppercase tracking-tighter">
              DATA_ENTRY // NEW_SHIPMENT
            </h2>
          </header>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* BOL NUMBER */}
            <div>
              <label className="block font-mono text-[10px] text-accent-primary uppercase mb-2 tracking-widest">BOL_NUMBER</label>
              <input 
                required
                autoComplete="off"
                className="w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none transition-all placeholder:opacity-30"
                value={formData.bol_number}
                onChange={e => setFormData({...formData, bol_number: e.target.value})}
                placeholder="e.g. SEA-9920"
              />
            </div>

            {/* ORIGIN_LOC */}
            <div className="relative">
              <label className="block font-mono text-[10px] text-accent-primary uppercase mb-2 tracking-widest">ORIGIN_LOC</label>
              <input 
                value={originValue}
                disabled={!originReady}
                onChange={(e) => {
                  setOriginValue(e.target.value);
                  // We clear the form data if they start typing again 
                  // to force them to click a new suggestion
                  setFormData(prev => ({ ...prev, origin: '' }));
                }}
                className="w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none placeholder:opacity-30"
                placeholder={originReady ? "SEARCH_CITY..." : "SYSTEM_INITIALIZING..."}
                required
              />
              {originStatus === "OK" && (
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                  {originData.map(({ place_id, description }) => (
                    <li 
                      key={place_id} 
                      onClick={() => handleSelectOrigin(description)}
                      className="p-3 font-mono text-[11px] text-text-primary hover:bg-accent-primary hover:text-base cursor-pointer border-b border-subtle last:border-0 transition-colors uppercase"
                    >
                      {description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* DESTINATION_LOC */}
            <div className="relative">
              <label className="block font-mono text-[10px] text-accent-primary uppercase mb-2 tracking-widest">DESTINATION_LOC</label>
              <input 
                value={destValue}
                disabled={!destReady}
                onChange={(e) => {
                  setDestValue(e.target.value);
                  setFormData(prev => ({ ...prev, destination: '' }));
                }}
                className="w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none placeholder:opacity-30"
                placeholder={destReady ? "SEARCH_CITY..." : "SYSTEM_INITIALIZING..."}
                required
              />
              {destStatus === "OK" && (
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                  {destData.map(({ place_id, description }) => (
                    <li 
                      key={place_id} 
                      onClick={() => handleSelectDest(description)}
                      className="p-3 font-mono text-[11px] text-text-primary hover:bg-accent-primary hover:text-base cursor-pointer border-b border-subtle last:border-0 transition-colors uppercase"
                    >
                      {description}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* COMMIT BUTTON */}
            <div className="pt-6">
              <button 
                type="submit" 
                disabled={!isFormValid || isSubmitting}
                className={`btn-industrial w-full py-4 flex items-center justify-center gap-2 transition-all duration-300
                  ${(!isFormValid || isSubmitting) 
                    ? 'opacity-20 cursor-not-allowed grayscale scale-[0.98]' 
                    : 'opacity-100 cursor-pointer active:scale-[0.97] shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]'
                  }`}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">PROCESSING_DATA...</span>
                ) : (
                  'COMMIT_DATA'
                )}
              </button>
              
              {/* Optional: Tiny hint for the user */}
              {!isFormValid && (
                <p className="text-center font-mono text-[8px] text-text-muted mt-3 tracking-tighter uppercase opacity-50">
                  Waiting for verified city selection...
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}