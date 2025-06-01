# Raja Ongkir Shipping API Documentation

## Overview

This document outlines the Raja Ongkir shipping service integration for the Dagangan e-commerce platform. The current implementation uses a **mock service** that simulates real Raja Ongkir API behavior for development and testing purposes.

## Mock Service Configuration

```typescript
// Environment Variables
RAJAONGKIR_API_KEY=mock_api_key
RAJAONGKIR_BASE_URL=https://api.rajaongkir.com/starter
```

## Supported Couriers

| Courier Code | Courier Name  | Description             | Services                           |
| ------------ | ------------- | ----------------------- | ---------------------------------- |
| `jne`        | JNE           | Jalur Nugraha Ekakurir  | OKE, REG, YES                      |
| `pos`        | POS Indonesia | Pos Indonesia           | Pos Kilat Khusus, Express Next Day |
| `tiki`       | TIKI          | Citra Van Titipan Kilat | ECO, REG, ONS                      |
| `sicepat`    | SiCepat       | SiCepat Ekspres         | REG, BEST                          |
| `jnt`        | J&T Express   | J&T Express             | EZ, REG                            |

## API Endpoints

### 1. Calculate Shipping Cost

**Method:** `POST`  
**Endpoint:** `/api/shipping/cost`

#### Request Schema

```typescript
interface ShippingCostRequest {
  origin: {
    city: string;
    province: string;
    postalCode?: string;
  };
  destination: {
    city: string;
    province: string;
    postalCode: string;
  };
  weight: number; // in grams (max 30,000g = 30kg)
  courier?: string; // optional, if not specified returns all couriers
}
```

#### Response Schema

```typescript
interface ShippingCostResponse {
  results: ShippingCostOption[];
  origin: ShippingOrigin;
  destination: ShippingDestination;
  weight: number;
}

interface ShippingCostOption {
  courier: string;
  service: string;
  description: string;
  cost: number;
  estimatedDays: string;
  note?: string;
}
```

#### Example Request

```json
{
  "origin": {
    "city": "Jakarta Pusat",
    "province": "DKI Jakarta",
    "postalCode": "10540"
  },
  "destination": {
    "city": "Bandung",
    "province": "Jawa Barat",
    "postalCode": "40112"
  },
  "weight": 1000,
  "courier": "jne"
}
```

#### Example Response

```json
{
  "results": [
    {
      "courier": "JNE",
      "service": "OKE",
      "description": "Ongkos Kirim Ekonomis",
      "cost": 18000,
      "estimatedDays": "2-3",
      "note": "Layanan ekonomis dengan estimasi lebih lama"
    },
    {
      "courier": "JNE",
      "service": "REG",
      "description": "Layanan Reguler",
      "cost": 22000,
      "estimatedDays": "1-2",
      "note": "Layanan reguler dengan jangkauan seluruh Indonesia"
    },
    {
      "courier": "JNE",
      "service": "YES",
      "description": "Yakin Esok Sampai",
      "cost": 35000,
      "estimatedDays": "1-1",
      "note": "Garansi uang kembali jika tidak sampai sesuai estimasi"
    }
  ],
  "origin": {
    "city": "Jakarta Pusat",
    "province": "DKI Jakarta",
    "postalCode": "10540"
  },
  "destination": {
    "city": "Bandung",
    "province": "Jawa Barat",
    "postalCode": "40112"
  },
  "weight": 1000
}
```

### 2. Track Package

**Method:** `GET`  
**Endpoint:** `/api/shipping/track/{trackingNumber}`

#### Query Parameters

- `courier` (required): Courier code (jne, pos, tiki, sicepat, jnt)

#### Response Schema

```typescript
interface TrackingResponse {
  trackingNumber: string;
  courier: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'returned';
  currentLocation?: string;
  estimatedDelivery?: string;
  history: TrackingHistory[];
}

interface TrackingHistory {
  date: string;
  description: string;
  location?: string;
}
```

#### Example Request

```
GET /api/shipping/track/JNE1701234567ABC?courier=jne
```

#### Example Response

```json
{
  "trackingNumber": "JNE1701234567ABC",
  "courier": "JNE",
  "status": "in_transit",
  "currentLocation": "Bandung Timur",
  "estimatedDelivery": "2024-12-02",
  "history": [
    {
      "date": "2024-12-01T06:00:00.000Z",
      "description": "Paket diterima di kantor pusat",
      "location": "Jakarta Pusat"
    },
    {
      "date": "2024-12-01T10:00:00.000Z",
      "description": "Paket dalam perjalanan ke kota tujuan",
      "location": "Bandung"
    },
    {
      "date": "2024-12-01T13:00:00.000Z",
      "description": "Paket tiba di kantor cabang",
      "location": "Bandung Timur"
    }
  ]
}
```

