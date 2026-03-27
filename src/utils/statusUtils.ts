import type { ShipmentStatus } from '../types';

export function getStatusClasses(status: ShipmentStatus): string {
    const map: Record<ShipmentStatus, string> = {
        'Pending':            'border-text-muted text-text-muted',
        'Pending Inspection': 'border-status-warn text-status-warn',
        'Under Inspection':   'border-status-warn text-status-warn',
        'QA Hold':            'border-status-danger text-status-danger',
        'QA Approved':        'border-status-ok text-status-ok',
        'Sealed':             'border-accent-primary text-accent-primary',
        'In Transit':         'border-status-warn text-status-warn',
        'Delivered':          'border-status-ok text-status-ok',
    };
    return map[status] ?? 'border-text-muted text-text-muted';
}

export function getStatusLabel(status: ShipmentStatus): string {
    return status.toUpperCase().replace(/ /g, '_');
}
