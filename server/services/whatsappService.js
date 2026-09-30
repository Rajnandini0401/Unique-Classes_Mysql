import dotenv from 'dotenv';
dotenv.config();

/**
 * Server-Side Automated WhatsApp Service
 * 
 * Supports:
 * 1. Meta Official WhatsApp Cloud API (Graph API)
 * 2. UltraMsg / Generic REST WhatsApp Gateway
 * 3. Fallback with clear configuration requirements
 */

/**
 * Format date to DD/MM/YYYY
 */
export const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    if (dateInput.includes('/')) return dateInput;
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(dateInput);
};

/**
 * Generate exact Marathi Absent Alert Message Text
 */
export const generateAbsentMessage = ({ studentName, date, subject, classTime }) => {
  const formattedDate = formatDateDDMMYYYY(date);
  const timeStr = classTime || '05:00 AM - 06:00 AM';
  const subjName = subject || 'Mathematics';

  return `*ABSENT ALERT*

Student: *${studentName}*
Date: *${formattedDate}*

Absent Subjects:
• *${subjName}* - ${timeStr}

*कृपया गैरहजेरीचे कारण पालकांनी अंकात नोंदवावे:*
1 आजारी होता./ आजारी होती.
2 काही काम होते.
3 मला माहित नाही.
4 इतर.

*Unique Classes, Nilanga*`;
};

/**
 * Send automated WhatsApp message via Meta Cloud API or UltraMsg Gateway
 */
export const sendAutomatedWhatsAppMessage = async ({ phone, studentName, date, subject, classTime }) => {
  const phoneRaw = (phone || '').trim();
  const cleanDigits = phoneRaw.replace(/\D/g, '');
  const formattedPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

  if (!formattedPhone || formattedPhone.length < 10) {
    return {
      success: false,
      status: 'FAILED',
      phone: phoneRaw || 'N/A',
      message: 'Invalid or missing parent mobile number.'
    };
  }

  const messageText = generateAbsentMessage({ studentName, date, subject, classTime });
  const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(messageText)}`;

  // 1. Check for Meta Official WhatsApp Cloud API Credentials
  const metaToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { preview_url: false, body: messageText }
        })
      });

      const data = await response.json();

      if (response.ok && data.messages && data.messages.length > 0) {
        return {
          success: true,
          status: 'AUTOMATED_SENT',
          mode: 'META_CLOUD_API',
          phone: phoneRaw,
          formattedPhone,
          messageText,
          waUrl,
          message: 'Message automatically sent via Meta WhatsApp Cloud API'
        };
      } else {
        console.warn('[Meta WhatsApp Cloud API Error]:', data);
        return {
          success: false,
          status: 'FAILED',
          mode: 'META_CLOUD_API',
          phone: phoneRaw,
          formattedPhone,
          messageText,
          waUrl,
          message: data.error?.message || 'Meta Cloud API error sending message.'
        };
      }
    } catch (err) {
      console.error('[Meta WhatsApp Cloud API Exception]:', err);
    }
  }

  // 2. Check for UltraMsg API Gateway Credentials
  const ultraInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultraToken = process.env.ULTRAMSG_TOKEN;

  if (ultraInstance && ultraToken) {
    try {
      const response = await fetch(`https://api.ultramsg.com/${ultraInstance}/messages/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          token: ultraToken,
          to: `+${formattedPhone}`,
          body: messageText
        })
      });

      const data = await response.json();

      if (data.sent === 'true' || data.id) {
        return {
          success: true,
          status: 'AUTOMATED_SENT',
          mode: 'ULTRAMSG_GATEWAY',
          phone: phoneRaw,
          formattedPhone,
          messageText,
          waUrl,
          message: 'Message automatically sent via UltraMsg Gateway'
        };
      } else {
        console.warn('[UltraMsg Gateway Error]:', data);
      }
    } catch (err) {
      console.error('[UltraMsg Gateway Exception]:', err);
    }
  }

  // 3. Fallback when credentials are not configured yet
  return {
    success: true, // Mark notice created
    status: 'PENDING_CONFIG',
    mode: 'PREFILLED_DEEPLINK',
    phone: phoneRaw,
    formattedPhone,
    messageText,
    waUrl,
    message: 'Pre-filled link generated. Set WHATSAPP_CLOUD_API_TOKEN in server/.env for 100% direct background sending.'
  };
};
