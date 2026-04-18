
import axios from 'axios';
import { config } from '../config/env';

export interface SmsPayload {
  to: string | string[];
  message: string;
  from?: string;
}

export const smsService = {
  /**
   * Formats phone numbers to international standard (+254...)
   */
  formatPhone(phone: string): string {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, '');
    
    // Handle 07... or 01... format
    if (clean.startsWith('0')) {
      clean = '254' + clean.substring(1);
    } 
    // Handle 7... or 1... format
    else if ((clean.startsWith('7') || clean.startsWith('1')) && clean.length === 9) {
      clean = '254' + clean;
    }
    
    // Ensure it has the + prefix
    return clean.startsWith('+') ? clean : '+' + clean;
  },

  /**
   * Sends SMS via Africa's Talking Gateway
   */
  async sendSms(payload: SmsPayload, customCreds?: { username: string; apiKey: string }) {
    const username = customCreds?.username || config.SMS.AT_USERNAME;
    const apiKey = customCreds?.apiKey || config.SMS.AT_API_KEY;

    if (!username || !apiKey) {
      throw new Error('SMS Gateway credentials are not configured.');
    }

    const url = 'https://api.africastalking.com/version1/messaging';
    
    // Ensure 'to' is a comma-separated string if it's an array
    const recipients = Array.isArray(payload.to) 
      ? payload.to.map(this.formatPhone).join(',') 
      : this.formatPhone(payload.to);

    const body = new URLSearchParams();
    body.append('username', username);
    body.append('to', recipients);
    body.append('message', payload.message);
    if (payload.from) {
      body.append('from', payload.from);
    }

    try {
      const response = await axios.post(url, body.toString(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': apiKey
        }
      });

      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.errorMessage || error.message;
      console.error('Africa\'s Talking API Error:', errorMsg);
      throw new Error(`Gateway Error: ${errorMsg}`);
    }
  }
};
