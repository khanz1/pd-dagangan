# Midtrans Payment Gateway API Documentation

## Overview

This document outlines the Midtrans Payment Gateway integration for the Dagangan e-commerce platform. The current implementation uses a **mock service** that simulates real Midtrans API behavior for development and testing purposes.

## Mock Service Configuration

```typescript
// Environment Variables
MIDTRANS_SERVER_KEY=mock_server_key
MIDTRANS_CLIENT_KEY=mock_client_key
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com/v2
```

## Supported Payment Methods

| Payment Type  | Code            | Description           | Features              |
| ------------- | --------------- | --------------------- | --------------------- |
| Bank Transfer | `bank_transfer` | Virtual Account       | VA Number, 24h expiry |
| Credit Card   | `credit_card`   | Visa, Mastercard, JCB | Redirect URL          |
| QRIS          | `qris`          | QR Code Payment       | QR Code, 15min expiry |
| GoPay         | `gopay`         | GoPay E-wallet        | Deep link + QR Code   |
| ShopeePay     | `shopeepay`     | ShopeePay E-wallet    | Deep link + QR Code   |
| OVO           | `ovo`           | OVO E-wallet          | Deep link + QR Code   |

## API Endpoints

### 1. Create Payment Transaction

**Method:** `POST`  
**Endpoint:** `/api/payments/create`

#### Request Schema

```typescript
interface MidtransPaymentRequest {
  orderId: string;
  amount: number;
  currency: string; // Default: "IDR"
  paymentType?: string; // Default: "bank_transfer"
  customerDetails: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  itemDetails: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}
```

#### Response Schema

```typescript
interface MidtransPaymentResponse {
  transactionId: string;
  orderId: string;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  currency: string;
  paymentType: string;
  redirectUrl?: string; // For credit_card, gopay
  qrCode?: string; // For qris, gopay
  virtualAccount?: string; // For bank_transfer
  expiryTime?: Date;
  gatewayResponse: Record<string, any>;
}
```

#### Example Request

```json
{
  "orderId": "ORDER-20241201-001",
  "amount": 150000,
  "currency": "IDR",
  "paymentType": "qris",
  "customerDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+628123456789"
  },
  "itemDetails": [
    {
      "id": "PROD-001",
      "name": "Wireless Headphones",
      "price": 150000,
      "quantity": 1
    }
  ]
}
```

#### Example Response

```json
{
  "transactionId": "TXN-1701234567890-ABC123",
  "orderId": "ORDER-20241201-001",
  "status": "pending",
  "amount": 150000,
  "currency": "IDR",
  "paymentType": "qris",
  "qrCode": "data:image/png;base64,mock_qr_code_xyz789",
  "expiryTime": "2024-12-01T15:30:00.000Z",
  "gatewayResponse": {
    "transactionId": "TXN-1701234567890-ABC123",
    "orderId": "ORDER-20241201-001",
    "grossAmount": 150000,
    "currency": "IDR",
    "paymentType": "qris",
    "transactionTime": "2024-12-01T15:15:00.000Z",
    "transactionStatus": "pending",
    "mockResponse": true
  }
}
```

### 2. Get Payment Status

**Method:** `GET`  
**Endpoint:** `/api/payments/status/{transactionId}`

#### Response Schema

Same as `MidtransPaymentResponse` above.

### 3. Cancel Payment

**Method:** `POST`  
**Endpoint:** `/api/payments/cancel/{transactionId}`

#### Response Schema

```typescript
interface CancelResponse {
  success: boolean;
  message: string;
}
```

### 4. Payment Callback (Webhook)

**Method:** `POST`  
**Endpoint:** `/api/payments/callback/midtrans`

#### Callback Data Schema

```typescript
interface MidtransCallbackData {
  transactionId: string;
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  paymentType: string;
  signatureKey: string;
  rawResponse: Record<string, any>;
}
```

#### Example Callback Payload

