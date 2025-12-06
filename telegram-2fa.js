// telegram-2fa.js
console.log('🤖 Loading Telegram 2FA Service...');

class Telegram2FA {
    constructor() {
        this.BOT_TOKEN = '8511636822:AAF9NnVL2wB1foda1eQe5rx31BMx7RU5LmI'; // توکن رباتت رو اینجا بذار
        this.ADMIN_TELEGRAM_ID = '7549513123'; // آیدی عددی ادمین
        this.verificationCodes = new Map(); // {code: {phone, expiresAt}}
        this.codeExpiryTime = 5 * 60 * 1000; // 5 دقیقه
    }

    // تولید کد ۶ رقمی تصادفی
    generateRandomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // ارسال کد به تلگرام ادمین
    async sendCodeToTelegram(phoneNumber) {
        try {
            const verificationCode = this.generateRandomCode();
            const expiresAt = Date.now() + this.codeExpiryTime;
            
            // ذخیره کد
            this.verificationCodes.set(verificationCode, {
                phone: phoneNumber,
                expiresAt: expiresAt
            });

            // پیام به تلگرام
            const message = `🔐 کد ورود ادمین SidkaShop\n\n📱 شماره: ${phoneNumber}\n🔢 کد: ${verificationCode}\n⏰ زمان انقضا: ۵ دقیقه\n\n⚠️ این کد را با کسی به اشتراک نگذارید.`;
            
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.ADMIN_TELEGRAM_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const result = await response.json();
            
            if (result.ok) {
                console.log(`✅ Verification code sent to Telegram: ${verificationCode}`);
                return {
                    success: true,
                    code: verificationCode,
                    expiresIn: '۵ دقیقه'
                };
            } else {
                console.error('❌ Failed to send to Telegram:', result);
                return {
                    success: false,
                    error: 'خطا در ارسال کد به تلگرام'
                };
            }

        } catch (error) {
            console.error('❌ Telegram API error:', error);
            return {
                success: false,
                error: 'خطا در ارتباط با تلگرام'
            };
        }
    }

    // بررسی کد وارد شده
    verifyCode(enteredCode, phoneNumber) {
        try {
            // حذف کدهای منقضی شده
            this.cleanupExpiredCodes();
            
            const storedData = this.verificationCodes.get(enteredCode);
            
            if (!storedData) {
                return {
                    success: false,
                    error: 'کد وارد شده نامعتبر است'
                };
            }
            
            if (storedData.phone !== phoneNumber) {
                return {
                    success: false,
                    error: 'کد برای این شماره موبایل صادر نشده است'
                };
            }
            
            if (Date.now() > storedData.expiresAt) {
                this.verificationCodes.delete(enteredCode);
                return {
                    success: false,
                    error: 'کد منقضی شده است'
                };
            }
            
            // حذف کد بعد از استفاده
            this.verificationCodes.delete(enteredCode);
            
            return {
                success: true,
                message: 'کد تأیید شد'
            };
            
        } catch (error) {
            console.error('❌ Verification error:', error);
            return {
                success: false,
                error: 'خطا در بررسی کد'
            };
        }
    }

    // پاکسازی کدهای منقضی شده
    cleanupExpiredCodes() {
        const now = Date.now();
        for (const [code, data] of this.verificationCodes.entries()) {
            if (now > data.expiresAt) {
                this.verificationCodes.delete(code);
            }
        }
    }

    // ارسال نوتیفیکیشن به تلگرام (برای لاگ)
    async sendNotification(message) {
        try {
            await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`, {
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
        } catch (error) {
            console.error('❌ Notification error:', error);
        }
    }
}

// ایجاد نمونه و اتصال به window
const telegram2FA = new Telegram2FA();
window.telegram2FA = telegram2FA;
console.log('✅ Telegram 2FA service loaded');
