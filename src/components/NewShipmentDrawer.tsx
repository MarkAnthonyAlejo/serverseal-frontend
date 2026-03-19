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
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5050/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // SUCCESS: Pass the BOL number back to the Dashboard for the Toast
        onSuccess(formData.bol_number); 
        onClose();
        
        // Reset States
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
                className="w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none transition-all"
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
                  setFormData(prev => ({ ...prev, origin: e.target.value }));
                }}
                className="w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none"
                placeholder={originReady ? "SEARCH_CITY..." : "SYSTEM_INITIALIZING..."}
                required
              />
              {originStatus === "OK" && (
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl max-h-60 overflow-y-auto">
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
                  setFormData(prev => ({ ...prev, destination: e.target.value }));
                }}
                className="w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none"
                placeholder={destReady ? "SEARCH_CITY..." : "SYSTEM_INITIALIZING..."}
                required
              />
              {destStatus === "OK" && (
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl max-h-60 overflow-y-auto">
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
                disabled={isSubmitting}
                className={`btn-industrial w-full py-4 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">PROCESSING_DATA...</span>
                ) : (
                  'COMMIT_DATA'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}