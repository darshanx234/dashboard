import axios from 'axios';

// Fast2SMS configuration
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';
const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via Fast2SMS
 * @param phone - 10-digit Indian phone number (without +91)
 * @param otp - 6-digit OTP code
 * @param purpose - Purpose of OTP (signup, login, etc.)
 * @returns Promise<boolean> - Success status
 */
export async function sendSMSOTP(
  phone: string,
  otp: string,
  purpose: string = 'verification'
): Promise<boolean> {
  try {
    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      console.error('Invalid phone number format:', phone);
      return false;
    }

    // Check if API key is configured
    if (!FAST2SMS_API_KEY) {
      console.error('Fast2SMS API key not configured');
      return false;
    }

    // Prepare message based on purpose
    let message = '';
    switch (purpose) {
      case 'signup':
        message = `Welcome to ShotsSpace! Your OTP for registration is ${otp}. Valid for 10 minutes. Do not share this code.`;
        break;
      case 'login':
        message = `Your ShotsSpace login OTP is ${otp}. Valid for 10 minutes. Do not share this code.`;
        break;
      case 'verification':
        message = `Your ShotsSpace verification OTP is ${otp}. Valid for 10 minutes.`;
        break;
      default:
        message = `Your ShotsSpace OTP is ${otp}. Valid for 10 minutes.`;
    }

    // Send SMS via Fast2SMS
    const response = await axios.post(
      FAST2SMS_API_URL,
      {
        route: 'v3',
        sender_id: 'SHOTS',
        message: message,
        language: 'english',
        flash: 0,
        numbers: phone,
      },
      {
        headers: {
          authorization: FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      }
    );

    // Check response
    if (response.data && response.data.return === true) {
      console.log('SMS sent successfully to:', phone);
      return true;
    } else {
      console.error('Fast2SMS API error:', response.data);
      return false;
    }
  } catch (error: any) {
    console.error('Error sending SMS:', error.message);
    if (error.response) {
      console.error('Fast2SMS error response:', error.response.data);
    }
    return false;
  }
}

/**
 * Validate Indian phone number format
 * @param phone - Phone number to validate
 * @returns boolean - Valid or not
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Format phone number for display
 * @param phone - 10-digit phone number
 * @returns Formatted phone number (e.g., +91 98765 43210)
 */
export function formatPhoneNumber(phone: string): string {
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
}
