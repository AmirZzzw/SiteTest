// telegram-2fa-complete.js - سیستم کامل تلگرام ۲FA
console.log('🔐 Loading Complete Telegram 2FA System...');

class CompleteTelegram2FA {
    constructor() {
        // توکن بات تلگرام
        this.BOT_TOKEN = '8511636822:AAF9NnVL2wB1foda1eQe5rx31BMx7RU5LmI';
        
        // آیدی ادمین در تلگرام
        this.ADMIN_TELEGRAM_ID = '7549513123';
        
        // ذخیره کدهای تأیید
        this.verificationCodes = new Map();
        
        // تنظیمات زمان انقضا (۱۰ دقیقه)
        this.CODE_EXPIRY_MS = 10 * 60 * 1000;
        
        // حداکثر تلاش
        this.MAX_ATTEMPTS = 5;
        this.attemptsCounter = new Map();
        
        console.log('🤖 Complete Telegram 2FA initialized');
    }

    // تولید کد ۶ رقمی امن
    generateVerificationCode() {
        // کد ۶ رقمی تصادفی
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // کد با فرمت قابل خواندن: XXX-XXX
        const formattedCode = code.substring(0, 3) + code.substring(3);
        
        return {
            raw: code,
            formatted: formattedCode,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.CODE_EXPIRY_MS,
            attempts: 0
        };
    }

