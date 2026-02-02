import axios from 'axios';
import { config } from '../config/env';

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export const getAccessToken = async (): Promise<string> => {
  const auth = Buffer.from(`${config.MPESA.CONSUMER_KEY}:${config.MPESA.CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data.access_token;
};

export const initiateStkPush = async (phone: string, amount: number, accountReference: string): Promise<StkPushResponse> => {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${config.MPESA.SHORTCODE}${config.MPESA.PASSKEY}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: config.MPESA.SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: config.MPESA.SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: config.MPESA.CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: 'Fee Payment'
  };

  const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/query', payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data as StkPushResponse;
};