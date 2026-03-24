export type ShipmentStatus = 'Pending' | 'Sealed' | 'In Transit' | 'Delivered';

export interface Shipment {
    shipment_id: string;
    bol_number: string;
    origin: string;
    destination: string;
    status: ShipmentStatus;
    created_at?: string;
    updated_at?: string;
    event_count?: number;
    last_event_type?: string;
    last_event_at?: string;
}

// Data needed for the POST request
export interface ShipmentCreateInput {
    bol_number: string;
    origin: string;
    destination: string;
}

export interface MediaItem {
    media_id: string;
    type: string;
    path: string;
    lat: number | null;
    lon: number | null;
}

export interface ShipmentEvent {
    event_id: string;
    shipment_id: string;
    event_type: string;
    location: string;
    notes: string;
    handler_id?: string;
    hardware_details?: string;
    created_at?: string;
    evidence_photos?: MediaItem[];
}

export interface StatusHistoryEntry {
    history_id: string;
    shipment_id: string;
    status: ShipmentStatus;
    changed_at: string;
}

export interface ShipmentDetail {
    shipment: Shipment;
    history: ShipmentEvent[];
    status_history: StatusHistoryEntry[];
}

// Rename this for clarity
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bol: string) => void;
}

export interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}
