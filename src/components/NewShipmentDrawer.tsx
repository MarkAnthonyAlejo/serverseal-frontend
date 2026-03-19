import { useState } from 'react';
import usePlacesAutocomplete from "use-places-autocomplete";
import type { DrawerProps } from '../types';

export default function NewShipmentDrawer({ isOpen, onClose, onSuccess }: DrawerProps) {
  // Local state to track the POST request status
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Central form state
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

  // Helper: Selection for Origin
  const handleSelectOrigin = (description: string) => {
    setOriginValue(description, false);
    setFormData(prev => ({ ...prev, origin: description }));
    clearOriginSuggestions();
  };

  // Helper: Selection for Destination
  const handleSelectDest = (description: string) => {
    setDestValue(description, false);
    setFormData(prev => ({ ...prev, destination: description }));
    clearDestSuggestions();
  };

  // Submit to Flask Backend
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
        onSuccess(); // Refresh the list in parent
        onClose();   // Close the drawer
        
        // Reset all states
        setFormData({ bol_number: '', origin: '', destination: '' });
        setOriginValue('');
        setDestValue('');
      } else {
        console.error("SERVER_ERROR: UNABLE_TO_SAVE_SHIPMENT");
        alert("Server rejected the shipment. Please check the data.");
      }
    } catch (err) {
      console.error("NETWORK_ERROR:", err);
      alert("Cannot reach the backend server. Is Flask running on port 5050?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-all" 
          onClick={onClose} 
        />
      )}

      {/* Drawer Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-surface border-l border-subtle z-50 transform transition-transform duration-500 shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8">
          <header className="mb-8">
            <h2 className="font-display text-4xl text-accent-primary uppercase tracking-tighter">
              DATA_ENTRY // NEW_SHIPMENT
            </h2>
            <div className="h-px w-full bg-gradient-to-r from-accent-primary to-transparent opacity-30 mt-2" />
          </header>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* BOL NUMBER */}
            <div>
              <label className="block font-mono text-[10px] text-accent-primary uppercase mb-2">BOL_NUMBER</label>
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
              <label className="block font-mono text-[10px] text-accent-primary uppercase mb-2">ORIGIN_LOC</label>
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
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                  {originData.map(({ place_id, description }) => (
                    <li 
                      key={place_id} 
                      onClick={() => handleSelectOrigin(description)}
                      className="p-3 font-mono text-xs text-text-primary hover:bg-accent-primary hover:text-base cursor-pointer border-b border-subtle last:border-0 transition-colors"
                    >
                      {description.toUpperCase()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* DESTINATION_LOC */}
            <div className="relative">
              <label className="block font-mono text-[10px] text-accent-primary uppercase mb-2">DESTINATION_LOC</label>
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
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                  {destData.map(({ place_id, description }) => (
                    <li 
                      key={place_id} 
                      onClick={() => handleSelectDest(description)}
                      className="p-3 font-mono text-xs text-text-primary hover:bg-accent-primary hover:text-base cursor-pointer border-b border-subtle last:border-0 transition-colors"
                    >
                      {description.toUpperCase()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`btn-industrial w-full py-4 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">PROCESSING_TRANSACTION...</span>
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