### 3. Get Provinces

**Method:** `GET`  
**Endpoint:** `/api/shipping/provinces`

#### Response Schema

```typescript
interface ProvinceData {
  provinceId: string;
  province: string;
}
```

#### Example Response

```json
[
  {
    "provinceId": "6",
    "province": "DKI Jakarta"
  },
  {
    "provinceId": "9",
    "province": "Jawa Barat"
  },
  {
    "provinceId": "10",
    "province": "Jawa Tengah"
  }
]
```

### 4. Get Cities

**Method:** `GET`  
**Endpoint:** `/api/shipping/cities`

#### Query Parameters

- `provinceId` (optional): Filter cities by province ID

#### Response Schema

```typescript
interface CityData {
  cityId: string;
  provinceId: string;
  province: string;
  type: string;
  cityName: string;
  postalCode: string;
}
```

#### Example Response

```json
[
  {
    "cityId": "40",
    "provinceId": "6",
    "province": "DKI Jakarta",
    "type": "Kota",
    "cityName": "Jakarta Pusat",
    "postalCode": "10540"
  },
  {
    "cityId": "78",
    "provinceId": "9",
    "province": "Jawa Barat",
    "type": "Kota",
    "cityName": "Bandung",
    "postalCode": "40112"
  }
]
```

### 5. Validate Address

**Method:** `POST`  
**Endpoint:** `/api/shipping/validate-address`

#### Request Schema

```typescript
interface ValidateAddressRequest {
  city: string;
  province: string;
  postalCode?: string;
}
```

#### Response Schema

```typescript
interface ValidateAddressResponse {
  valid: boolean;
  suggestions?: CityData[];
  errors: string[];
}
```

#### Example Request

```json
{
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "10540"
}
```

#### Example Response

```json
{
  "valid": true,
  "errors": []
}
```

### 6. Get Supported Couriers

**Method:** `GET`  
**Endpoint:** `/api/shipping/couriers`

#### Response Schema

```json
[
  {
    "code": "jne",
    "name": "JNE",
    "description": "Jalur Nugraha Ekakurir"
  },
  {
    "code": "pos",
    "name": "POS Indonesia",
    "description": "Pos Indonesia"
  },
  {
    "code": "tiki",
    "name": "TIKI",
    "description": "Citra Van Titipan Kilat"
  }
]
```

## Shipping Cost Calculation

### Cost Factors

The mock service calculates shipping costs based on:

1. **Base Cost**: 15,000 IDR
2. **Weight Factor**: 2,000 IDR per 100g
3. **Distance Factor**:
   - Same province: +5,000 IDR
   - Within Java: +10,000 IDR
   - Java to other islands: +25,000 IDR
   - Between other islands: +35,000 IDR
4. **Service Rate Multiplier**:
   - Economy services (OKE, ECO, EZ): 0.7-0.8x
   - Regular services (REG): 1.0x
   - Express services (YES, ONS, Express): 1.5-1.8x

### Estimated Delivery Days

Base delivery calculation:

- Same province: 1 day
- Different provinces: +1 day
- Outside Java: +2 days
- Service adjustments:
  - Express: -1 day (minimum 1 day)
  - Economy: +1 day

## Package Tracking

### Tracking Number Formats

| Courier | Format                   | Example          |
| ------- | ------------------------ | ---------------- |
| JNE     | Alphanumeric 10-15 chars | JNE1701234567ABC |
| POS     | Alphanumeric 8-20 chars  | POS20241201XYZ   |
| TIKI    | Numeric 10-15 chars      | 1701234567890    |
| SiCepat | Alphanumeric 10-20 chars | SC2024120112345  |
| J&T     | Numeric 10-15 chars      | 8901234567890    |

### Tracking Status Flow

1. **pending**: Package received at origin facility
2. **in_transit**: Package in transit to destination
3. **delivered**: Package delivered to recipient
4. **returned**: Package returned to sender

### Mock Tracking Simulation

The mock service randomly assigns tracking statuses:

- **20%** chance: `pending`
- **50%** chance: `in_transit`
- **25%** chance: `delivered`
- **5%** chance: `returned`

