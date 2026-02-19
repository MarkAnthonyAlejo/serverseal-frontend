
export type ShipmentStatus = 'Pending' | 'Sealed' | 'In Transit' | 'Delivered'

export interface Shipment {
    id: string,
    bol_number: string, 
    origin: string, 
    destination: string, 
    status: ShipmentStatus,
    created_at?: string 
}

export interface ShipmentEvent {
    event_id: string, 
    shipment_id: string, 
    event_type: string, 
    location: string, 
    notes: string, 
    evidence_photos?: string[]

}