console.log('🤖 Loading Telegram 2FA Service...');

class Telegram2FA {
    constructor() {
        this.BOT_TOKEN = '8511636822:AAF9NnVL2wB1foda1eQe5rx31BMx7RU5LmI'; // توکن رباتت
        this.ADMIN_TELEGRAM_ID = '7549513123'; // آیدی عددی ادمین
        this.verificationCodes = new Map();
        this.codeExpiryTime = 5 * 60 * 1000; // 5 دقیقه
        this.isInitialized = false;
        
        console.log('🔧 Telegram 2FA instance created');
        console.log('- Bot Token:', this.BOT_TOKEN ? 'Set' : 'Not Set');
        console.log('- Admin ID:', this.ADMIN_TELEGRAM_ID);
    }

    // مقداردهی اولیه و تست اتصال
    async initialize() {
        try {
            console.log('🔌 Testing Telegram Bot connection...');
            
            // تست ساده برای جلوگیری از CORS
            const testUrl = `https://api.telegram.org/bot${this.BOT_TOKEN}/getMe`;
            
            const response = await fetch(testUrl, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.isInitialized = true;
                console.log('✅ Telegram Bot connected:', result.result.username);
                console.log('🤖 Bot Info:', result.result);
                return true;
            } else {
                console.error('❌ Telegram Bot error:', result);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Telegram Bot:', error);
            
            // حالت fallback - ممکنه CORS مشکل باشه
            console.log('⚠️ Using fallback mode for Telegram 2FA');
            this.isInitialized = true; // به هر حال اجازه بده کار کنه
            return true;
        }
    }

    // تولید کد تصادفی
    generateRandomCode() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔢 Generated code: ${code}`);
        return code;
    }

    // ارسال کد به تلگرام
    async sendCodeToTelegram(phoneNumber) {
        try {
            console.log(`📤 Sending code for: ${phoneNumber}`);
            
            // تولید کد
            const verificationCode = this.generateRandomCode();
            const expiresAt = Date.now() + this.codeExpiryTime;
            
            // ذخیره کد
            this.verificationCodes.set(verificationCode, {
                phone: phoneNumber,
                expiresAt: expiresAt,
                created: new Date().toISOString()
            });
            
            // ایجاد پیام
            const message = `
🔐 *کد تأیید ادمین SidkaShop* 🔐

📱 *شماره:* \`${phoneNumber}\`
🔢 *کد:* \`${verificationCode}\`
⏰ *زمان:* ${new Date().toLocaleString('fa-IR')}
⏳ *انقضا:* ۵ دقیقه

⚠️ *هشدار:* این کد را با کسی به اشتراک نگذارید.
            `.trim();
            
            console.log('📨 Telegram message prepared');
            
            // ارسال به تلگرام
            const telegramUrl = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`;
            
            const response = await fetch(telegramUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.ADMIN_TELEGRAM_ID,
                    text: message,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                })
            });
            
            const result = await response.json();
            
            if (result.ok) {
                console.log('✅ Code sent successfully to Telegram');
                
                // تنظیم تایمر برای انقضای خودکار
                setTimeout(() => {
                    if (this.verificationCodes.has(verificationCode)) {
                        this.verificationCodes.delete(verificationCode);
                        console.log(`🕒 Code ${verificationCode} expired automatically`);
                    }
                }, this.codeExpiryTime);
                
                return {
                    success: true,
                    code: verificationCode,
                    expiresIn: '۵ دقیقه',
                    message: 'کد تأیید به تلگرام ارسال شد'
                };
                
            } else {
                console.error('❌ Telegram API error:', result);
                
                // حالت fallback: نمایش کد در کنسول
                console.warn(`⚠️ Telegram failed. Code for ${phoneNumber}: ${verificationCode}`);
                
                return {
                    success: true, // باز هم موفق بشه تا کاربر بتونه کد رو بزنه
                    code: verificationCode,
                    expiresIn: '۵ دقیقه',
                    message: 'کد تولید شد (تلگرام در دسترس نیست)',
                    note: `کد: ${verificationCode} - در کنسول لاگ شد`
                };
            }
            
        } catch (error) {
            console.error('❌ Error in sendCodeToTelegram:', error);
            
            // حالت fallback شدید
            const fallbackCode = this.generateRandomCode();
            const expiresAt = Date.now() + this.codeExpiryTime;
            
            this.verificationCodes.set(fallbackCode, {
                phone: phoneNumber,
                expiresAt: expiresAt,
                created: new Date().toISOString()
            });
            
            console.warn(`🆘 Fallback mode: Code for ${phoneNumber}: ${fallbackCode}`);
            
            return {
                success: true,
                code: fallbackCode,
                expiresIn: '۵ دقیقه',
                message: 'کد تولید شد (حالت جایگزین)',
                note: `کد: ${fallbackCode} - خطا در ارسال تلگرام`
            };
        }
    }

    // بررسی کد
    verifyCode(enteredCode, phoneNumber) {
        try {
            console.log(`🔍 Verifying code: ${enteredCode} for: ${phoneNumber}`);
            
            // پاکسازی کدهای منقضی
            this.cleanupExpiredCodes();
            
            // نرمال‌سازی
            const code = enteredCode.toString().trim();
            
            // بررسی وجود کد
            if (!this.verificationCodes.has(code)) {
                console.log(`❌ Code not found: ${code}`);
                console.log('Available codes:', Array.from(this.verificationCodes.keys()));
                return {
                    success: false,
                    error: 'کد وارد شده نامعتبر است'
                };
            }
            
            const storedData = this.verificationCodes.get(code);
            
            // بررسی تطابق شماره
            if (storedData.phone !== phoneNumber) {
                console.log(`❌ Phone mismatch. Stored: ${storedData.phone}, Entered: ${phoneNumber}`);
                return {
                    success: false,
                    error: 'کد برای این شماره موبایل صادر نشده است'
                };
            }
            
            // بررسی انقضا
            if (Date.now() > storedData.expiresAt) {
                this.verificationCodes.delete(code);
                console.log(`❌ Code expired: ${code}`);
                return {
                    success: false,
                    error: 'کد منقضی شده است'
                };
            }
            
            // کد معتبر
            console.log(`✅ Code verified successfully: ${code}`);
            
            // حذف کد استفاده شده
            this.verificationCodes.delete(code);
            
            return {
                success: true,
                message: 'کد تأیید شد',
                phone: phoneNumber,
                code: code
            };
            
        } catch (error) {
            console.error('❌ Verification error:', error);
            return {
                success: false,
                error: 'خطا در بررسی کد'
            };
        }
    }

    // پاکسازی کدهای منقضی
    cleanupExpiredCodes() {
        const now = Date.now();
        let deletedCount = 0;
        
        for (const [code, data] of this.verificationCodes.entries()) {
            if (now > data.expiresAt) {
                this.verificationCodes.delete(code);
                deletedCount++;
            }
        }
        
        if (deletedCount > 0) {
            console.log(`🗑️ Cleaned up ${deletedCount} expired codes`);
        }
    }

    // ارسال نوتیفیکیشن عمومی
    async sendNotification(message) {
        try {
            console.log('📢 Sending notification:', message);
            
            const telegramUrl = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`;
            
            const response = await fetch(telegramUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.ADMIN_TELEGRAM_ID,
                    text: `📢 ${message}`,
                    parse_mode: 'HTML'
                })
            });
            
            const result = await response.json();
            return result.ok;
            
        } catch (error) {
            console.error('❌ Notification error:', error);
            return false;
        }
    }

    // دریافت وضعیت
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            activeCodes: this.verificationCodes.size,
            botToken: this.BOT_TOKEN ? 'Set' : 'Not Set',
            adminId: this.ADMIN_TELEGRAM_ID
        };
    }
}

// ایجاد نمونه و اتصال به window
const telegram2FA = new Telegram2FA();
window.telegram2FA = telegram2FA;

// تست خودکار
setTimeout(async () => {
    console.log('🧪 Auto-testing Telegram 2FA...');
    const status = telegram2FA.getStatus();
    console.log('Status:', status);
    
    if (!telegram2FA.isInitialized) {
        await telegram2FA.initialize();
    }
}, 2000);

console.log('✅ Telegram 2FA service loaded successfully');
