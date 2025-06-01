import { z } from 'zod';
import { ShipmentStatus, AddressType } from '../types';

// Base validation schemas
const shipmentStatusSchema = z.enum(['pending', 'in_transit', 'delivered', 'returned']);
const addressTypeSchema = z.enum(['billing', 'shipping']);

// Address validation schemas
export const createAddressSchema = z.object({
  type: addressTypeSchema,
  street1: z.string().min(1).max(255),
  street2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default('Indonesia'),
});

export const updateAddressSchema = z.object({
  type: addressTypeSchema.optional(),
  street1: z.string().min(1).max(255).optional(),
  street2: z.string().max(255).optional(),
  city: z.string().min(1).max(100).optional(),
  province: z.string().min(1).max(100).optional(),
  postalCode: z.string().min(1).max(20).optional(),
  country: z.string().min(1).max(100).optional(),
});

// Shipment validation schemas
export const createShipmentSchema = z.object({
  orderId: z.number().int().positive(),
  addressId: z.number().int().positive(),
  courier: z.string().min(1).max(50).optional(),
  trackingNumber: z.string().min(1).max(100).optional(),
  status: shipmentStatusSchema.default('pending'),
});

export const updateShipmentSchema = z.object({
  courier: z.string().min(1).max(50).optional(),
  trackingNumber: z.string().min(1).max(100).optional(),
  status: shipmentStatusSchema.optional(),
});

// Shipping cost calculation schema
export const shippingCostRequestSchema = z.object({
  origin: z.object({
    city: z.string().min(1).max(100),
    province: z.string().min(1).max(100),
    postalCode: z.string().max(20).optional(),
  }),
  destination: z.object({
    city: z.string().min(1).max(100),
    province: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
  }),
  weight: z.number().int().min(1).max(30000), // Max 30kg
  courier: z.string().min(1).max(20).optional(),
});

// Package tracking schema
export const trackingRequestSchema = z.object({
  trackingNumber: z.string().min(1).max(100),
  courier: z.string().min(1).max(50),
});

// Query schemas
export const addressQuerySchema = z.object({
  type: addressTypeSchema.optional(),
  city: z.string().min(1).max(100).optional(),
  province: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
});

export const shipmentQuerySchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val) || 1)
    .default('1'),
  limit: z
    .string()
    .transform(val => {
      const num = parseInt(val) || 20;
      return Math.min(Math.max(num, 1), 100);
    })
    .default('20'),
  status: z
    .union([
      shipmentStatusSchema,
      z
        .string()
        .transform(val =>
          val.split(',').filter(s => ['pending', 'in_transit', 'delivered', 'returned'].includes(s))
        ),
    ])
    .optional(),
  courier: z.string().min(1).max(50).optional(),
  dateFrom: z
    .string()
    .transform(val => new Date(val))
    .optional(),
  dateTo: z
    .string()
    .transform(val => new Date(val))
    .optional(),
  trackingNumber: z.string().min(1).max(100).optional(),
});

// Admin shipment query schema
export const adminShipmentQuerySchema = shipmentQuerySchema.extend({
  userId: z
    .string()
    .transform(val => parseInt(val))
    .optional(),
  orderId: z
    .string()
    .transform(val => parseInt(val))
    .optional(),
});

// Parameter schemas
export const addressParamsSchema = z.object({
  addressId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Address ID must be a positive number');
    }
    return num;
  }),
});

export const shipmentParamsSchema = z.object({
  shipmentId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Shipment ID must be a positive number');
    }
    return num;
  }),
});

export const trackingParamsSchema = z.object({
  trackingNumber: z.string().min(1).max(100),
});

// Shipment status update schema
export const updateShipmentStatusSchema = z.object({
  status: shipmentStatusSchema,
  note: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
});

// Bulk shipment operations schema
export const bulkShipmentUpdateSchema = z.object({
  shipmentIds: z.array(z.number().int().positive()).min(1).max(100),
  status: shipmentStatusSchema,
  note: z.string().max(500).optional(),
});

// Address validation schema (for Raja Ongkir integration)
export const validateAddressSchema = z.object({
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20).optional(),
});

// Province and city query schemas
export const provinceQuerySchema = z.object({
  search: z.string().max(100).optional(),
});

export const cityQuerySchema = z.object({
  provinceId: z.string().optional(),
  search: z.string().max(100).optional(),
});

// Export types for TypeScript
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type ShippingCostRequestInput = z.infer<typeof shippingCostRequestSchema>;
export type TrackingRequestInput = z.infer<typeof trackingRequestSchema>;
export type AddressQueryInput = z.infer<typeof addressQuerySchema>;
export type ShipmentQueryInput = z.infer<typeof shipmentQuerySchema>;
export type AdminShipmentQueryInput = z.infer<typeof adminShipmentQuerySchema>;
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
export type BulkShipmentUpdateInput = z.infer<typeof bulkShipmentUpdateSchema>;
export type ValidateAddressInput = z.infer<typeof validateAddressSchema>;
export type ProvinceQueryInput = z.infer<typeof provinceQuerySchema>;
export type CityQueryInput = z.infer<typeof cityQuerySchema>;