    // ارسال کد به تلگرام ادمین
    async sendCodeToTelegram(phoneNumber) {
        try {
            console.log(`📤 Sending code to Telegram for: ${phoneNumber}`);
            
            // بررسی محدودیت تلاش
            const userAttempts = this.attemptsCounter.get(phoneNumber) || 0;
            if (userAttempts >= this.MAX_ATTEMPTS) {
                throw new Error('تعداد تلاش‌ها بیش از حد مجاز است. لطفاً دقایقی دیگر تلاش کنید.');
            }
            
            // تولید کد جدید
            const codeData = this.generateVerificationCode();
            
            // ذخیره کد در حافظه
            this.verificationCodes.set(codeData.raw, {
                phone: phoneNumber,
                expiresAt: codeData.expiresAt,
                createdAt: new Date().toISOString(),
                attempts: 0,
                verified: false
            });
            
            console.log(`✅ Generated code: ${codeData.formatted}`);
            
            // پیام برای ارسال به تلگرام
            const message = `
🚨 *کد تأیید دو مرحله‌ای* 🚨

📱 *شماره موبایل:* \`${phoneNumber}\`
🔢 *کد تأیید:* \`${codeData.formatted}\`
⏰ *اعتبار:* ۱۰ دقیقه
🕒 *زمان:* ${new Date().toLocaleString('fa-IR')}

⚠️ این کد را با کسی به اشتراک نگذارید.
📍 *منبع:* SidkaShop ادمین پنل
            `.trim();
            
            // URL تلگرام API
            const telegramUrl = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`;
            
            console.log('📡 Sending to Telegram...');
            
            // ارسال به تلگرام با timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            try {
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
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const result = await response.json();
                
                if (result.ok) {
                    console.log('✅ Telegram API success:', result.result.message_id);
                    
                    // افزایش شمارش تلاش
                    this.attemptsCounter.set(phoneNumber, userAttempts + 1);
                    
                    // تایمر پاکسازی خودکار کد
                    setTimeout(() => {
                        if (this.verificationCodes.has(codeData.raw)) {
                            this.verificationCodes.delete(codeData.raw);
                            console.log(`🕒 Code ${codeData.formatted} expired`);
                        }
                    }, this.CODE_EXPIRY_MS);
                    
                    return {
                        success: true,
                        code: codeData.raw,
                        formattedCode: codeData.formatted,
                        message: 'کد تأیید به تلگرام ادمین ارسال شد',
                        sentToTelegram: true,
                        timestamp: codeData.timestamp,
                        expiresIn: '۱۰ دقیقه',
                        telegramMessageId: result.result.message_id
                    };
                    
                } else {
                    console.warn('⚠️ Telegram API error:', result.description);
                    throw new Error(result.description || 'تلگرام API خطا داد');
                }
                
            } catch (fetchError) {
                clearTimeout(timeoutId);
                console.error('❌ Fetch error:', fetchError.message);
                
                // حالت fallback: نمایش کد به کاربر
                console.log('🔄 Switching to fallback mode...');
                
                // کد رو در localStorage ذخیره کن برای حالت fallback
                localStorage.setItem('telegram_fallback_code', JSON.stringify({
                    code: codeData.raw,
                    formatted: codeData.formatted,
                    phone: phoneNumber,
                    expiresAt: codeData.expiresAt,
                    timestamp: new Date().toISOString()
                }));
                
                return {
                    success: true,
                    code: codeData.raw,
                    formattedCode: codeData.formatted,
                    message: 'کد تأیید تولید شد. لطفاً آن را در فیلد مربوطه وارد کنید:',
                    sentToTelegram: false,
                    fallbackMode: true,
                    displayCode: codeData.formatted,
                    expiresIn: '۱۰ دقیقه'
                };
            }
            
        } catch (error) {
            console.error('❌ Error in sendCodeToTelegram:', error);
            
            // تولید کد fallback
            const codeData = this.generateVerificationCode();
            
            // ذخیره در localStorage برای fallback
            localStorage.setItem('telegram_fallback_code', JSON.stringify({
                code: codeData.raw,
                formatted: codeData.formatted,
                phone: phoneNumber,
                expiresAt: codeData.expiresAt,
                timestamp: new Date().toISOString()
            }));
            
            return {
                success: true,
                code: codeData.raw,
                formattedCode: codeData.formatted,
                message: 'کد تأیید تولید شد (حالت آفلاین). لطفاً آن را وارد کنید:',
                sentToTelegram: false,
                fallbackMode: true,
                displayCode: codeData.formatted,
                expiresIn: '۱۰ دقیقه'
            };
        }
    }

    // تأیید کد وارد شده
    verifyCode(enteredCode, phoneNumber) {
        try {
            console.log(`🔍 Verifying code for ${phoneNumber}`);
            
            // پاکسازی کدهای منقضی شده
            this.cleanupExpiredCodes();
            
            const code = enteredCode.toString().trim().replace(/-/g, '');
            
            // اعتبارسنجی فرمت
            if (code.length !== 6 || !/^\d+$/.test(code)) {
                return {
                    success: false,
                    error: 'کد باید ۶ رقم عددی باشد',
                    code: enteredCode
                };
            }
            
            // 1. اول سعی کن از حافظه پیدا کنی
            if (this.verificationCodes.has(code)) {
                const storedData = this.verificationCodes.get(code);
                
                // بررسی انقضا
                if (Date.now() > storedData.expiresAt) {
                    this.verificationCodes.delete(code);
                    return {
                        success: false,
                        error: 'کد منقضی شده است',
                        expired: true
                    };
                }
                
                // بررسی تطابق شماره
                if (storedData.phone !== phoneNumber) {
                    return {
                        success: false,
                        error: 'کد برای این شماره صادر نشده است',
                        phoneMismatch: true
                    };
                }
                
                // همه چیز درست است
                console.log('✅ Code verified successfully from memory');
                
                // حذف کد پس از استفاده موفق
                this.verificationCodes.delete(code);
                
                // ریست کردن شمارشگر
                this.attemptsCounter.delete(phoneNumber);
                
                // پاک کردن fallback
                localStorage.removeItem('telegram_fallback_code');
                
                return {
                    success: true,
                    message: 'کد با موفقیت تأیید شد',
                    phone: phoneNumber,
                    verifiedAt: new Date().toISOString()
                };
            }
            
            // 2. اگر در حافظه نبود، از localStorage چک کن (حالت fallback)
            const fallbackData = localStorage.getItem('telegram_fallback_code');
            if (fallbackData) {
                try {
                    const data = JSON.parse(fallbackData);
                    
                    // بررسی انقضا
                    if (Date.now() > data.expiresAt) {
                        localStorage.removeItem('telegram_fallback_code');
                        return {
                            success: false,
                            error: 'کد منقضی شده است',
                            expired: true
                        };
                    }
                    
                    // بررسی تطابق شماره
                    if (data.phone !== phoneNumber) {
                        return {
                            success: false,
                            error: 'کد برای این شماره صادر نشده است',
                            phoneMismatch: true
                        };
                    }
                    
                    // بررسی تطابق کد
                    if (data.code !== code && data.formatted.replace(/-/g, '') !== code) {
                        return {
                            success: false,
                            error: 'کد وارد شده اشتباه است',
                            invalidCode: true
                        };
                    }
                    
                    // همه چیز درست است
                    console.log('✅ Code verified successfully from fallback');
                    
                    // پاک کردن fallback
                    localStorage.removeItem('telegram_fallback_code');
                    
                    return {
                        success: true,
                        message: 'کد با موفقیت تأیید شد (حالت آفلاین)',
                        phone: phoneNumber,
                        verifiedAt: new Date().toISOString(),
                        fromFallback: true
                    };
                    
                } catch (parseError) {
                    console.warn('⚠️ Fallback data parse error:', parseError);
                }
            }
            
            // 3. اگر هیچ کدام جواب نداد
            return {
                success: false,
                error: 'کد وارد شده نامعتبر یا منقضی شده است',
                invalidCode: true
            };
            
        } catch (error) {
            console.error('❌ Verification error:', error);
            return {
                success: false,
                error: 'خطا در تأیید کد'
            };
        }
    }

    // پاکسازی کدهای منقضی شده
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
        
        // پاکسازی localStorage قدیمی
        try {
            const fallbackData = localStorage.getItem('telegram_fallback_code');
            if (fallbackData) {
                const data = JSON.parse(fallbackData);
                if (now > data.expiresAt) {
                    localStorage.removeItem('telegram_fallback_code');
                    console.log('🗑️ Cleaned up expired fallback code');
                }
            }
        } catch (error) {
            // ignore
        }
    }

    // تابع برای تست اتصال
    async testConnection() {
        try {
            const url = `https://api.telegram.org/bot${this.BOT_TOKEN}/getMe`;
            
            const response = await fetch(url, { method: 'GET' });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                console.log('🤖 Bot connected:', result.result.first_name);
                return {
                    success: true,
                    bot: result.result,
                    message: 'بات تلگرام متصل است'
                };
            } else {
                throw new Error(result.description || 'تلگرام API خطا داد');
            }
            
        } catch (error) {
            console.warn('⚠️ Telegram connection test failed:', error.message);
            return {
                success: false,
                error: error.message,
                message: 'اتصال به تلگرام برقرار نیست'
            };
        }
    }

    // تابع برای ارسال مجدد کد
    async resendCode(phoneNumber) {
        try {
            console.log(`🔄 Resending code to ${phoneNumber}`);
            
            // پاک کردن کدهای قبلی برای این شماره
            for (const [code, data] of this.verificationCodes.entries()) {
                if (data.phone === phoneNumber) {
                    this.verificationCodes.delete(code);
                }
            }
            
            // ارسال کد جدید
            return await this.sendCodeToTelegram(phoneNumber);
            
        } catch (error) {
            console.error('❌ Error resending code:', error);
            return {
                success: false,
                error: 'خطا در ارسال مجدد کد'
            };
        }
    }

    // گرفتن کد فعال برای یک شماره
    getActiveCode(phoneNumber) {
        for (const [code, data] of this.verificationCodes.entries()) {
            if (data.phone === phoneNumber && Date.now() < data.expiresAt) {
                return {
                    code: code,
                    data: data,
                    expiresIn: Math.round((data.expiresAt - Date.now()) / 1000 / 60) // دقیقه
                };
            }
        }
        return null;
    }

    // نمایش کد در مودال (برای حالت fallback)
    showCodeInModal(code, phoneNumber) {
        // این تابع در main.js صدا زده می‌شه
        if (window.showFallbackCode) {
            window.showFallbackCode(code, phoneNumber);
        } else {
            // اگر تابع وجود نداره، alert بده
            alert(`کد تأیید برای ${phoneNumber}:\n\n${code}\n\n(این کد ۱۰ دقیقه اعتبار دارد)`);
        }
    }
}

