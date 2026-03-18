export type ShipmentStatus = 'Pending' | 'Sealed' | 'In Transit' | 'Delivered';

export interface Shipment {
    shipment_id: string;
    bol_number: string; 
    origin: string; 
    destination: string; 
    status: ShipmentStatus;
    created_at?: string;
}

// Data needed for the POST request
export interface ShipmentCreateInput {
    bol_number: string;
    origin: string;
    destination: string;
}

export interface ShipmentEvent {
    event_id: string; 
    shipment_id: string; 
    event_type: string; 
    location: string; 
    notes: string; 
    evidence_photos?: string[];
}

// Rename this for clarity
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}