// Validation helpers
export function validateWeight(weight: number): boolean {
  return weight >= 1 && weight <= 30000; // 1g to 30kg
}

export function validatePostalCode(postalCode: string, country: string = 'Indonesia'): boolean {
  switch (country.toLowerCase()) {
    case 'indonesia':
      // Indonesian postal codes are 5 digits
      return /^\d{5}$/.test(postalCode);
    case 'singapore':
      // Singapore postal codes are 6 digits
      return /^\d{6}$/.test(postalCode);
    case 'malaysia':
      // Malaysian postal codes are 5 digits
      return /^\d{5}$/.test(postalCode);
    default:
      // Generic validation for other countries
      return /^\d{4,6}$/.test(postalCode);
  }
}

export function validateTrackingNumber(trackingNumber: string, courier?: string): boolean {
  if (!trackingNumber || trackingNumber.length < 3) return false;

  // Courier-specific tracking number validation
  switch (courier?.toLowerCase()) {
    case 'jne':
      // JNE tracking numbers are typically 10-15 alphanumeric characters
      return /^[A-Z0-9]{10,15}$/.test(trackingNumber.toUpperCase());
    case 'pos':
      // POS tracking numbers vary but usually contain letters and numbers
      return /^[A-Z0-9]{8,20}$/.test(trackingNumber.toUpperCase());
    case 'tiki':
      // TIKI tracking numbers are usually numeric
      return /^\d{10,15}$/.test(trackingNumber);
    case 'sicepat':
      // SiCepat tracking numbers are alphanumeric
      return /^[A-Z0-9]{10,20}$/.test(trackingNumber.toUpperCase());
    case 'jnt':
    case 'j&t':
      // J&T tracking numbers are usually numeric
      return /^\d{10,15}$/.test(trackingNumber);
    default:
      // Generic validation - alphanumeric, 5-25 characters
      return /^[A-Z0-9]{5,25}$/i.test(trackingNumber);
  }
}

export function validateShipmentStatusTransition(
  currentStatus: ShipmentStatus,
  newStatus: ShipmentStatus
): boolean {
  const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
    pending: ['in_transit', 'returned'],
    in_transit: ['delivered', 'returned'],
    delivered: [], // Final state - no transitions allowed
    returned: [], // Final state - no transitions allowed
  };

  return validTransitions[currentStatus].includes(newStatus);
}

export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number,
  divisor: number = 6000
): number {
  // Calculate dimensional weight in grams
  // Default divisor of 6000 is commonly used in Indonesia
  return Math.ceil((length * width * height) / divisor);
}

export function formatTrackingNumber(trackingNumber: string, courier?: string): string {
  // Remove spaces and convert to uppercase
  let formatted = trackingNumber.replace(/\s/g, '').toUpperCase();

  // Courier-specific formatting
  switch (courier?.toLowerCase()) {
    case 'jne':
      // JNE format: XXXX-XXXX-XXXX
      if (formatted.length >= 12) {
        formatted = `${formatted.slice(0, 4)}-${formatted.slice(4, 8)}-${formatted.slice(8)}`;
      }
      break;
    case 'pos':
      // POS format: XX XXXX XXXX XX
      if (formatted.length >= 10) {
        formatted = `${formatted.slice(0, 2)} ${formatted.slice(2, 6)} ${formatted.slice(6, 10)} ${formatted.slice(10)}`;
      }
      break;
    default:
      // Keep as-is for other couriers
      break;
  }

  return formatted;
}

export function validateIndonesianAddress(address: {
  city: string;
  province: string;
  postalCode?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // List of Indonesian provinces (simplified)
  const validProvinces = [
    'Aceh',
    'Sumatera Utara',
    'Sumatera Barat',
    'Riau',
    'Jambi',
    'Sumatera Selatan',
    'Bengkulu',
    'Lampung',
    'Kepulauan Bangka Belitung',
    'Kepulauan Riau',
    'DKI Jakarta',
    'Jawa Barat',
    'Jawa Tengah',
    'DI Yogyakarta',
    'Jawa Timur',
    'Banten',
    'Bali',
    'Nusa Tenggara Barat',
    'Nusa Tenggara Timur',
    'Kalimantan Barat',
    'Kalimantan Tengah',
    'Kalimantan Selatan',
    'Kalimantan Timur',
    'Kalimantan Utara',
    'Sulawesi Utara',
    'Sulawesi Tengah',
    'Sulawesi Selatan',
    'Sulawesi Tenggara',
    'Gorontalo',
    'Sulawesi Barat',
    'Maluku',
    'Maluku Utara',
    'Papua',
    'Papua Barat',
  ];

  const normalizedProvince = address.province.toLowerCase();
  const isValidProvince = validProvinces.some(
    province =>
      province.toLowerCase().includes(normalizedProvince) ||
      normalizedProvince.includes(province.toLowerCase())
  );

  if (!isValidProvince) {
    errors.push('Province not found in Indonesia');
  }

  if (address.postalCode && !validatePostalCode(address.postalCode, 'Indonesia')) {
    errors.push('Invalid Indonesian postal code format (should be 5 digits)');
  }

  if (address.city.length < 2) {
    errors.push('City name is too short');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