```json
{
  "transaction_id": "TXN-1701234567890-ABC123",
  "order_id": "ORDER-20241201-001",
  "transaction_status": "settlement",
  "gross_amount": "150000.00",
  "payment_type": "qris",
  "signature_key": "mock_signature_key_12345",
  "fraud_status": "accept",
  "status_code": "200",
  "status_message": "Success, transaction is found",
  "transaction_time": "2024-12-01 15:15:00"
}
```

## Payment Flow Examples

### Bank Transfer Flow

1. **Create Payment** with `paymentType: "bank_transfer"`
2. **Receive** Virtual Account number
3. **Customer** transfers to VA within 24 hours
4. **Receive** callback when payment confirmed
5. **Update** order status to paid

### QRIS Flow

1. **Create Payment** with `paymentType: "qris"`
2. **Display** QR Code to customer
3. **Customer** scans with any e-wallet app
4. **Payment** expires in 15 minutes if not completed
5. **Receive** callback when payment confirmed

### E-wallet Flow (GoPay/ShopeePay/OVO)

1. **Create Payment** with specific e-wallet type
2. **Redirect** customer to e-wallet app via deep link
3. **Fallback** QR Code for manual scanning
4. **Receive** callback when payment confirmed

## Mock Behavior

### Payment Status Simulation

The mock service randomly assigns payment statuses:

- **70%** chance: `pending`
- **25%** chance: `success`
- **5%** chance: `failed`

### API Response Delays

Simulated delays to mimic real API behavior:

- Payment creation: 500-1500ms
- Status check: 200-800ms
- Cancellation: 300-1000ms
- Callback processing: 100-500ms

### Transaction ID Format

Mock transaction IDs follow the pattern:

```
TXN-{timestamp}-{randomString}
```

Example: `TXN-1701234567890-ABC123`

### Virtual Account Format

Mock virtual accounts use BCA bank code (014):

```
014{10-digit-random-number}
```

Example: `0141234567890`

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

| Scenario              | HTTP Status | Error Code           | Message                                          |
| --------------------- | ----------- | -------------------- | ------------------------------------------------ |
| Invalid amount        | 400         | INVALID_AMOUNT       | Amount must be between 1,000 and 999,999,999 IDR |
| Invalid payment type  | 400         | INVALID_PAYMENT_TYPE | Unsupported payment method                       |
| Transaction not found | 404         | NOT_FOUND            | Transaction not found                            |
| Expired transaction   | 400         | EXPIRED              | Transaction has expired                          |
| Invalid signature     | 401         | INVALID_SIGNATURE    | Callback signature validation failed             |

## Integration Notes

### Switching to Production

To switch from mock to real Midtrans integration:

1. **Update Environment Variables**

   ```bash
   MIDTRANS_SERVER_KEY=your_real_server_key
   MIDTRANS_CLIENT_KEY=your_real_client_key
   MIDTRANS_BASE_URL=https://api.midtrans.com/v2
   ```

2. **Replace Mock Service**

   - Replace `MockMidtransService` with real Midtrans SDK
   - Update method implementations
   - Keep the same interface for minimal code changes

3. **Callback URL Configuration**
   - Configure webhook URL in Midtrans dashboard
   - Ensure proper signature validation
   - Set up proper error handling

### Security Considerations

- **Signature Validation**: Always validate callback signatures in production
- **HTTPS Only**: Use HTTPS for all payment-related endpoints
- **Server Key Protection**: Never expose server key in client-side code
- **Callback Validation**: Verify callback origin and data integrity

### Testing

Use the mock service for:

- Development environment testing
- Unit and integration tests
- Payment flow demonstrations
- Load testing without actual transactions

## Rate Limits

Mock service simulates Midtrans rate limits:

- **100 requests/minute** per IP for payment creation
- **300 requests/minute** per IP for status checks
- **50 requests/minute** per IP for cancellations

## Support

For questions about this implementation:

- Check the mock service logs for detailed operation tracking
- Review payment validation schemas in `paymentValidators.ts`
- Consult Midtrans official documentation for production integration
