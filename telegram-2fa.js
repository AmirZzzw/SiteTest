console.log('🔐 Loading Secure Telegram 2FA Service...');

class SecureTelegram2FA {
    constructor() {
        this.BOT_TOKEN = '8511636822:AAF9NnVL2wB1foda1eQe5rx31BMx7RU5LmI';
        this.ADMIN_TELEGRAM_ID = '7549513123';
        this.verificationCodes = new Map();
        this.codeExpiryTime = 5 * 60 * 1000; // 5 دقیقه
        this.maxAttempts = 3;
        this.failedAttempts = new Map();
        
        console.log('🛡️ Secure Telegram 2FA initialized');
    }

    async initialize() {
        try {
            console.log('🔗 Testing Telegram Bot connection...');
            
            const testUrl = `https://api.telegram.org/bot${this.BOT_TOKEN}/getMe`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                console.log('✅ Telegram Bot connected successfully');
                console.log('🤖 Bot:', result.result.first_name, `(@${result.result.username})`);
                return true;
            } else {
                throw new Error(result.description || 'Unknown error');
            }
            
        } catch (error) {
            console.error('❌ Telegram Bot connection failed:', error.message);
            throw new Error('امکان اتصال به سرویس امنیتی وجود ندارد');
        }
    }

    generateSecureCode() {
        // تولید کد امن تصادفی
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // اضافه کردن پیچیدگی بیشتر
        const timestamp = Date.now();
        const hash = this.hashCode(code + timestamp);
        
        return {
            code: code,
            hash: hash,
            created: new Date().toISOString()
        };
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    async sendCodeToTelegram(phoneNumber) {
        try {
            console.log(`🔒 Generating secure code for: ${phoneNumber}`);
            
            // چک تعداد تلاش‌های قبلی
            const attempts = this.failedAttempts.get(phoneNumber) || 0;
            if (attempts >= this.maxAttempts) {
                throw new Error('تعداد تلاش‌های ناموفق بیش از حد مجاز');
            }
            
            // تولید کد امن
            const secureCode = this.generateSecureCode();
            const expiresAt = Date.now() + this.codeExpiryTime;
            
            // ذخیره کد با اطلاعات امنیتی
            this.verificationCodes.set(secureCode.code, {
                phone: phoneNumber,
                hash: secureCode.hash,
                expiresAt: expiresAt,
                created: secureCode.created,
                attempts: 0
            });
            
            console.log(`✅ Secure code generated for ${phoneNumber}`);
            
            // ارسال کد به تلگرام
            const message = `
🔐 *کد تأیید دو مرحله‌ای - SidkaShop Admin* 🔐

📱 *شماره موبایل:* \`${phoneNumber}\`
🔢 *کد امنیتی:* \`${secureCode.code}\`
⏰ *زمان تولید:* ${new Date().toLocaleString('fa-IR')}
⏳ *مدت اعتبار:* ۵ دقیقه

⚠️ *هشدار امنیتی:*
• این کد را با هیچکس به اشتراک نگذارید
• کد تنها یک بار معتبر است
• پس از ۵ دقیقه منقضی می‌شود
• در صورت دریافت نکردن کد، دکمه "ارسال مجدد" را بزنید
            `.trim();
            
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
                console.log('✅ Secure code sent to Telegram successfully');
                
                // تایمر پاکسازی خودکار
                setTimeout(() => {
                    if (this.verificationCodes.has(secureCode.code)) {
                        this.verificationCodes.delete(secureCode.code);
                        console.log(`🕒 Code ${secureCode.code} expired and removed`);
                    }
                }, this.codeExpiryTime);
                
                return {
                    success: true,
                    code: secureCode.code,
                    expiresIn: '۵ دقیقه',
                    message: 'کد امنیتی به تلگرام شما ارسال شد',
                    sentToTelegram: true,
                    timestamp: secureCode.created
                };
                
            } else {
                console.error('❌ Telegram API error:', result.description);
                
                // حذف کد چون ارسال نشد
                this.verificationCodes.delete(secureCode.code);
                
                throw new Error('ارسال کد به تلگرام ناموفق بود');
            }
            
        } catch (error) {
            console.error('❌ Secure code generation failed:', error);
            
            // افزایش تعداد تلاش‌های ناموفق
            const currentAttempts = this.failedAttempts.get(phoneNumber) || 0;
            this.failedAttempts.set(phoneNumber, currentAttempts + 1);
            
            return {
                success: false,
                error: 'خطا در تولید کد امنیتی',
                details: error.message,
                attempts: currentAttempts + 1,
                maxAttempts: this.maxAttempts
            };
        }
    }

    verifyCode(enteredCode, phoneNumber) {
        try {
            console.log(`🔍 Verifying code for: ${phoneNumber}`);
            
            // پاکسازی کدهای منقضی
            this.cleanupExpiredCodes();
            
            const code = enteredCode.toString().trim();
            
            // بررسی طول کد
            if (code.length !== 6 || !/^\d+$/.test(code)) {
                return {
                    success: false,
                    error: 'کد باید ۶ رقم عددی باشد',
                    securityLevel: 'high'
                };
            }
            
            // بررسی وجود کد
            if (!this.verificationCodes.has(code)) {
                console.log(`❌ Invalid code attempt: ${code}`);
                
                // لاگ تلاش ناموفق
                const attempts = this.failedAttempts.get(phoneNumber) || 0;
                this.failedAttempts.set(phoneNumber, attempts + 1);
                
                return {
                    success: false,
                    error: 'کد وارد شده نامعتبر است',
                    securityLevel: 'high',
                    remainingAttempts: this.maxAttempts - (attempts + 1)
                };
            }
            
            const storedData = this.verificationCodes.get(code);
            
            // بررسی تطابق شماره
            if (storedData.phone !== phoneNumber) {
                console.log(`🚨 Security alert: Phone mismatch for code ${code}`);
                
                return {
                    success: false,
                    error: 'کد برای این شماره موبایل صادر نشده است',
                    securityLevel: 'critical',
                    alert: true
                };
            }
            
            // بررسی انقضا
            if (Date.now() > storedData.expiresAt) {
                this.verificationCodes.delete(code);
                
                return {
                    success: false,
                    error: 'کد منقضی شده است',
                    securityLevel: 'medium'
                };
            }
            
            // بررسی تعداد تلاش‌ها
            if (storedData.attempts >= 2) {
                this.verificationCodes.delete(code);
                
                return {
                    success: false,
                    error: 'تعداد تلاش‌های ناموفق بیش از حد مجاز',
                    securityLevel: 'high',
                    locked: true
                };
            }
            
            // کد معتبر - تأیید موفق
            console.log(`✅ Code verified successfully for ${phoneNumber}`);
            
            // حذف کد پس از استفاده موفق
            this.verificationCodes.delete(code);
            
            // ریست کردن شمارشگر تلاش‌های ناموفق
            this.failedAttempts.delete(phoneNumber);
            
            return {
                success: true,
                message: 'کد با موفقیت تأیید شد',
                phone: phoneNumber,
                timestamp: new Date().toISOString(),
                securityLevel: 'verified'
            };
            
        } catch (error) {
            console.error('❌ Verification system error:', error);
            
            return {
                success: false,
                error: 'خطای سیستم تأیید',
                securityLevel: 'critical',
                systemError: true
            };
        }
    }

    cleanupExpiredCodes() {
        const now = Date.now();
        let removedCount = 0;
        
        for (const [code, data] of this.verificationCodes.entries()) {
            if (now > data.expiresAt) {
                this.verificationCodes.delete(code);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`🗑️ Cleaned up ${removedCount} expired codes`);
        }
    }

    getSecurityStatus() {
        return {
            activeCodes: this.verificationCodes.size,
            failedAttempts: Array.from(this.failedAttempts.entries()),
            maxAttempts: this.maxAttempts,
            codeExpiryMinutes: this.codeExpiryTime / 60000
        };
    }

    resetAttempts(phoneNumber) {
        this.failedAttempts.delete(phoneNumber);
        console.log(`🔄 Reset attempts for ${phoneNumber}`);
    }
}

// ایجاد نمونه و اتصال به window
const telegram2FA = new SecureTelegram2FA();
window.telegram2FA = telegram2FA;

// مقداردهی اولیه
telegram2FA.initialize().then(() => {
    console.log('🛡️ Secure Telegram 2FA ready for admin authentication');
}).catch(error => {
    console.error('❌ Failed to initialize secure 2FA:', error);
    // نمایش خطا به کاربر
    if (window.showNotification) {
        window.showNotification('سیستم امنیتی در دسترس نیست. لطفاً با پشتیبانی تماس بگیرید.', 'error');
    }
});

console.log('✅ Secure Telegram 2FA service loaded');
