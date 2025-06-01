import { logger } from '../config/logger';

export interface ShippingOrigin {
  city: string;
  province: string;
  postalCode?: string;
}

export interface ShippingDestination {
  city: string;
  province: string;
  postalCode: string;
}

export interface ShippingCostRequest {
  origin: ShippingOrigin;
  destination: ShippingDestination;
  weight: number; // in grams
  courier?: string;
}

export interface ShippingCostOption {
  courier: string;
  service: string;
  description: string;
  cost: number;
  estimatedDays: string;
  note?: string;
}

export interface ShippingCostResponse {
  results: ShippingCostOption[];
  origin: ShippingOrigin;
  destination: ShippingDestination;
  weight: number;
}

export interface TrackingRequest {
  trackingNumber: string;
  courier: string;
}

export interface TrackingHistory {
  date: string;
  description: string;
  location?: string;
}

export interface TrackingResponse {
  trackingNumber: string;
  courier: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'returned';
  currentLocation?: string;
  estimatedDelivery?: string;
  history: TrackingHistory[];
}

export interface ProvinceData {
  provinceId: string;
  province: string;
}

export interface CityData {
  cityId: string;
  provinceId: string;
  province: string;
  type: string;
  cityName: string;
  postalCode: string;
}

export class MockRajaOngkirService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  // Mock data for provinces and cities
  private readonly provinces: ProvinceData[] = [
    { provinceId: '1', province: 'Bali' },
    { provinceId: '2', province: 'Bangka Belitung' },
    { provinceId: '3', province: 'Banten' },
    { provinceId: '4', province: 'Bengkulu' },
    { provinceId: '5', province: 'DI Yogyakarta' },
    { provinceId: '6', province: 'DKI Jakarta' },
    { provinceId: '7', province: 'Gorontalo' },
    { provinceId: '8', province: 'Jambi' },
    { provinceId: '9', province: 'Jawa Barat' },
    { provinceId: '10', province: 'Jawa Tengah' },
    { provinceId: '11', province: 'Jawa Timur' },
    { provinceId: '12', province: 'Kalimantan Barat' },
    { provinceId: '13', province: 'Kalimantan Selatan' },
    { provinceId: '14', province: 'Kalimantan Tengah' },
    { provinceId: '15', province: 'Kalimantan Timur' },
    { provinceId: '16', province: 'Kalimantan Utara' },
    { provinceId: '17', province: 'Kepulauan Riau' },
    { provinceId: '18', province: 'Lampung' },
    { provinceId: '19', province: 'Maluku' },
    { provinceId: '20', province: 'Maluku Utara' },
    { provinceId: '21', province: 'Nanggroe Aceh Darussalam (NAD)' },
    { provinceId: '22', province: 'Nusa Tenggara Barat' },
    { provinceId: '23', province: 'Nusa Tenggara Timur' },
    { provinceId: '24', province: 'Papua' },
    { provinceId: '25', province: 'Papua Barat' },
    { provinceId: '26', province: 'Riau' },
    { provinceId: '27', province: 'Sulawesi Barat' },
    { provinceId: '28', province: 'Sulawesi Selatan' },
    { provinceId: '29', province: 'Sulawesi Tengah' },
    { provinceId: '30', province: 'Sulawesi Tenggara' },
    { provinceId: '31', province: 'Sulawesi Utara' },
    { provinceId: '32', province: 'Sumatera Barat' },
    { provinceId: '33', province: 'Sumatera Selatan' },
    { provinceId: '34', province: 'Sumatera Utara' },
  ];

  private readonly cities: CityData[] = [
    {
      cityId: '39',
      provinceId: '6',
      province: 'DKI Jakarta',
      type: 'Kota',
      cityName: 'Jakarta Barat',
      postalCode: '11220',
    },
    {
      cityId: '40',
      provinceId: '6',
      province: 'DKI Jakarta',
      type: 'Kota',
      cityName: 'Jakarta Pusat',
      postalCode: '10540',
    },
    {
      cityId: '41',
      provinceId: '6',
      province: 'DKI Jakarta',
      type: 'Kota',
      cityName: 'Jakarta Selatan',
      postalCode: '12230',
    },
    {
      cityId: '42',
      provinceId: '6',
      province: 'DKI Jakarta',
      type: 'Kota',
      cityName: 'Jakarta Timur',
      postalCode: '13330',
    },
    {
      cityId: '43',
      provinceId: '6',
      province: 'DKI Jakarta',
      type: 'Kota',
      cityName: 'Jakarta Utara',
      postalCode: '14140',
    },
    {
      cityId: '78',
      provinceId: '9',
      province: 'Jawa Barat',
      type: 'Kota',
      cityName: 'Bandung',
      postalCode: '40112',
    },
    {
      cityId: '114',
      provinceId: '9',
      province: 'Jawa Barat',
      type: 'Kota',
      cityName: 'Bogor',
      postalCode: '16119',
    },
    {
      cityId: '155',
      provinceId: '10',
      province: 'Jawa Tengah',
      type: 'Kota',
      cityName: 'Semarang',
      postalCode: '50132',
    },
    {
      cityId: '444',
      provinceId: '11',
      province: 'Jawa Timur',
      type: 'Kota',
      cityName: 'Surabaya',
      postalCode: '60119',
    },
    {
      cityId: '17',
      provinceId: '5',
      province: 'DI Yogyakarta',
      type: 'Kota',
      cityName: 'Yogyakarta',
      postalCode: '55111',
    },
  ];

  private readonly courierServices = {
    jne: [
      { service: 'OKE', description: 'Ongkos Kirim Ekonomis', baseRate: 0.8 },
      { service: 'REG', description: 'Layanan Reguler', baseRate: 1.0 },
      { service: 'YES', description: 'Yakin Esok Sampai', baseRate: 1.5 },
    ],
    pos: [
      { service: 'Pos Kilat Khusus', description: 'Pos Kilat Khusus', baseRate: 0.9 },
      { service: 'Express Next Day', description: 'Express Next Day', baseRate: 1.8 },
    ],
    tiki: [
      { service: 'ECO', description: 'Economy Service', baseRate: 0.7 },
      { service: 'REG', description: 'Regular Service', baseRate: 1.0 },
      { service: 'ONS', description: 'Over Night Service', baseRate: 1.6 },
    ],
    sicepat: [
      { service: 'REG', description: 'Regular Package', baseRate: 0.85 },
      { service: 'BEST', description: 'Best Package', baseRate: 1.2 },
    ],
    jnt: [
      { service: 'EZ', description: 'Easy Package', baseRate: 0.75 },
      { service: 'REG', description: 'Regular Package', baseRate: 1.0 },
    ],
  };

  constructor() {
    this.apiKey = process.env.RAJAONGKIR_API_KEY || 'mock_api_key';
    this.baseUrl = process.env.RAJAONGKIR_BASE_URL || 'https://api.rajaongkir.com/starter';
  }

  /**
   * Get shipping cost estimates
   */
  async getShippingCost(request: ShippingCostRequest): Promise<ShippingCostResponse> {
    logger.info('Mock RajaOngkir: Getting shipping cost', {
      origin: request.origin.city,
      destination: request.destination.city,
      weight: request.weight,
      courier: request.courier,
    });

    // Simulate API delay
    await this.simulateDelay(800, 2000);

    const results: ShippingCostOption[] = [];
    const couriers = request.courier ? [request.courier] : Object.keys(this.courierServices);

    for (const courier of couriers) {
      if (this.courierServices[courier as keyof typeof this.courierServices]) {
        const services = this.courierServices[courier as keyof typeof this.courierServices];

        for (const service of services) {
          const cost = this.calculateShippingCost(
            request.origin,
            request.destination,
            request.weight,
            service.baseRate
          );

          const estimatedDays = this.calculateEstimatedDays(
            request.origin,
            request.destination,
            service.service
          );

          results.push({
            courier: courier.toUpperCase(),
            service: service.service,
            description: service.description,
            cost,
            estimatedDays,
            note: this.generateServiceNote(courier, service.service),
          });
        }
      }
    }

    const response: ShippingCostResponse = {
      results,
      origin: request.origin,
      destination: request.destination,
      weight: request.weight,
    };

    logger.info('Mock RajaOngkir: Shipping cost calculated', {
      optionsCount: results.length,
      cheapestCost: results.length > 0 ? Math.min(...results.map(r => r.cost)) : 0,
      fastestDays:
        results.length > 0
          ? Math.min(...results.map(r => parseInt(r.estimatedDays.split('-')[0] || '1')))
          : 1,
    });

    return response;
  }

  /**
   * Track package by tracking number
   */
  async trackPackage(request: TrackingRequest): Promise<TrackingResponse> {
    logger.info('Mock RajaOngkir: Tracking package', {
      trackingNumber: request.trackingNumber,
      courier: request.courier,
    });

    // Simulate API delay
    await this.simulateDelay(500, 1500);

    const status = this.simulateTrackingStatus();
    const history = this.generateTrackingHistory(status);

    const response: TrackingResponse = {
      trackingNumber: request.trackingNumber,
      courier: request.courier.toUpperCase(),
      status,
      currentLocation: history[0]?.location,
      estimatedDelivery: this.calculateEstimatedDelivery(status),
      history,
    };

    logger.info('Mock RajaOngkir: Package tracking result', {
      trackingNumber: request.trackingNumber,
      status,
      historyCount: history.length,
    });

    return response;
  }

  /**
   * Get provinces
   */
  async getProvinces(): Promise<ProvinceData[]> {
    logger.info('Mock RajaOngkir: Getting provinces');

    // Simulate API delay
    await this.simulateDelay(200, 500);

    return this.provinces;
  }

  /**
   * Get cities by province
   */
  async getCities(provinceId?: string): Promise<CityData[]> {
    logger.info('Mock RajaOngkir: Getting cities', { provinceId });

    // Simulate API delay
    await this.simulateDelay(300, 800);

    if (provinceId) {
      return this.cities.filter(city => city.provinceId === provinceId);
    }

    return this.cities;
  }

  /**
   * Get supported couriers
   */
  getSupportedCouriers(): Array<{ code: string; name: string; description: string }> {
    return [
      { code: 'jne', name: 'JNE', description: 'Jalur Nugraha Ekakurir' },
      { code: 'pos', name: 'POS Indonesia', description: 'Pos Indonesia' },
      { code: 'tiki', name: 'TIKI', description: 'Citra Van Titipan Kilat' },
      { code: 'sicepat', name: 'SiCepat', description: 'SiCepat Ekspres' },
      { code: 'jnt', name: 'J&T', description: 'J&T Express' },
    ];
  }

  /**
   * Validate address
   */
  async validateAddress(address: {
    city: string;
    province: string;
    postalCode?: string;
  }): Promise<{ valid: boolean; suggestions?: CityData[]; errors: string[] }> {
    logger.info('Mock RajaOngkir: Validating address', address);

    // Simulate API delay
    await this.simulateDelay(200, 600);

    const errors: string[] = [];
    let suggestions: CityData[] = [];

    // Find exact match
    const exactMatch = this.cities.find(
      city =>
        city.cityName.toLowerCase().includes(address.city.toLowerCase()) &&
        city.province.toLowerCase().includes(address.province.toLowerCase())
    );

    if (exactMatch) {
      if (address.postalCode && address.postalCode !== exactMatch.postalCode) {
        errors.push(`Postal code mismatch. Expected: ${exactMatch.postalCode}`);
      }
      return { valid: true, errors };
    }

    // Find suggestions
    suggestions = this.cities
      .filter(
        city =>
          city.cityName.toLowerCase().includes(address.city.toLowerCase()) ||
          city.province.toLowerCase().includes(address.province.toLowerCase())
      )
      .slice(0, 5);

    if (suggestions.length === 0) {
      errors.push('City or province not found');
    } else {
      errors.push('Exact address not found, see suggestions');
    }

    return {
      valid: false,
      suggestions,
      errors,
    };
  }

  // Private helper methods

  private async simulateDelay(minMs: number = 200, maxMs: number = 1000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private calculateShippingCost(
    origin: ShippingOrigin,
    destination: ShippingDestination,
    weight: number,
    baseRate: number
  ): number {
    // Base cost calculation
    let baseCost = 15000; // Base cost 15k IDR

    // Weight factor (per 100g)
    const weightFactor = Math.ceil(weight / 100) * 2000;

    // Distance factor (simplified)
    const distanceFactor = this.calculateDistanceFactor(origin, destination);

    // Apply rate multiplier
    const totalCost = (baseCost + weightFactor + distanceFactor) * baseRate;

    return Math.round(totalCost);
  }

  private calculateDistanceFactor(
    origin: ShippingOrigin,
    destination: ShippingDestination
  ): number {
    // Simplified distance calculation based on provinces
    if (origin.province === destination.province) {
      return 5000; // Same province
    }

    const javaProvinces = [
      'DKI Jakarta',
      'Jawa Barat',
      'Jawa Tengah',
      'Jawa Timur',
      'DI Yogyakarta',
      'Banten',
    ];
    const isOriginJava = javaProvinces.includes(origin.province);
    const isDestinationJava = javaProvinces.includes(destination.province);

    if (isOriginJava && isDestinationJava) {
      return 10000; // Within Java
    }

    if (isOriginJava || isDestinationJava) {
      return 25000; // Java to other islands
    }

    return 35000; // Between other islands
  }

  private calculateEstimatedDays(
    origin: ShippingOrigin,
    destination: ShippingDestination,
    service: string
  ): string {
    let baseDays = 1;

    // Distance factor
    if (origin.province !== destination.province) {
      baseDays += 1;
    }

    const javaProvinces = [
      'DKI Jakarta',
      'Jawa Barat',
      'Jawa Tengah',
      'Jawa Timur',
      'DI Yogyakarta',
      'Banten',
    ];
    const isOriginJava = javaProvinces.includes(origin.province);
    const isDestinationJava = javaProvinces.includes(destination.province);

    if (!isOriginJava || !isDestinationJava) {
      baseDays += 2;
    }

    // Service factor
    switch (service.toLowerCase()) {
      case 'yes':
      case 'ons':
      case 'express next day':
        baseDays = Math.max(1, baseDays - 1);
        break;
      case 'oke':
      case 'eco':
      case 'ez':
        baseDays += 1;
        break;
    }

    const maxDays = baseDays + 1;
    return `${baseDays}-${maxDays}`;
  }

  private generateServiceNote(courier: string, service: string): string {
    const notes: Record<string, Record<string, string>> = {
      jne: {
        YES: 'Garansi uang kembali jika tidak sampai sesuai estimasi',
        REG: 'Layanan reguler dengan jangkauan seluruh Indonesia',
        OKE: 'Layanan ekonomis dengan estimasi lebih lama',
      },
      pos: {
        'Express Next Day': 'Pengiriman express dengan garansi sampai esok hari',
        'Pos Kilat Khusus': 'Layanan kilat dengan tarif terjangkau',
      },
      tiki: {
        ONS: 'Jaminan sampai esok hari untuk kota-kota besar',
        REG: 'Layanan reguler ke seluruh Indonesia',
        ECO: 'Layanan ekonomis dengan estimasi lebih lama',
      },
    };

    return notes[courier]?.[service] || 'Layanan pengiriman standar';
  }

  private simulateTrackingStatus(): 'pending' | 'in_transit' | 'delivered' | 'returned' {
    const random = Math.random();
    if (random < 0.2) return 'pending';
    if (random < 0.7) return 'in_transit';
    if (random < 0.95) return 'delivered';
    return 'returned';
  }

  private generateTrackingHistory(status: string): TrackingHistory[] {
    const history: TrackingHistory[] = [];
    const now = new Date();

    // Generate history based on status
    switch (status) {
      case 'pending':
        history.push({
          date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          description: 'Paket diterima di kantor pusat',
          location: 'Jakarta Pusat',
        });
        break;

      case 'in_transit':
        history.push({
          date: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          description: 'Paket diterima di kantor pusat',
          location: 'Jakarta Pusat',
        });
        history.push({
          date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          description: 'Paket dalam perjalanan ke kota tujuan',
          location: 'Bandung',
        });
        history.push({
          date: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
          description: 'Paket tiba di kantor cabang',
          location: 'Bandung Timur',
        });
        break;

      case 'delivered':
        history.push({
          date: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          description: 'Paket diterima di kantor pusat',
          location: 'Jakarta Pusat',
        });
        history.push({
          date: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          description: 'Paket dalam perjalanan ke kota tujuan',
          location: 'Bandung',
        });
        history.push({
          date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          description: 'Paket tiba di kantor cabang',
          location: 'Bandung Timur',
        });
        history.push({
          date: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
          description: 'Paket sedang dikirim ke alamat tujuan',
          location: 'Bandung Timur',
        });
        history.push({
          date: now.toISOString(),
          description: 'Paket telah diterima oleh penerima',
          location: 'Alamat Tujuan',
        });
        break;

      case 'returned':
        history.push({
          date: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
          description: 'Paket diterima di kantor pusat',
          location: 'Jakarta Pusat',
        });
        history.push({
          date: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          description: 'Paket dalam perjalanan ke kota tujuan',
          location: 'Bandung',
        });
        history.push({
          date: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          description: 'Gagal dikirim - alamat tidak ditemukan',
          location: 'Bandung Timur',
        });
        history.push({
          date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          description: 'Paket dikembalikan ke pengirim',
          location: 'Jakarta Pusat',
        });
        break;
    }

    return history.reverse(); // Most recent first
  }

  private calculateEstimatedDelivery(status: string): string {
    const now = new Date();

    switch (status) {
      case 'pending':
        return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';
      case 'in_transit':
        return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';
      case 'delivered':
        return 'Delivered';
      case 'returned':
        return 'Returned to sender';
      default:
        return 'Unknown';
    }
  }
}
