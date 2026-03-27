export type ShipmentStatus =
  | 'Pending'
  | 'Pending Inspection'
  | 'Under Inspection'
  | 'QA Hold'
  | 'QA Approved'
  | 'Sealed'
  | 'In Transit'
  | 'Delivered';

export interface Shipment {
    shipment_id: string;
    bol_number: string;
    origin: string;
    destination: string;
    status: ShipmentStatus;
    assigned_qa_id?: string | null;
    created_at?: string;
    updated_at?: string;
    event_count?: number;
    last_event_type?: string;
    last_event_at?: string;
}

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

// --- QA Types ---

export interface QAUser {
    user_id: string;
    email: string;
}

export type QAInspectionStatus = 'Pending' | 'In Progress' | 'Passed' | 'Failed' | 'On Hold';
export type QADisposition = 'Pass' | 'Fail' | 'QA Hold' | 'Conditional';
export type ItemDisposition = 'Pass' | 'Fail' | 'Use-as-is' | 'Return to Vendor' | 'Scrap';

export interface QAChecklistItem {
    item_id: string;
    inspection_id: string;
    manufacturer: string | null;
    model: string | null;
    serial_number: string | null;
    quantity: number;
    visual_condition: 'Pass' | 'Fail' | null;
    packaging_condition: 'Pass' | 'Fail' | null;
    damage_notes: string | null;
    disposition: ItemDisposition | null;
    created_at: string;
}

export interface QAInspection {
    inspection_id: string;
    shipment_id: string;
    assigned_qa_id: string;
    assigned_qa_email: string;
    status: QAInspectionStatus;
    overall_disposition: QADisposition | null;
    notes: string | null;
    created_by: string;
    created_at: string;
    completed_at: string | null;
    items: QAChecklistItem[];
}