## Indonesian Address System

### Supported Provinces (Simplified List)

The mock service includes major Indonesian provinces:

- DKI Jakarta
- Jawa Barat, Jawa Tengah, Jawa Timur
- DI Yogyakarta, Banten
- Sumatera Utara, Sumatera Barat, Sumatera Selatan
- Kalimantan Barat, Kalimantan Timur, Kalimantan Selatan
- Sulawesi Utara, Sulawesi Selatan
- Bali, Papua, and others

### Postal Code Validation

Indonesian postal codes are 5-digit numbers:

- Format: `\d{5}`
- Example: `40112` (Bandung)

## Mock Behavior

### API Response Delays

Simulated delays to mimic real API behavior:

- Shipping cost calculation: 800-2000ms
- Package tracking: 500-1500ms
- Province/city data: 200-800ms
- Address validation: 200-600ms

### Rate Limiting

Mock service simulates rate limits:

- **60 requests/minute** per API key for cost calculation
- **120 requests/minute** per API key for tracking
- **200 requests/minute** per API key for location data

## Error Handling

### Common Error Responses

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}
```

### Error Scenarios

| Scenario            | HTTP Status | Error Code      | Message                               |
| ------------------- | ----------- | --------------- | ------------------------------------- |
| Invalid weight      | 400         | INVALID_WEIGHT  | Weight must be between 1g and 30,000g |
| Unsupported courier | 400         | INVALID_COURIER | Courier not supported                 |
| Invalid address     | 400         | INVALID_ADDRESS | Address validation failed             |
| Tracking not found  | 404         | NOT_FOUND       | Tracking number not found             |
| Rate limit exceeded | 429         | RATE_LIMIT      | API rate limit exceeded               |

## Integration Examples

### Calculate Shipping Options

```typescript
// Get all courier options
const shippingOptions = await rajaOngkirService.getShippingCost({
  origin: {
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
  },
  destination: {
    city: 'Bandung',
    province: 'Jawa Barat',
    postalCode: '40112',
  },
  weight: 1000,
});

// Get specific courier option
const jneOptions = await rajaOngkirService.getShippingCost({
  // ... same parameters
  courier: 'jne',
});
```

### Track Package

```typescript
const trackingInfo = await rajaOngkirService.trackPackage({
  trackingNumber: 'JNE1701234567ABC',
  courier: 'jne',
});

console.log(`Status: ${trackingInfo.status}`);
console.log(`Current Location: ${trackingInfo.currentLocation}`);
```

### Validate Address

```typescript
const validation = await rajaOngkirService.validateAddress({
  city: 'Jakarta',
  province: 'DKI Jakarta',
  postalCode: '10540',
});

if (!validation.valid) {
  console.log('Errors:', validation.errors);
  console.log('Suggestions:', validation.suggestions);
}
```

## Production Migration

### Switching to Real Raja Ongkir API

1. **Update Environment Variables**

   ```bash
   RAJAONGKIR_API_KEY=your_real_api_key
   RAJAONGKIR_BASE_URL=https://api.rajaongkir.com/starter
   ```

2. **Replace Mock Service**

   - Replace `MockRajaOngkirService` with real HTTP client
   - Update method implementations
   - Keep the same interface for minimal code changes

3. **API Plan Considerations**
   - **Starter Plan**: Basic cost calculation and tracking
   - **Basic Plan**: Extended features and higher limits
   - **Pro Plan**: Advanced features and premium support

### Security Considerations

- **API Key Protection**: Secure API key storage and rotation
- **HTTPS Only**: All API calls must use HTTPS
- **Request Validation**: Validate all input data before API calls
- **Error Handling**: Implement proper error handling and retries

### Performance Optimization

- **Caching**: Cache province/city data (rarely changes)
- **Request Batching**: Batch multiple cost calculations when possible
- **Async Processing**: Use async/await for all API calls
- **Connection Pooling**: Reuse HTTP connections

## Testing

Use the mock service for:

- Development environment testing
- Cost calculation simulations
- Tracking flow demonstrations
- Address validation testing
- Load testing without API costs

## Monitoring

Track key metrics:

- API response times
- Success/failure rates
- Cost calculation accuracy
- Tracking update frequency
- Address validation success rate

## Support

For questions about this implementation:

- Check the mock service logs for detailed operation tracking
- Review shipping validation schemas in `shippingValidators.ts`
- Consult Raja Ongkir official documentation for production features
- Monitor service status and maintenance schedules
