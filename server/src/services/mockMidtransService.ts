import { logger } from '../config/logger';

export interface MidtransPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
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
  paymentType?: string;
}

export interface MidtransPaymentResponse {
  transactionId: string;
  orderId: string;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  currency: string;
  paymentType: string;
  redirectUrl?: string;
  qrCode?: string;
  virtualAccount?: string;
  expiryTime?: Date;
  gatewayResponse: Record<string, any>;
}

export interface MidtransCallbackData {
  transactionId: string;
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  paymentType: string;
  signatureKey: string;
  rawResponse: Record<string, any>;
}

export class MockMidtransService {
  private readonly serverKey: string;
  private readonly clientKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || 'mock_server_key';
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY || 'mock_client_key';
    this.baseUrl = process.env.MIDTRANS_BASE_URL || 'https://api.sandbox.midtrans.com/v2';
  }

  /**
   * Create payment transaction
   */
  async createPayment(paymentRequest: MidtransPaymentRequest): Promise<MidtransPaymentResponse> {
    logger.info('Mock Midtrans: Creating payment transaction', {
      orderId: paymentRequest.orderId,
      amount: paymentRequest.amount,
    });

    // Simulate API delay
    await this.simulateDelay(500, 1500);

    // Generate mock transaction ID
    const transactionId = this.generateTransactionId();

    // Simulate different payment outcomes
    const status = this.simulatePaymentStatus();

    const response: MidtransPaymentResponse = {
      transactionId,
      orderId: paymentRequest.orderId,
      status,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      paymentType: paymentRequest.paymentType || 'bank_transfer',
      gatewayResponse: {
        transactionId,
        orderId: paymentRequest.orderId,
        grossAmount: paymentRequest.amount,
        currency: paymentRequest.currency,
        paymentType: paymentRequest.paymentType || 'bank_transfer',
        transactionTime: new Date().toISOString(),
        transactionStatus: status,
        mockResponse: true,
      },
    };

    // Add payment-specific details
    switch (paymentRequest.paymentType) {
      case 'bank_transfer':
        response.virtualAccount = this.generateVirtualAccount();
        response.expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'qris':
        response.qrCode = this.generateQRCode();
        response.expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        break;
      case 'credit_card':
        response.redirectUrl = `${this.baseUrl}/payment/${transactionId}`;
        break;
      case 'gopay':
        response.redirectUrl = `gojek://gopay/payment/${transactionId}`;
        response.qrCode = this.generateQRCode();
        response.expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        break;
      default:
        response.virtualAccount = this.generateVirtualAccount();
        response.expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    logger.info('Mock Midtrans: Payment created', {
      transactionId,
      status,
      paymentType: response.paymentType,
    });

    return response;
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<MidtransPaymentResponse> {
    logger.info('Mock Midtrans: Getting payment status', { transactionId });

    // Simulate API delay
    await this.simulateDelay(200, 800);

    // Extract order ID from transaction ID (mock logic)
    const orderIdParts = transactionId.replace('TXN-', '').split('-');
    const orderId = orderIdParts[0] || 'unknown';

    const status = this.simulatePaymentStatus();

    const response: MidtransPaymentResponse = {
      transactionId,
      orderId,
      status,
      amount: 100000, // Mock amount
      currency: 'IDR',
      paymentType: 'bank_transfer',
      gatewayResponse: {
        transactionId,
        orderId,
        grossAmount: 100000,
        currency: 'IDR',
        paymentType: 'bank_transfer',
        transactionTime: new Date().toISOString(),
        transactionStatus: status,
        mockResponse: true,
      },
    };

    logger.info('Mock Midtrans: Payment status retrieved', { transactionId, status });

    return response;
  }

  /**
   * Cancel payment
   */
  async cancelPayment(transactionId: string): Promise<{ success: boolean; message: string }> {
    logger.info('Mock Midtrans: Cancelling payment', { transactionId });

    // Simulate API delay
    await this.simulateDelay(300, 1000);

    // Simulate cancellation success/failure
    const success = Math.random() > 0.1; // 90% success rate

    const result = {
      success,
      message: success ? 'Payment cancelled successfully' : 'Failed to cancel payment',
    };

    logger.info('Mock Midtrans: Payment cancellation result', { transactionId, success });

    return result;
  }

  /**
   * Verify callback signature
   */
  verifyCallback(callbackData: MidtransCallbackData): boolean {
    logger.info('Mock Midtrans: Verifying callback signature', {
      transactionId: callbackData.transactionId,
    });

    // In real implementation, this would verify the signature using server key
    // For mock, we'll just check if signature key exists
    const isValid = Boolean(callbackData.signatureKey && callbackData.signatureKey.length > 0);

    logger.info('Mock Midtrans: Callback verification result', {
      transactionId: callbackData.transactionId,
      isValid,
    });

    return isValid;
  }

  /**
   * Process callback notification
   */
  async processCallback(callbackData: Record<string, any>): Promise<MidtransCallbackData> {
    logger.info('Mock Midtrans: Processing callback', {
      transactionId: callbackData.transaction_id,
    });

    // Simulate processing delay
    await this.simulateDelay(100, 500);

    const processedCallback: MidtransCallbackData = {
      transactionId: callbackData.transaction_id || 'unknown',
      orderId: callbackData.order_id || 'unknown',
      status: this.mapMidtransStatus(callbackData.transaction_status),
      amount: parseFloat(callbackData.gross_amount || '0'),
      paymentType: callbackData.payment_type || 'unknown',
      signatureKey: callbackData.signature_key || 'mock_signature',
      rawResponse: callbackData,
    };

    logger.info('Mock Midtrans: Callback processed', {
      transactionId: processedCallback.transactionId,
      status: processedCallback.status,
    });

    return processedCallback;
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): Array<{ code: string; name: string; description: string }> {
    return [
      {
        code: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Transfer via Virtual Account',
      },
      {
        code: 'credit_card',
        name: 'Credit Card',
        description: 'Visa, Mastercard, JCB',
      },
      {
        code: 'qris',
        name: 'QRIS',
        description: 'Scan QR Code with any e-wallet',
      },
      {
        code: 'gopay',
        name: 'GoPay',
        description: 'GoPay e-wallet',
      },
      {
        code: 'shopeepay',
        name: 'ShopeePay',
        description: 'ShopeePay e-wallet',
      },
      {
        code: 'ovo',
        name: 'OVO',
        description: 'OVO e-wallet',
      },
    ];
  }

  // Private helper methods

  private async simulateDelay(minMs: number = 200, maxMs: number = 1000): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  private generateVirtualAccount(): string {
    const bankCode = '014'; // BCA
    const random = Math.floor(Math.random() * 9000000000) + 1000000000;
    return `${bankCode}${random}`;
  }

  private generateQRCode(): string {
    // In real implementation, this would be a base64 image or URL
    const random = Math.random().toString(36).substring(2, 15);
    return `data:image/png;base64,mock_qr_code_${random}`;
  }

  private simulatePaymentStatus(): 'pending' | 'success' | 'failed' {
    const random = Math.random();
    if (random < 0.7) return 'pending'; // 70% pending
    if (random < 0.95) return 'success'; // 25% success
    return 'failed'; // 5% failed
  }

  private mapMidtransStatus(
    midtransStatus: string
  ): 'pending' | 'success' | 'failed' | 'cancelled' {
    switch (midtransStatus) {
      case 'capture':
      case 'settlement':
        return 'success';
      case 'pending':
        return 'pending';
      case 'deny':
      case 'cancel':
      case 'expire':
        return 'failed';
      case 'refund':
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}
