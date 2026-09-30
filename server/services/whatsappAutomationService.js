import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session Data Directory to persist WhatsApp Web login state across server restarts
const SESSION_DATA_DIR = path.join(__dirname, '../whatsapp_session_data');
const REMOTE_DEBUGGING_PORT = 9222;
const REMOTE_DEBUGGING_URL = `http://127.0.0.1:${REMOTE_DEBUGGING_PORT}`;

if (!fs.existsSync(SESSION_DATA_DIR)) {
  fs.mkdirSync(SESSION_DATA_DIR, { recursive: true });
}

// Global Guard: Catch and suppress internal Playwright CDP protocol dialog race condition errors
// to prevent Node.js process termination when WhatsApp Web dialogs open/close rapidly.
process.on('unhandledRejection', (reason) => {
  if (reason && (reason.message?.includes('Page.handleJavaScriptDialog') || (reason.name === 'ProtocolError' && reason.method === 'Page.handleJavaScriptDialog'))) {
    console.warn('[WhatsAppAutomation] Suppressed transient Playwright CDP Dialog ProtocolError:', reason.message);
    return;
  }
});

/**
 * Format Date to DD/MM/YYYY
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
 * Generate Exact Marathi Absent Alert Text
 */
export const generateAbsentMessageText = ({ studentName, date, subject, classTime, absentSubjectsList }) => {
  const formattedDate = formatDateDDMMYYYY(date);

  let absentLines = '';
  if (Array.isArray(absentSubjectsList) && absentSubjectsList.length > 0) {
    const canonicalMap = new Map();
    for (const item of absentSubjectsList) {
      let sName = (item.subject || 'Subject').trim();
      if (sName.toLowerCase() === 'math' || sName.toLowerCase() === 'mathematics') {
        sName = 'Mathematics';
      }
      const key = sName.toLowerCase();
      if (!canonicalMap.has(key)) {
        canonicalMap.set(key, {
          subject: sName,
          classTime: item.classTime || 'Class Time'
        });
      }
    }
    absentLines = Array.from(canonicalMap.values())
      .map(item => `• *${item.subject}* - ${item.classTime}`)
      .join('\n');
  } else {
    const timeStr = classTime || 'Class Time';
    let subjName = (subject || 'Mathematics').trim();
    if (subjName.toLowerCase() === 'math' || subjName.toLowerCase() === 'mathematics') {
      subjName = 'Mathematics';
    }
    absentLines = `• *${subjName}* - ${timeStr}`;
  }

  return `*ABSENT ALERT*

Student: *${studentName}*

Date: *${formattedDate}*

Absent Subjects:
${absentLines}

*कृपया गैरहजेरीचे कारण पालकांनी अंकात नोंदवावे:*

1 आजारी होता./ आजारी होती.

2 काही काम होते.

3 मला माहित नाही.

4 इतर.

*Unique Classes, Nilanga*`;
};

/**
 * Check WhatsApp Web Login Status
 * Returns WHATSAPP_CONNECTED, WHATSAPP_QR_REQUIRED, or WHATSAPP_NOT_CONNECTED
 */
let activeBrowserContext = null;
let launchPromise = null;

/**
 * Remove stale Chromium lock files if present in SESSION_DATA_DIR
 */
const cleanSessionLockFiles = () => {
  try {
    const lockNames = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'lockfile', 'Preferences.lock'];
    const items = [
      ...lockNames.map(f => path.join(SESSION_DATA_DIR, f)),
      ...lockNames.map(f => path.join(SESSION_DATA_DIR, 'Default', f))
    ];
    for (const itemPath of items) {
      if (fs.existsSync(itemPath)) {
        try {
          fs.unlinkSync(itemPath);
          console.log(`Removed stale Chromium lock file: ${itemPath}`);
        } catch (e) {
          // File locked by active process, ignore error
        }
      }
    }
  } catch (err) {
    console.error('Error cleaning session lock files:', err);
  }
};

/**
 * Forcefully terminate any orphaned Chrome or Chromium process locking SESSION_DATA_DIR
 */
const killStaleChromeProcess = () => {
  return new Promise((resolve) => {
    exec('taskkill /F /FI "COMMANDLINE eq *whatsapp_session_data*" /T', () => {
      exec('wmic process where "commandline like \'%whatsapp_session_data%\'" call terminate', () => {
        resolve();
      });
    });
  });
};

