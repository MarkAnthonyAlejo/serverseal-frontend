
export interface Shipment {
    id: number, 
    server_name: string, 
    seal_id: string, 
    status: 'Pending' | 'Sealed' | 'In Transit'
    last_updated: string
}