// ایجاد نمونه و اتصال به window
const completeTelegram2FA = new CompleteTelegram2FA();
window.telegram2FA = completeTelegram2FA;

// تست اتصال غیرهمزمان
setTimeout(async () => {
    try {
        const connectionTest = await completeTelegram2FA.testConnection();
        if (connectionTest.success) {
            console.log('✅ Telegram 2FA system ready');
        } else {
            console.log('⚠️ Telegram 2FA running in limited mode');
        }
    } catch (error) {
        console.log('🛡️ Telegram 2FA initialized (connection test skipped)');
    }
}, 500);

console.log('✅ Complete Telegram 2FA system loaded');

// ========== اضافه کردن توابع کمکی به window ==========
window.showFallbackCode = function(code, phone) {
    const modalHtml = `
        <div class="modal-overlay" id="telegram-fallback-overlay"></div>
        <div class="modal" id="telegram-fallback-modal">
            <div class="modal-header">
                <h3><i class="fab fa-telegram"></i> کد تأیید امنیتی</h3>
                <button class="close-modal" onclick="closeModal('telegram-fallback-modal', 'telegram-fallback-overlay')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-shield-alt fa-3x" style="color: #3498db; margin-bottom: 20px;"></i>
                    <h4>کد تأیید تولید شد</h4>
                    <p>به دلیل محدودیت‌های اینترنتی، کد به تلگرام ارسال نشد.</p>
                    <p>لطفاً کد زیر را کپی کرده و در فیلد مربوطه وارد کنید:</p>
                    
                    <div style="
                        font-size: 2.5rem;
                        font-weight: bold;
                        letter-spacing: 10px;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                        color: #2ecc71;
                        direction: ltr;
                    ">${code}</div>
                    
                    <p style="color: #f39c12;">
                        <i class="fas fa-clock"></i>
                        این کد تا <span id="fallback-expiry">۱۰</span> دقیقه دیگر معتبر است
                    </p>
                    
                    <div style="margin-top: 25px;">
                        <button class="btn btn-primary" onclick="copyToClipboard('${code}')">
                            <i class="fas fa-copy"></i> کپی کد
                        </button>
                        <button class="btn btn-secondary" onclick="closeModal('telegram-fallback-modal', 'telegram-fallback-overlay')">
                            <i class="fas fa-times"></i> بستن
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // حذف مودال قبلی
    const oldModal = document.getElementById('telegram-fallback-modal');
    const oldOverlay = document.getElementById('telegram-fallback-overlay');
    if (oldModal) oldModal.remove();
    if (oldOverlay) oldOverlay.remove();
    
    // اضافه کردن مودال جدید
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // نمایش مودال
    document.getElementById('telegram-fallback-modal').style.display = 'block';
    document.getElementById('telegram-fallback-overlay').style.display = 'block';
    
    // تایمر معکوس
    let timeLeft = 600; // 10 دقیقه
    const timerElement = document.getElementById('fallback-expiry');
    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            timerElement.textContent = 'منقضی شد';
            timerElement.style.color = '#e74c3c';
        }
        timeLeft--;
    }, 1000);
};