/**
 * Helper to get or launch a single active persistent browser context.
 * Uses CDP to connect to running Chrome or launches persistent context cleanly.
 */
const getOrLaunchPersistentContext = async () => {
  if (activeBrowserContext) {
    try {
      const pages = activeBrowserContext.pages();
      if (pages && pages.length > 0) {
        return activeBrowserContext;
      }
    } catch (e) {
      activeBrowserContext = null;
    }
  }

  // Mutex lock: If a browser launch is already in progress, wait for it
  if (launchPromise) {
    console.log('Browser launch in progress, awaiting existing launch promise...');
    return await launchPromise;
  }

  launchPromise = (async () => {
    // 1. Try attaching to existing running Chrome/Chromium instance via CDP
    try {
      const cdpBrowser = await chromium.connectOverCDP(REMOTE_DEBUGGING_URL, { timeout: 1500 });
      const contexts = cdpBrowser.contexts();
      if (contexts && contexts.length > 0) {
        activeBrowserContext = contexts[0];
        console.log('Connected to existing running WhatsApp Web browser via CDP.');
        return activeBrowserContext;
      }
    } catch (cdpErr) {
      // CDP not active, proceed to fresh launch
    }

    // 2. Fresh launch
    try {
      cleanSessionLockFiles();

      activeBrowserContext = await chromium.launchPersistentContext(SESSION_DATA_DIR, {
        channel: 'chrome',
        headless: false, // Visible window on screen
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        args: [
          `--remote-debugging-port=${REMOTE_DEBUGGING_PORT}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      activeBrowserContext.on('close', () => {
        console.log('WhatsApp Web browser context closed.');
        activeBrowserContext = null;
      });

      return activeBrowserContext;
    } catch (err) {
      activeBrowserContext = null;

      // Handle ProcessSingleton profile lock error by terminating stale orphaned process
      if (err.message && (err.message.includes('ProcessSingleton') || err.message.includes('profile directory') || err.message.includes('0x20'))) {
        console.warn('ProcessSingleton lock detected. Terminating stale Chrome process and retrying...');
        await killStaleChromeProcess();
        cleanSessionLockFiles();
        await new Promise(r => setTimeout(r, 2000));

        try {
          activeBrowserContext = await chromium.launchPersistentContext(SESSION_DATA_DIR, {
            channel: 'chrome',
            headless: false,
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            args: [
              `--remote-debugging-port=${REMOTE_DEBUGGING_PORT}`,
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-blink-features=AutomationControlled'
            ]
          });
          activeBrowserContext.on('close', () => {
            activeBrowserContext = null;
          });
          return activeBrowserContext;
        } catch (retryErr) {
          activeBrowserContext = null;
          throw retryErr;
        }
      }
      throw err;
    } finally {
      launchPromise = null;
    }
  })();

  return await launchPromise;
};

/**
 * Get or create a single active page in the browser context.
 * Closes any extra blank tabs to guarantee strictly ONE WhatsApp Web tab/window.
 */
const getOrCreateSinglePage = async (context) => {
  const pages = context.pages().filter(p => !p.isClosed());
  if (pages.length === 0) {
    return await context.newPage();
  }
  const mainPage = pages[0];
  for (let i = 1; i < pages.length; i++) {
    await pages[i].close().catch(() => {});
  }
  return mainPage;
};

/**
 * Check WhatsApp Web Login Status
 * Returns WHATSAPP_CONNECTED, WHATSAPP_QR_REQUIRED, or WHATSAPP_NOT_CONNECTED
 */
export const getWhatsAppWebStatus = async () => {
  try {
    const context = await getOrLaunchPersistentContext();
    const page = await getOrCreateSinglePage(context);

    if (!page.url().includes('web.whatsapp.com')) {
      await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded', timeout: 25000 });
    }

    try {
      await page.waitForSelector('canvas, #pane-side, div[data-ref]', { timeout: 10000 });
    } catch (e) {}

    const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
    const isPaneLoaded = await page.evaluate(() => !!document.querySelector('#pane-side') || !!document.querySelector('div[data-tab="3"]'));

    if (isPaneLoaded) {
      return {
        success: true,
        status: 'WHATSAPP_CONNECTED',
        isConnected: true,
        message: 'WhatsApp Web is connected and authenticated.'
      };
    } else if (hasCanvas) {
      return {
        success: true,
        status: 'WHATSAPP_QR_REQUIRED',
        isConnected: false,
        message: 'WhatsApp Web is not connected. Please scan the QR code first.'
      };
    } else {
      return {
        success: false,
        status: 'WHATSAPP_NOT_CONNECTED',
        isConnected: false,
        message: 'WhatsApp Web connection status could not be verified.'
      };
    }
  } catch (err) {
    console.error('Error checking WhatsApp Web status:', err);
    return {
      success: false,
      status: 'WHATSAPP_NOT_CONNECTED',
      isConnected: false,
      message: err.message || 'WhatsApp Web status check failed.'
    };
  }
};

/**
 * Launch WhatsApp Web QR Code Scanning Window for User Setup
 * Opens Chromium window on screen, waits for user to scan QR code, and saves session in SESSION_DATA_DIR.
 */
export const launchWhatsAppQRScanWindow = async () => {
  try {
    const context = await getOrLaunchPersistentContext();
    const page = await getOrCreateSinglePage(context);

    await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.bringToFront().catch(() => {});

    // Wait up to 120 seconds for user to scan QR code and reach main chat pane
    await page.waitForSelector('#pane-side, div[data-tab="3"]', { timeout: 120000 });

    await page.waitForTimeout(3000); // Allow cookies/tokens to settle

    return {
      success: true,
      status: 'WHATSAPP_CONNECTED',
      message: 'WhatsApp Web login successful! Session saved.'
    };
  } catch (err) {
    console.error('Error in launchWhatsAppQRScanWindow:', err);
    return {
      success: false,
      status: 'WHATSAPP_NOT_CONNECTED',
      message: 'QR scan timeout or window closed before authentication.'
    };
  }
};

let isAutomationRunning = false;

/**
 * Perform Server-Side WhatsApp Web Browser Automation via Playwright
 * Processes ALL absent students sequentially using ONE single WhatsApp Web browser page.
 * Shows final status only after all messages in the batch are processed.
 */
export const processWhatsAppWebAutomation = async ({ absentees, date, subject, classTime }) => {
  if (isAutomationRunning) {
    return {
      success: false,
      code: 'AUTOMATION_IN_PROGRESS',
      status: 'WHATSAPP_CONNECTED',
      total: absentees.length,
      sent: 0,
      failed: absentees.length,
      message: 'WhatsApp automation is already in progress. Please wait for current batch to finish.',
      results: absentees.map(s => ({
        studentId: s.studentDbId || s.id,
        studentName: s.studentName || s.full_name,
        phone: s.phone || s.mobile || s.whatsapp_number || 'N/A',
        status: 'FAILED',
        errorReason: 'Automation already in progress'
      }))
    };
  }

  isAutomationRunning = true;

  try {
    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    // Step 1: Initialize single shared persistent browser context & page ONCE for batch
    const context = await getOrLaunchPersistentContext();
    const page = await getOrCreateSinglePage(context);

    page.on('dialog', async dialog => {
      try {
        await dialog.accept();
      } catch (e) {}
    });

    await page.bringToFront().catch(() => {});

    // Ensure WhatsApp Web is loaded
    if (!page.url().includes('web.whatsapp.com')) {
      await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    try {
      await page.waitForSelector('canvas, #pane-side, div[data-tab="3"]', { timeout: 15000 });
    } catch (e) {}

    const isPaneLoaded = await page.evaluate(() => !!document.querySelector('#pane-side') || !!document.querySelector('div[data-tab="3"]'));

    if (!isPaneLoaded) {
      return {
        success: false,
        code: 'WHATSAPP_QR_REQUIRED',
        status: 'WHATSAPP_NOT_CONNECTED',
        total: absentees.length,
        sent: 0,
        failed: absentees.length,
        message: 'WhatsApp Web is not connected. Please scan the QR code first.',
        results: absentees.map(s => ({
          studentId: s.studentDbId || s.id,
          studentName: s.studentName || s.full_name,
          phone: s.phone || s.mobile || s.whatsapp_number || 'N/A',
          status: 'FAILED',
          errorReason: 'WhatsApp Web is not connected. Please scan the QR code first.'
        }))
      };
    }

    // Step 2: Process each absent student sequentially using the SAME single page
    for (const std of absentees) {
      const studentId = std.studentDbId || std.id;
      const studentName = std.studentName || std.full_name || 'Student';
      const phoneRaw = (std.whatsapp_number || std.mobile || std.phone || '').trim();
      const cleanDigits = phoneRaw.replace(/\D/g, '');
      const formattedPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

      if (!formattedPhone || formattedPhone.length < 10) {
        failedCount++;
        results.push({
          studentId,
          studentName,
          phone: phoneRaw || 'N/A',
          status: 'FAILED',
          errorReason: 'Invalid registered phone number'
        });
        continue;
      }

      const messageText = generateAbsentMessageText({
        studentName,
        date,
        subject,
        classTime,
        absentSubjectsList: std.absentSubjectsList
      });

      const targetUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}`;

      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch((navErr) => {
          console.warn(`Navigation notice for ${formattedPhone}:`, navErr.message);
        });

        // 1. Wait until "Starting chat..." spinner modal finishes loading
        try {
          await page.waitForFunction(() => {
            const popups = document.querySelectorAll('div[data-animate-modal-popup="true"]');
            for (const popup of popups) {
              const txt = popup.innerText || '';
              if (txt.includes('Starting chat')) return false; // Still starting chat
            }
            return true;
          }, { timeout: 25000 });
        } catch (e) {}

        // 2. Check if phone number is invalid
        let isInvalidNumber = false;
        try {
          const invalidPopup = await page.$('div[data-animate-modal-popup="true"]');
          if (invalidPopup) {
            const popupText = await invalidPopup.innerText();
            if (popupText.includes('invalid') || popupText.includes('not on WhatsApp')) {
              isInvalidNumber = true;
            }
          }
        } catch (tErr) {}

        if (isInvalidNumber) {
          failedCount++;
          results.push({
            studentId,
            studentName,
            phone: phoneRaw,
            formattedPhone,
            messageText,
            status: 'FAILED',
            errorReason: 'Phone number not registered on WhatsApp'
          });
          continue;
        }

        // 3. Wait for chat input box to appear
        const textBoxSelector = 'footer div[contenteditable="true"], div[contenteditable="true"][data-tab="10"]';
        let textBoxFound = false;
        try {
          await page.waitForSelector(textBoxSelector, { timeout: 15000 });
          textBoxFound = true;
        } catch (e) {
          textBoxFound = false;
        }

        if (!textBoxFound) {
          failedCount++;
          results.push({
            studentId,
            studentName,
            phone: phoneRaw,
            formattedPhone,
            messageText,
            status: 'FAILED',
            errorReason: 'Chat input box not found'
          });
          continue;
        }

        // Clear chat box and insert clean multiline formatted text using Clipboard paste & Shift+Enter keyboard fallback
        const textBox = await page.$('footer div[contenteditable="true"], div[contenteditable="true"][data-tab="10"]');
        if (textBox) {
          await textBox.focus();

          // Try native Lexical paste event first
          const isPasted = await page.evaluate(({ txt }) => {
            const box = document.querySelector('footer div[contenteditable="true"]') || document.querySelector('div[contenteditable="true"][data-tab="10"]');
            if (!box) return false;

            box.focus();
            try {
              document.execCommand('selectAll', false, null);
              document.execCommand('delete', false, null);
            } catch (e) {}
            box.innerText = '';
            box.innerHTML = '';

            const dt = new DataTransfer();
            dt.setData('text/plain', txt);
            const pasteEvent = new ClipboardEvent('paste', {
              clipboardData: dt,
              bubbles: true,
              cancelable: true
            });
            box.dispatchEvent(pasteEvent);

            const hasText = (box.innerText || '').includes('ABSENT ALERT');
            return hasText;
          }, { txt: messageText });

          // Fallback: If ClipboardEvent was not processed by Lexical, type line by line with Shift+Enter
          if (!isPasted) {
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(200);

            const lines = messageText.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i]) {
                await page.keyboard.insertText(lines[i]);
              }
              if (i < lines.length - 1) {
                await page.keyboard.down('Shift');
                await page.keyboard.press('Enter');
                await page.keyboard.up('Shift');
              }
            }
          }
        }

        await page.waitForTimeout(800);

        // 4. Capture baseline chat message count BEFORE clicking Send
        const preSendCount = await page.evaluate(() => {
          return document.querySelectorAll('div[data-id], div[role="row"], div.message-out').length;
        });

        // 5. Click Send button or press Enter
        let isClickExecuted = false;
        try {
          const sendBtnClicked = await page.evaluate(() => {
            const btn = document.querySelector('button[aria-label="Send"]') 
              || document.querySelector('button span[data-icon="send"]')?.parentElement 
              || document.querySelector('span[data-icon="send"]')?.parentElement 
              || document.querySelector('span[data-icon="wds-ic-send-filled"]')?.closest('button') 
              || document.querySelector('button span[data-icon="wds-ic-send-filled"]')?.parentElement;
            if (btn) {
              btn.click();
              return true;
            }
            return false;
          });

          if (sendBtnClicked) {
            isClickExecuted = true;
          } else {
            const textBox = await page.$('div[contenteditable="true"][data-tab="10"]') || await page.$('footer div[contenteditable="true"]');
            if (textBox) {
              await textBox.focus();
              await page.keyboard.press('Enter');
              isClickExecuted = true;
            }
          }
        } catch (clickErr) {
          console.error(`Send button click error for ${studentName}:`, clickErr);
        }

        // 6. Mandatory Post-Send Verification: Ensure new message actually renders in chat history
        let isConfirmedSent = false;
        if (isClickExecuted) {
          for (let attempt = 0; attempt < 8; attempt++) {
            await page.waitForTimeout(1000);

            const verified = await page.evaluate(({ preCount, name }) => {
              const box = document.querySelector('div[contenteditable="true"][data-tab="10"]') || document.querySelector('footer div[contenteditable="true"]');
              const isCleared = box ? (!box.innerText.includes('ABSENT ALERT') && box.innerText.trim().length < 20) : true;

              const allMsgRows = Array.from(document.querySelectorAll('div[data-id], div[role="row"], div.message-out'));
              const newMsgAdded = allMsgRows.length > preCount;

              const hasSpecificMsg = allMsgRows.some(m => {
                const txt = m.innerText || '';
                return txt.includes(name) || txt.includes('ABSENT ALERT');
              });

              return isCleared && (newMsgAdded || hasSpecificMsg);
            }, { preCount: preSendCount, name: studentName });

            if (verified) {
              isConfirmedSent = true;
              break;
            }
          }
        }

        if (isConfirmedSent) {
          sentCount++;
          results.push({
            studentId,
            studentName,
            phone: phoneRaw,
            formattedPhone,
            messageText,
            status: 'AUTOMATED_SENT',
            message: 'Message automatically typed, sent, and verified in WhatsApp Web chat'
          });
        } else {
          failedCount++;
          results.push({
            studentId,
            studentName,
            phone: phoneRaw,
            formattedPhone,
            messageText,
            status: 'FAILED',
            errorReason: isClickExecuted 
              ? 'Post-send verification failed: Message did not render in WhatsApp Web chat history' 
              : 'Automation timeout: Send button not clickable'
          });
        }
      } catch (stErr) {
        console.error(`Automation error for student ${studentName}:`, stErr);
        failedCount++;
        results.push({
          studentId,
          studentName,
          phone: phoneRaw,
          formattedPhone,
          messageText,
          status: 'FAILED',
          errorReason: stErr.message || 'Automation timeout/failure'
        });
      }
    }

    // Keep WhatsApp Web main chat view active on the single page
    await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded' }).catch(() => {});

    return {
      success: sentCount > 0,
      code: sentCount > 0 ? 'AUTOMATION_SUCCESS' : 'AUTOMATION_FAILED',
      status: 'WHATSAPP_CONNECTED',
      total: absentees.length,
      sent: sentCount,
      failed: failedCount,
      message: `WhatsApp Web automation completed. ${sentCount} sent, ${failedCount} failed.`,
      results
    };
  } catch (globalErr) {
    console.error('Global Playwright WhatsApp Automation Exception:', globalErr);
    return {
      success: false,
      code: 'AUTOMATION_ERROR',
      status: 'WHATSAPP_NOT_CONNECTED',
      total: absentees.length,
      sent: 0,
      failed: absentees.length,
      message: globalErr.message || 'Global automation server error.',
      results: []
    };
  } finally {
    isAutomationRunning = false;
  }
};
