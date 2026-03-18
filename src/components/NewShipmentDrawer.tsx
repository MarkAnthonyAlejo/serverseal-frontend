import { useState } from 'react';
import usePlacesAutocomplete from "use-places-autocomplete";
import type { DrawerProps } from '../types';

export default function NewShipmentDrawer({ isOpen, onClose, onSuccess }: DrawerProps) {
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
    try {
      const res = await fetch('http://localhost:5050/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        // Reset everything
        setFormData({ bol_number: '', origin: '', destination: '' });
        setOriginValue('');
        setDestValue('');
      }
    } catch (err) {
      console.error("COMMIT_FAILED:", err);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      )}

      <div className={`fixed top-0 right-0 h-full w-96 bg-surface border-l border-subtle z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8">
          <h2 className="font-display text-4xl text-accent-primary mb-8 uppercase tracking-tight">DATA_ENTRY // NEW_SHIPMENT</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* BOL NUMBER */}
            <div>
              <label className="block font-mono text-[10px] text-accent-primary uppercase mb-2">BOL_NUMBER</label>
              <input 
                required
                className="w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none"
                value={formData.bol_number}
                onChange={e => setFormData({...formData, bol_number: e.target.value})}
              />
            </div>

            {/* ORIGIN INPUT */}
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
                placeholder={originReady ? "SEARCH_CITY..." : "INITIALIZING..."}
              />
              {originStatus === "OK" && (
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl">
                  {originData.map(({ place_id, description }) => (
                    <li key={place_id} onClick={() => handleSelectOrigin(description)} className="p-3 font-mono text-xs text-text-primary hover:bg-accent-primary hover:text-base cursor-pointer">
                      {description.toUpperCase()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* DESTINATION INPUT */}
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
                placeholder={destReady ? "SEARCH_CITY..." : "INITIALIZING..."}
              />
              {destStatus === "OK" && (
                <ul className="absolute z-[60] w-full bg-surface border border-accent-primary mt-1 shadow-2xl">
                  {destData.map(({ place_id, description }) => (
                    <li key={place_id} onClick={() => handleSelectDest(description)} className="p-3 font-mono text-xs text-text-primary hover:bg-accent-primary hover:text-base cursor-pointer">
                      {description.toUpperCase()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="btn-industrial w-full mt-4">COMMIT_DATA</button>
          </form>
        </div>
      </div>
    </>
  );
}