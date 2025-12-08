// main.js - فروشگاه خدمات دیجیتال SidkaShop - Complete Version
console.log('🚀 Initializing SidkaShop...');

// ========== متغیرهای جهانی ==========
let products = [];
let userState = {
    isLoggedIn: false,
    currentUser: null
};

let cartState = {
    items: [],
    total: 0
};

const adminInfo = {
    phone: "09021707830",
    name: "امیرمحمد یوسفی",
    cardNumber: "6037998222276759",
    formattedCard: "6037 9982 2227 6759"
};

// ========== متغیرهای جدید برای تلگرام ==========
let pendingAdminLogin = {
    phone: '',
    password: '',
    isPending: false
};

// ========== مدیریت سشن ==========
const sessionManager = {
    saveSession: function(user) {
        try {
            const sessionData = {
                user: user,
                expiry: Date.now() + (24 * 60 * 60 * 1000),
                savedAt: Date.now()
            };
            
            localStorage.setItem('sidka_user_session', JSON.stringify(sessionData));
            localStorage.setItem('sidka_user_data', JSON.stringify(user));
            
            console.log('Session saved for user:', user.phone);
            return true;
        } catch (error) {
            console.error('Error saving session:', error);
            return false;
        }
    },
    
    loadSession: function() {
        try {
            const sessionStr = localStorage.getItem('sidka_user_session');
            if (!sessionStr) return null;
            
            const sessionData = JSON.parse(sessionStr);
            
            if (sessionData.expiry && sessionData.expiry > Date.now()) {
                console.log('Valid session found for:', sessionData.user.phone);
                return sessionData.user;
            } else {
                console.log('Session expired');
                this.clearSession();
                return null;
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
            return null;
        }
    },
    
    clearSession: function() {
        try {
            localStorage.removeItem('sidka_user_session');
            localStorage.removeItem('sidka_user_data');
            console.log('Session cleared');
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }
};

// ========== توابع کمکی ==========
function formatNumber(num) {
    return new Intl.NumberFormat('fa-IR').format(num);
}

function formatDate(dateString) {
    try {
        if (!dateString) return '---';
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return '---';
        }
        
        return date.toLocaleDateString('fa-IR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '---';
    }
}

function showNotification(message, type = 'info') {
    try {
        // صبر کن تا DOM آماده شود
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                createNotification(message, type);
            });
        } else {
            createNotification(message, type);
        }
        
        function createNotification(msg, typ) {
            const existing = document.querySelector('.notification');
            if (existing) existing.remove();
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${typ}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${typ === 'success' ? 'check-circle' : typ === 'error' ? 'exclamation-circle' : typ === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    <span>${msg}</span>
                </div>
            `;
            
            // استایل‌ها
            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '15px 25px',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                zIndex: '9999',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                backgroundColor: typ === 'success' ? '#2ecc71' : 
                                typ === 'warning' ? '#f39c12' : 
                                typ === 'error' ? '#e74c3c' : '#3498db',
                fontFamily: 'Vazirmatn, sans-serif',
                textAlign: 'center',
                minWidth: '300px',
                maxWidth: '90vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
            });
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    notification.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => notification.remove(), 500);
                }
            }, 3000);
        }
        
    } catch (error) {
        console.error('Error showing notification:', error);
        // نمایش ساده
        alert(message);
    }
}

function copyToClipboard(text) {
    return new Promise((resolve) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    showNotification('متن کپی شد!', 'success');
                    resolve(true);
                })
                .catch(() => {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showNotification('متن کپی شد!', 'success');
                    resolve(true);
                });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('متن کپی شد!', 'success');
            resolve(true);
        }
    });
}

// ========== مدیریت سبد خرید ==========
function loadCart() {
    try {
        const savedCart = localStorage.getItem('sidka_cart');
        if (savedCart) {
            cartState.items = JSON.parse(savedCart);
            updateCartTotal();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cartState.items = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem('sidka_cart', JSON.stringify(cartState.items));
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

function updateCartTotal() {
    cartState.total = cartState.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    const cartTotalEl = document.getElementById('cart-total-price');
    if (cartTotalEl) {
        cartTotalEl.textContent = `${formatNumber(cartState.total)} تومان`;
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    if (cartState.items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>سبد خرید شما خالی است</p>
                <a href="#products" class="btn btn-primary" onclick="toggleCart()">مشاهده محصولات</a>
            </div>
        `;
        return;
    }
    
    let html = '';
    cartState.items.forEach(item => {
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${formatNumber(item.price)} تومان</div>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('محصول یافت نشد', 'error');
        return;
    }
    
    const existingItem = cartState.items.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartState.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.icon
        });
    }
    
    saveCart();
    updateCartTotal();
    renderCartItems();
    renderProducts();
    renderPricingTable();
    
    showNotification(`${product.name} به سبد خرید اضافه شد`, 'success');
}

function removeFromCart(productId) {
    const index = cartState.items.findIndex(item => item.id === productId);
    if (index !== -1) {
        const product = products.find(p => p.id === productId);
        cartState.items.splice(index, 1);
        saveCart();
        updateCartTotal();
        renderCartItems();
        renderProducts();
        renderPricingTable();
        
        if (product) {
            showNotification(`${product.name} از سبد خرید حذف شد`, 'warning');
        }
    }
}

function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const item = cartState.items.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        updateCartTotal();
        renderCartItems();
    }
}

// ========== مدیریت محصولات ==========
async function loadProducts() {
    try {
        showLoadingProducts(true);
        
        const result = await window.supabaseFunctions.getAllProducts();
        
        if (result.success) {
            products = result.products || [];
        } else {
            // محصولات ثابت
            products = [
                {
                    id: 1,
                    name: 'ساخت پنل',
                    description: 'ساخت پنل اختصاصی با امکانات کامل',
                    price: 900000,
                    category: 'panels',
                    icon: 'fas fa-plus-circle'
                },
                {
                    id: 2,
                    name: 'آپدیت پنل',
                    description: 'ارتقاء و به‌روزرسانی پنل موجود',
                    price: 235000,
                    category: 'panels',
                    icon: 'fas fa-sync-alt'
                },
                {
                    id: 3,
                    name: 'اشتراک سلف تلگرام - یک ماهه',
                    description: 'اشتراک یکماهه سلف تلگرام',
                    price: 40000,
                    category: 'subscriptions',
                    icon: 'fab fa-telegram'
                },
                {
                    id: 4,
                    name: 'اشتراک V2rayNG - 50 گیگ',
                    description: 'اشتراک 50 گیگ کاربر نامحدود یکماهه v2rayNG',
                    price: 30000,
                    category: 'subscriptions',
                    icon: 'fas fa-server'
                },
                {
                    id: 5,
                    name: 'ویاکس پنل - یکروزه',
                    description: 'اشتراک یکروزه ویاکس پنل - تک کاربره',
                    price: 15000,
                    category: 'subscriptions',
                    icon: 'fas fa-bolt'
                },
                {
                    id: 6,
                    name: 'ویاکس پنل - یک هفته',
                    description: 'اشتراک یک هفته ویاکس پنل - تک کاربره',
                    price: 80000,
                    category: 'subscriptions',
                    icon: 'fas fa-calendar-week'
                },
                {
                    id: 7,
                    name: 'ویاکس پنل - یکماهه',
                    description: 'اشتراک یکماهه ویاکس پنل - تک کاربره',
                    price: 230000,
                    category: 'subscriptions',
                    icon: 'fas fa-calendar-alt'
                },
                {
                    id: 8,
                    name: 'ویاکس پنل - دائمی',
                    description: 'اشتراک دائمی ویاکس پنل - تک کاربره',
                    price: 350000,
                    category: 'subscriptions',
                    icon: 'fas fa-infinity'
                },
                {
                    id: 9,
                    name: 'تامنیل یوتیوب',
                    description: 'طراحی تامنیل حرفه‌ای برای یوتیوب',
                    price: 50000,
                    category: 'design',
                    icon: 'fab fa-youtube'
                },
                {
                    id: 10,
                    name: 'پروفایل چنل',
                    description: 'طراحی پروفایل حرفه‌ای برای چنل',
                    price: 50000,
                    category: 'design',
                    icon: 'fas fa-id-card'
                }
            ];
        }
        
        renderProducts();
        renderPricingTable();
        showLoadingProducts(false);
        
        if (products.length > 0) {
            showNotification(`${products.length} محصول بارگذاری شد`, 'success');
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        showLoadingProducts(false);
        showNotification('خطا در بارگذاری محصولات', 'error');
    }
}

function showLoadingProducts(show) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    if (show) {
        grid.innerHTML = `
            <div class="loading-products">
                <div class="spinner"></div>
                <p>در حال بارگذاری محصولات...</p>
            </div>
        `;
    }
}

function renderProducts(filter = 'all') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <p>محصولی در این دسته‌بندی یافت نشد</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach(product => {
        const inCart = cartState.items.find(item => item.id === product.id);
        const cartCount = inCart ? inCart.quantity : 0;
        
        html += `
            <div class="product-card" data-category="${product.category}">
                <div class="product-image">
                    <i class="${product.icon || 'fas fa-box'}"></i>
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-price">${formatNumber(product.price)} تومان</div>
                    <div class="product-actions">
                        ${cartCount > 0 ? `
                            <div class="product-in-cart">
                                <button class="btn btn-danger" onclick="removeFromCart(${product.id})">
                                    <i class="fas fa-trash"></i> حذف
                                </button>
                                <span class="cart-badge">${cartCount}</span>
                            </div>
                        ` : `
                            <button class="btn btn-primary" onclick="addToCart(${product.id})">
                                <i class="fas fa-cart-plus"></i> افزودن به سبد
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function renderPricingTable() {
    const tbody = document.getElementById('pricing-table-body');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px;">
                    <i class="fas fa-spinner fa-spin"></i>
                    در حال بارگذاری...
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    products.forEach(product => {
        const inCart = cartState.items.find(item => item.id === product.id);
        
        html += `
            <tr>
                <td>${product.name}</td>
                <td>${product.description || ''}</td>
                <td class="price-cell">${formatNumber(product.price)} تومان</td>
                <td>
                    ${inCart ? `
                        <button class="btn btn-sm btn-danger" onclick="removeFromCart(${product.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-primary" onclick="addToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i> افزودن
                        </button>
                    `}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ========== مدیریت کاربران ==========
async function handleLogin() {
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    
    const phone = phoneInput.value.trim();
    const password = passwordInput.value.trim();
    
    // اعتبارسنجی اولیه
    if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
        showNotification('شماره موبایل معتبر وارد کنید (09xxxxxxxxx)', 'warning');
        return;
    }
    
    showNotification('در حال ورود...', 'info');
    
    try {
        // ========== حالت ادمین ==========
        // در تابع handleLogin (قسمت ادمین)
    if (phone === '09021707830') {
    console.log('👑 Admin login detected');
    
    // اعتبارسنجی اولیه رمز ادمین
    if (password !== 'SidkaShop1234') {
        showNotification('رمز عبور ادمین اشتباه است', 'error');
        return;
    }
    
    // ذخیره اطلاعات ورود
    window.pendingAdminLogin = {
        phone: phone,
        password: password,
        isPending: true,
        timestamp: Date.now(),
        isVerified: false
    };
    
    // ارسال کد به تلگرام
    showNotification('در حال ارسال کد امنیتی به تلگرام...', 'info');
    
    const telegramResult = await window.telegram2FA.sendCodeToTelegram(phone);
    
    console.log('Telegram 2FA result:', telegramResult);
    
    if (telegramResult.success) {
        // بستن مودال ورود
        closeModal('login-modal', 'login-overlay');
        
        // نمایش مودال تایید کد
        setTimeout(() => {
            openModal('telegram-code-modal', 'telegram-code-overlay');
            
            // تنظیم شماره تلفن
            const phoneDisplay = document.getElementById('phone-display');
            if (phoneDisplay) {
                phoneDisplay.textContent = `📱 شماره: ${phone}`;
            }
            
            // تنظیم تایمر
            const expiryElement = document.getElementById('code-expiry');
            if (expiryElement) {
                expiryElement.textContent = `⏰ کد تا ۱۰ دقیقه دیگر معتبر است`;
            }
            
            // اگر حالت fallback بود، کد رو نشون بده
            if (telegramResult.fallbackMode && telegramResult.displayCode) {
                window.showFallbackCode(telegramResult.displayCode, phone);
            }
            
            // فوکوس روی فیلد کد
            setTimeout(() => {
                const codeInput = document.getElementById('telegram-code');
                if (codeInput) {
                    codeInput.focus();
                    codeInput.value = '';
                }
            }, 300);
            
        }, 500);
        
        // پاک کردن فیلدها
        phoneInput.value = '';
        passwordInput.value = '';
        
        return;
        
    } else {
        showNotification('خطا در ارسال کد امنیتی', 'error');
        window.pendingAdminLogin = null;
        return;
    }
}
        
        // ========== کاربران عادی ==========
        console.log(`🔐 Regular user login: ${phone}`);
        
        const result = await window.supabaseFunctions.loginUser(phone, password);
        
        if (result.success) {
            // ورود موفق
            userState.isLoggedIn = true;
            userState.currentUser = result.user;
            
            // ذخیره سشن
            sessionManager.saveSession(result.user);
            
            updateUserUI();
            showNotification(`خوش آمدید ${result.user.first_name || 'کاربر'}!`, 'success');
            
            // چک ادمین
            if (phone === '09021707830' || result.user.is_admin) {
                document.getElementById('admin-nav-item').style.display = 'block';
            }
            
            closeModal('login-modal', 'login-overlay');
            
            phoneInput.value = '';
            passwordInput.value = '';
            
        } else {
            // مدیریت خطاها
            if (result.code === 'USER_NOT_FOUND') {
                // کاربر جدید شناسایی شد
                showNotification('کاربر جدید شناسایی شد. لطفاً ثبت‌نام کنید.', 'info');
                
                // بعد از 1.5 ثانیه فرم ثبت‌نام رو نشون بده
                setTimeout(() => {
                    closeModal('login-modal', 'login-overlay');
                    document.getElementById('reg-phone').value = phone;
                    if (password) {
                        document.getElementById('reg-password').value = password;
                        document.getElementById('reg-confirm-password').value = password;
                    }
                    openModal('register-modal', 'register-overlay');
                }, 1500);
                
            } else if (result.code === 'WRONG_PASSWORD') {
                showNotification('رمز عبور اشتباه است', 'error');
            } else if (result.code === 'NEED_2FA') {
                // این حالت نباید اتفاق بیفته چون ما خودمون ۲FA رو هندل می‌کنیم
                showNotification('خطا در سیستم امنیتی', 'error');
            } else {
                showNotification(result.error || 'خطا در ورود', 'error');
            }
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

async function handleRegister() {
    const phone = document.getElementById('reg-phone').value.trim();
    const firstName = document.getElementById('reg-first-name').value.trim();
    const lastName = document.getElementById('reg-last-name').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
        showNotification('شماره موبایل معتبر وارد کنید', 'warning');
        return;
    }
    
    if (!firstName || !lastName) {
        showNotification('نام و نام خانوادگی الزامی است', 'warning');
        return;
    }
    
    if (!password || password.length < 6) {
        showNotification('رمز عبور باید حداقل ۶ کاراکتر باشد', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('رمز عبور و تکرار آن مطابقت ندارند', 'warning');
        return;
    }
    
    showNotification('در حال ثبت‌نام...', 'info');
    
    try {
        const result = await window.supabaseFunctions.registerUser(phone, firstName, lastName, password);
        
        if (result.success) {
            userState.isLoggedIn = true;
            userState.currentUser = result.user;
            
            sessionManager.saveSession(result.user);
            
            updateUserUI();
            showNotification('ثبت‌نام موفقیت‌آمیز! خوش آمدید.', 'success');
            
            closeModal('register-modal', 'register-overlay');
            
        } else {
            showNotification('خطا در ثبت‌نام: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

// در تابع handleLogout این تغییر رو بده:
function handleLogout() {
    const currentUser = userState.currentUser;
    
    userState.isLoggedIn = false;
    userState.currentUser = null;
    
    // فقط سشن رو پاک کن، نه داده‌های کاربر
    localStorage.removeItem('sidka_user_session');
    
    // نمایش پیام
    if (currentUser) {
        showNotification(`خارج شدید ${currentUser.first_name} عزیز! داده‌های شما حفظ شد.`, 'info');
    } else {
        showNotification('با موفقیت خارج شدید', 'info');
    }
    
    updateUserUI();
    document.getElementById('admin-nav-item').style.display = 'none';
}

function updateUserUI() {
    const loginBtn = document.getElementById('login-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    // اگر عنصر وجود ندارد، خروج
    if (!loginBtn) {
        console.warn('⚠️ login-btn element not found');
        return;
    }
    
    if (userState.isLoggedIn && userState.currentUser) {
        const userName = userState.currentUser.first_name || 'کاربر';
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userName}`;
        
        if (document.getElementById('profile-name')) {
            document.getElementById('profile-name').textContent = userState.currentUser.first_name || '---';
            document.getElementById('profile-lastname').textContent = userState.currentUser.last_name || '---';
            document.getElementById('profile-phone').textContent = userState.currentUser.phone || '---';
        }
        
    } else {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> ورود';
    }
}

// ========== مدیریت مودال‌ها ==========
function openModal(modalId, overlayId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        if (window.innerWidth <= 768) {
            modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function closeModal(modalId, overlayId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.getElementById('menu-toggle');
    
    navLinks.classList.toggle('active');
    
    if (navLinks.classList.contains('active')) {
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        document.body.style.overflow = 'hidden';
    } else {
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = 'auto';
    }
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    
    cartSidebar.classList.toggle('active');
    
    if (cartSidebar.classList.contains('active')) {
        cartOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        cartOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========== مدیریت سفارشات ==========
async function completeOrder() {
    if (cartState.items.length === 0) {
        showNotification('سبد خرید شما خالی است', 'warning');
        return;
    }
    
    if (!userState.isLoggedIn) {
        showNotification('لطفاً ابتدا وارد شوید', 'warning');
        openModal('login-modal', 'login-overlay');
        return;
    }
    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const receiptFile = document.getElementById('receipt-file').files[0];
    const receiptNote = document.getElementById('receipt-note').value.trim();
    
    if (!firstName || !lastName) {
        showNotification('نام و نام خانوادگی الزامی است', 'warning');
        return;
    }
    
    if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
        showNotification('شماره موبایل معتبر وارد کنید', 'warning');
        return;
    }
    
    if (!receiptFile) {
        showNotification('لطفاً تصویر رسید پرداخت را آپلود کنید', 'warning');
        return;
    }
    
    if (receiptFile.size > 5 * 1024 * 1024) {
        showNotification('حجم تصویر باید کمتر از ۵ مگابایت باشد', 'warning');
        return;
    }
    
    showNotification('در حال ثبت سفارش...', 'info');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const orderData = {
                id: Date.now(),
                userId: userState.currentUser.id,
                total: cartState.total,
                customerInfo: {
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone
                },
                receipt: {
                    fileName: receiptFile.name,
                    fileSize: receiptFile.size,
                    fileType: receiptFile.type,
                    image: e.target.result,
                    note: receiptNote,
                    status: 'در انتظار تأیید'
                },
                items: cartState.items,
                status: 'در انتظار تأیید',
                createdAt: new Date().toISOString()
            };
            
            const result = await window.supabaseFunctions.createNewOrder(orderData);
            
            if (result.success) {
                cartState.items = [];
                saveCart();
                updateCartTotal();
                renderCartItems();
                renderProducts();
                renderPricingTable();
                
                closeModal('checkout-modal', 'checkout-overlay');
                
                document.getElementById('first-name').value = '';
                document.getElementById('last-name').value = '';
                document.getElementById('checkout-phone').value = '';
                document.getElementById('receipt-file').value = '';
                document.getElementById('receipt-note').value = '';
                
                showNotification(`✅ سفارش شما ثبت شد! کد پیگیری: #${orderData.id}`, 'success');
                
                // آپدیت اطلاعات کاربر اگر تغییر کرده
                if (userState.currentUser.first_name !== firstName || userState.currentUser.last_name !== lastName) {
                    await window.supabaseFunctions.updateUserInfo(
                        userState.currentUser.id, 
                        firstName, 
                        lastName
                    );
                    
                    // آپدیت کاربر جاری
                    userState.currentUser.first_name = firstName;
                    userState.currentUser.last_name = lastName;
                    sessionManager.saveSession(userState.currentUser);
                    updateUserUI();
                }
                
            } else {
                showNotification('❌ خطا در ثبت سفارش: ' + result.error, 'error');
            }
            
        } catch (error) {
            console.error('Error completing order:', error);
            showNotification('خطا در ارتباط با سرور', 'error');
        }
    };
    
    reader.onerror = () => {
        showNotification('خطا در خواندن فایل', 'error');
    };
    
    reader.readAsDataURL(receiptFile);
}

function renderOrderSummary() {
    const container = document.getElementById('order-summary-items');
    const totalEl = document.getElementById('order-total-price');
    const amountEl = document.getElementById('payment-amount');
    
    if (!container || !totalEl || !amountEl) return;
    
    if (cartState.items.length === 0) {
        container.innerHTML = '<p class="empty-cart-message">سبد خرید خالی است</p>';
        totalEl.textContent = '۰ تومان';
        amountEl.textContent = '۰';
        return;
    }
    
    let html = '';
    cartState.items.forEach(item => {
        html += `
            <div class="order-summary-item">
                <span>${item.name} (${item.quantity} عدد)</span>
                <span>${formatNumber(item.price * item.quantity)} تومان</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    totalEl.textContent = `${formatNumber(cartState.total)} تومان`;
    amountEl.textContent = formatNumber(cartState.total);
}

// ========== مدیریت تیکت‌ها ==========
async function submitSupportTicket() {
    if (!userState.isLoggedIn) {
        showNotification('لطفاً ابتدا وارد شوید', 'warning');
        openModal('login-modal', 'login-overlay');
        return;
    }
    
    const subject = document.getElementById('ticket-subject').value.trim();
    const message = document.getElementById('ticket-message').value.trim();
    
    if (!subject || !message) {
        showNotification('موضوع و پیام را وارد کنید', 'warning');
        return;
    }
    
    if (message.length < 10) {
        showNotification('پیام باید حداقل ۱۰ کاراکتر باشد', 'warning');
        return;
    }
    
    showNotification('در حال ارسال تیکت...', 'info');
    
    try {
        const ticketData = {
            subject: subject,
            message: message
        };
        
        const result = await window.supabaseFunctions.createNewTicket(ticketData);
        
        if (result.success) {
            closeModal('ticket-modal', 'ticket-overlay');
            
            document.getElementById('ticket-subject').value = '';
            document.getElementById('ticket-message').value = '';
            
            showNotification('تیکت شما ارسال شد. به زودی پاسخ می‌دهیم.', 'success');
            
        } else {
            showNotification('خطا در ارسال تیکت: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('Error submitting ticket:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

// ========== مشاهده تیکت‌های کاربر ==========
async function openUserTickets() {
    if (!userState.isLoggedIn) {
        showNotification('لطفاً ابتدا وارد شوید', 'warning');
        return;
    }
    
    try {
        // استفاده از شماره تلفن کاربر
        const userPhone = userState.currentUser.phone;
        const result = await window.supabaseFunctions.getUserTickets(userPhone);
        const ticketsList = document.getElementById('user-tickets-list');
        
        if (result.success && result.tickets && result.tickets.length > 0) {
            let html = '';
            result.tickets.forEach(ticket => {
                const statusClass = ticket.status === 'جدید' ? 'status-new' : 
                                  ticket.status === 'در حال بررسی' ? 'status-pending' : 
                                  'status-solved';
                
                html += `
                    <div class="user-ticket-item">
                        <div class="ticket-summary">
                            <h4>${ticket.subject || 'بدون موضوع'}</h4>
                            <p>${(ticket.message || '').substring(0, 100)}${(ticket.message || '').length > 100 ? '...' : ''}</p>
                        </div>
                        <div class="ticket-meta">
                            <span class="ticket-date">${formatDate(ticket.created_at)}</span>
                            <span class="${statusClass}">${ticket.status || 'جدید'}</span>
                        </div>
                        <div class="ticket-actions">
                            <button class="btn btn-sm btn-primary" onclick="openTicketDetails(${ticket.id})">
                                <i class="fas fa-eye"></i> مشاهده
                            </button>
                        </div>
                    </div>
                `;
            }); // <-- این پرانتز بسته مهمه!
            
            ticketsList.innerHTML = html;
        } else {
            ticketsList.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-ticket-alt"></i>
                    <p>هنوز تیکتی ارسال نکرده‌اید</p>
                </div>
            `;
        }
        
        openModal('mytickets-modal', 'mytickets-overlay');
        
    } catch (error) {
        console.error('Error loading user tickets:', error);
        showNotification('خطا در بارگذاری تیکت‌ها', 'error');
    }
}

// ========== پنل ادمین ==========
async function openAdminPanel() {
    if (!userState.isLoggedIn || !userState.currentUser.is_admin) {
        showNotification('شما دسترسی ادمین ندارید', 'error');
        return;
    }
    
    await renderAdminPanel();
    openModal('admin-modal', 'admin-overlay');
}

async function renderAdminPanel() {
    showNotification('در حال بارگذاری پنل ادمین...', 'info');
    
    try {
        const stats = await window.supabaseFunctions.getDashboardStats();
        if (stats.success) {
            document.getElementById('stats-users-count').textContent = stats.stats.users;
            document.getElementById('stats-orders-count').textContent = stats.stats.orders;
            document.getElementById('stats-total-income').textContent = formatNumber(stats.stats.totalIncome) + " تومان";
            document.getElementById('stats-new-tickets').textContent = stats.stats.newTickets;
        }
        
        await renderAdminOrders();
        await renderAdminTickets();
        await renderAdminUsers();
        
    } catch (error) {
        console.error('Error rendering admin panel:', error);
        showNotification('خطا در بارگذاری پنل ادمین', 'error');
    }
}

// در main.js تابع renderAdminOrders را با این کد جایگزین کن:

async function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;
    
    try {
        // چک کردن دسترسی ادمین
        const adminCheck = await checkAdminAccess();
        
        if (!adminCheck.isAdmin) {
            container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-shield-alt" style="color: #e74c3c; font-size: 3rem;"></i>
                    <h3 style="color: #e74c3c; margin: 15px 0;">دسترسی غیرمجاز</h3>
                    <p>شما دسترسی ادمین ندارید.</p>
                    <p style="font-size: 0.9rem; color: #aaa; margin-top: 10px;">
                        فقط کاربران با دسترسی ادمین می‌توانند این بخش را ببینند.
                    </p>
                </div>
            `;
            return;
        }
        
        const result = await window.supabaseFunctions.getAllOrders();
        
        if (result.success && result.orders && result.orders.length > 0) {
            console.log(`📊 Displaying ${result.orders.length} orders in admin panel`);
            
            let html = '';
            result.orders.forEach(order => {
                // اطلاعات مشتری
                const customer = order.customer_info || {};
                const items = order.items || [];
                const user = order.users || order.user || {};
                
                // نام کاربر
                const userName = user.first_name ? 
                    `${user.first_name} ${user.last_name || ''}`.trim() : 
                    customer.firstName ? 
                        `${customer.firstName} ${customer.lastName || ''}`.trim() : 
                        'مهمان';
                
                // شماره تلفن
                const userPhone = user.phone || customer.phone || order.user_phone || '---';
                
                html += `
                    <div class="admin-item">
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h4>سفارش #${order.id || order.supabase_id}</h4>
                                <span class="badge ${order.status === 'تأیید شده' ? 'badge-success' : 
                                    order.status === 'رد شده' ? 'badge-danger' : 'badge-warning'}">
                                    ${order.status || 'در انتظار تأیید'}
                                </span>
                            </div>
                            
                            <div style="margin-top: 10px;">
                                <p><strong>👤 مشتری:</strong> ${userName}</p>
                                <p><strong>📱 شماره:</strong> ${userPhone}</p>
                                <p><strong>💰 مبلغ:</strong> ${window.formatNumber(order.total || 0)} تومان</p>
                                <p><strong>📅 تاریخ:</strong> ${window.formatDate(order.created_at)}</p>
                                
                                <div style="margin-top: 10px; background: #1e1e1e; padding: 10px; border-radius: 5px;">
                                    <strong>🛒 محصولات:</strong>
                                    ${items.map(item => `
                                        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                                            <span>${item.name} (${item.quantity || 1} عدد)</span>
                                            <span>${window.formatNumber((item.price || 0) * (item.quantity || 1))} تومان</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="admin-item-actions">
                            ${(!order.status || order.status === 'در انتظار تأیید') ? `
                                <button class="btn btn-success" onclick="approveOrder('${order.id || order.supabase_id}')">
                                    <i class="fas fa-check"></i> تأیید
                                </button>
                                <button class="btn btn-danger" onclick="rejectOrder('${order.id || order.supabase_id}')">
                                    <i class="fas fa-times"></i> رد
                                </button>
                            ` : ''}
                            <button class="btn btn-info" onclick="viewReceipt('${order.id || order.supabase_id}')">
                                <i class="fas fa-receipt"></i> رسید
                            </button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-box-open"></i>
                    <p>هنوز سفارشی ثبت نشده است</p>
                    ${result.warning ? `<p style="color: #f39c12; font-size: 0.9rem;">${result.warning}</p>` : ''}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error rendering admin orders:', error);
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                <p>خطا در بارگذاری سفارشات</p>
                <p style="font-size: 0.9rem; color: #aaa;">${error.message}</p>
            </div>
        `;
    }
}
// در main.js تابع renderAdminTickets را با این کد جایگزین کن:

async function renderAdminTickets() {
    const container = document.getElementById('admin-tickets-list');
    if (!container) return;
    
    try {
        const result = await window.supabaseFunctions.getAllTickets();
        
        if (result.success && result.tickets && result.tickets.length > 0) {
            let html = '';
            
            result.tickets.forEach(ticket => {
                const user = ticket.users || {};
                const userName = user.first_name ? 
                    `${user.first_name} ${user.last_name || ''}`.trim() : 
                    'کاربر';
                const userPhone = user.phone || ticket.user_phone || '---';
                
                const status = ticket.status || 'جدید';
                const statusClass = status === 'جدید' ? 'status-new' : 
                                  status === 'در حال بررسی' ? 'status-pending' : 
                                  'status-solved';
                
                const ticketDate = ticket.created_at ? 
                    new Date(ticket.created_at).toLocaleDateString('fa-IR') : 
                    '---';
                
                html += `
                    <div class="admin-item ticket-item">
                        <div style="flex: 1;">
                            <div class="ticket-header">
                                <h4>${ticket.subject || 'بدون موضوع'}</h4>
                                <span class="ticket-id">#${ticket.id || '---'}</span>
                            </div>
                            <div class="ticket-info">
                                <p><strong>ارسال کننده:</strong> ${userName} (${userPhone})</p>
                                <p><strong>پیام:</strong> ${(ticket.message || '').substring(0, 200)}${(ticket.message || '').length > 200 ? '...' : ''}</p>
                                <p><strong>تاریخ ارسال:</strong> ${ticketDate}</p>
                            </div>
                            <div class="ticket-meta">
                                <span class="${statusClass}">${status}</span>
                                <button class="btn btn-sm btn-info" onclick="openTicketDetails(${ticket.id})">
                                    <i class="fas fa-eye"></i> مشاهده و پاسخ
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="changeTicketStatus(${ticket.id})">
                                    <i class="fas fa-edit"></i> تغییر وضعیت
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-comments"></i>
                    <p>هیچ تیکتی ارسال نشده است</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error rendering admin tickets:', error);
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>خطا در بارگذاری تیکت‌ها</p>
            </div>
        `;
    }
}

// اضافه کردن تابع تغییر وضعیت تیکت
async function changeTicketStatus(ticketId) {
    const statuses = ['جدید', 'در حال بررسی', 'پاسخ داده شده', 'بسته شده'];
    const currentStatus = prompt('وضعیت جدید تیکت را انتخاب کنید:\n' + statuses.join('\n'));
    
    if (currentStatus && statuses.includes(currentStatus)) {
        try {
            const result = await window.supabaseFunctions.updateTicketStatus(ticketId, currentStatus);
            if (result.success) {
                showNotification(`وضعیت تیکت به "${currentStatus}" تغییر کرد`, 'success');
                await renderAdminTickets();
            }
        } catch (error) {
            showNotification('خطا در تغییر وضعیت', 'error');
        }
    }
}

async function renderAdminUsers() {
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    
    try {
        const result = await window.supabaseFunctions.getAllUsers();
        
        if (result.success && result.users && result.users.length > 0) {
            let html = '';
            result.users.forEach(user => {
                html += `
                    <div class="admin-item">
                        <div style="flex: 1;">
                            <h4>${user.first_name || ''} ${user.last_name || ''}</h4>
                            <p><strong>شماره موبایل:</strong> ${user.phone}</p>
                            <p><strong>تاریخ ثبت‌نام:</strong> ${formatDate(user.created_at)}</p>
                            <p><strong>نوع کاربر:</strong> ${user.is_admin ? '👑 ادمین' : '👤 کاربر عادی'}</p>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="empty-message">هنوز کاربری ثبت نکرده‌اید</p>';
        }
        
    } catch (error) {
        console.error('Error rendering admin users:', error);
        container.innerHTML = '<p class="empty-message">خطا در بارگذاری کاربران</p>';
    }
}

async function viewReceipt(orderId) {
    try {
        const result = await window.supabaseFunctions.getOrderReceipt(orderId);
        
        if (result.success && result.receipt) {
            if (result.receipt.image) {
                openReceiptModal(result.receipt.image, orderId);
            }
            else if (result.receipt.receipt_info && result.receipt.receipt_info.image) {
                openReceiptModal(result.receipt.receipt_info.image, orderId);
            }
            else if (result.receipt.url) {
                window.open(result.receipt.url, '_blank', 'noopener,noreferrer');
            }
            else {
                showNotification('تصویر رسید موجود نیست', 'warning');
            }
        } else {
            showNotification('رسید یافت نشد', 'warning');
        }
    } catch (error) {
        console.error('Error viewing receipt:', error);
        showNotification('خطا در مشاهده رسید', 'error');
    }
}

function openReceiptModal(imageBase64, orderId) {
    const modalHtml = `
        <div class="modal-overlay" id="receipt-overlay"></div>
        <div class="modal modal-lg" id="receipt-modal">
            <div class="modal-header">
                <h3><i class="fas fa-receipt"></i> رسید سفارش #${orderId}</h3>
                <button class="close-modal" onclick="closeModal('receipt-modal', 'receipt-overlay')">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <img src="${imageBase64}" 
                     alt="رسید پرداخت" 
                     style="max-width: 100%; max-height: 500px; border-radius: 8px;">
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="downloadReceipt('${imageBase64}', 'receipt-${orderId}.jpg')">
                        <i class="fas fa-download"></i> دانلود تصویر
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('receipt-modal');
    const oldOverlay = document.getElementById('receipt-overlay');
    if (oldModal) oldModal.remove();
    if (oldOverlay) oldOverlay.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('receipt-modal').style.display = 'block';
    document.getElementById('receipt-overlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function downloadReceipt(imageBase64, filename) {
    const link = document.createElement('a');
    link.href = imageBase64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function approveOrder(orderId) {
    try {
        const result = await window.supabaseFunctions.updateOrderStatus(orderId, 'تأیید شده');
        
        if (result.success) {
            showNotification('سفارش تأیید شد', 'success');
            await renderAdminOrders();
        } else {
            showNotification('خطا در تأیید سفارش: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error approving order:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

async function rejectOrder(orderId) {
    try {
        const result = await window.supabaseFunctions.updateOrderStatus(orderId, 'رد شده');
        
        if (result.success) {
            showNotification('سفارش رد شد', 'warning');
            await renderAdminOrders();
        } else {
            showNotification('خطا در رد سفارش: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error rejecting order:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

async function replyToTicket(ticketId) {
    const replyMessage = prompt('پاسخ خود را وارد کنید:');
    if (!replyMessage) return;
    
    try {
        const result = await window.supabaseFunctions.addTicketReply(ticketId, {
            message: replyMessage,
            isAdmin: true
        });
        
        if (result.success) {
            showNotification('پاسخ ارسال شد', 'success');
            await renderAdminTickets();
        } else {
            showNotification('خطا در ارسال پاسخ', 'error');
        }
    } catch (error) {
        console.error('Error replying to ticket:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

// در main.js این تابع‌ها را اضافه کن:

// 1. تابع باز کردن مودال جزئیات تیکت
// 1. تابع باز کردن مودال جزئیات تیکت
async function openTicketDetails(ticketId) {
    try {
        const result = await window.supabaseFunctions.getTicketDetails(ticketId);
        
        if (!result.success) {
            showNotification(result.error, 'error');
            return;
        }
        
        const { ticket, replies, isAdmin, userPhone, currentUser } = result;
        
        // آیا کاربر دسترسی به این تیکت رو داره؟
        const currentUserPhone = userState.currentUser?.phone || currentUser?.phone;
        const canViewTicket = isAdmin || ticket.user_phone === currentUserPhone || ticket.user_id === (userState.currentUser?.id || currentUser?.id);
        
        if (!canViewTicket) {
            showNotification('شما دسترسی به این تیکت را ندارید', 'error');
            return;
        }
        
        // ایجاد HTML مودال
        const modalHtml = `
            <div class="modal-overlay" id="ticket-details-overlay"></div>
            <div class="modal modal-lg" id="ticket-details-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-ticket-alt"></i> جزئیات تیکت #${ticketId}</h3>
                    <button class="close-modal" onclick="closeModal('ticket-details-modal', 'ticket-details-overlay')">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="ticket-details-view">
                        <!-- اطلاعات تیکت -->
                        <div class="ticket-info-section">
                            <div class="ticket-header-info">
                                <h4>${ticket.subject || 'بدون موضوع'}</h4>
                                <span class="status-badge ${ticket.status === 'جدید' ? 'status-new' : 
                                    ticket.status === 'در حال بررسی' ? 'status-pending' : 
                                    ticket.status === 'پاسخ داده شده' ? 'status-solved' : 'status-solved'}">
                                    ${ticket.status || 'جدید'}
                                </span>
                            </div>
                            
                            <div class="ticket-user-info">
                                <p><i class="fas fa-user"></i> ارسال کننده: 
                                    ${ticket.users?.first_name || 'کاربر'} ${ticket.users?.last_name || ''}
                                    (${ticket.user_phone || ticket.users?.phone || '---'})
                                </p>
                                <p><i class="fas fa-calendar"></i> تاریخ ارسال: ${formatDate(ticket.created_at)}</p>
                            </div>
                            
                            <div class="ticket-message-box">
                                <h5><i class="fas fa-comment"></i> پیام اصلی:</h5>
                                <div class="message-content">
                                    ${(ticket.message || '').replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- پاسخ‌ها -->
                        <div class="ticket-replies-section">
                            <h5><i class="fas fa-reply"></i> پاسخ‌ها (${replies.length})</h5>
                            
                            ${replies.length === 0 ? `
                                <div class="no-replies">
                                    <i class="fas fa-comments"></i>
                                    <p>هنوز پاسخی داده نشده است</p>
                                </div>
                            ` : ''}
                            
                            ${replies.map(reply => {
                                return `
                                    <div class="reply-item ${reply.is_admin ? 'admin-reply' : 'user-reply'}">
                                        <div class="reply-header">
                                            <div class="reply-sender">
                                                <i class="fas ${reply.is_admin ? 'fa-user-shield' : 'fa-user'}"></i>
                                                <span>${reply.is_admin ? '👑 ادمین' : '👤 کاربر'}</span>
                                                ${reply.responder_name ? `<small>(${reply.responder_name})</small>` : ''}
                                            </div>
                                            <span class="reply-date">${formatDate(reply.created_at)}</span>
                                        </div>
                                        <div class="reply-content">
                                            ${(reply.message || '').replace(/\n/g, '<br>')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        <!-- پاسخ جدید (فقط برای ادمین‌ها) -->
                        ${isAdmin ? `
                            <div class="new-reply-section">
                                <h5><i class="fas fa-plus-circle"></i> پاسخ ادمین</h5>
                                <p class="note" style="color: #f39c12; margin-bottom: 10px;">
                                    <i class="fas fa-info-circle"></i> شما به عنوان ادمین می‌توانید پاسخ دهید
                                </p>
                                <div class="form-group">
                                    <textarea id="new-reply-message" rows="4" placeholder="پاسخ خود را به عنوان ادمین وارد کنید..."></textarea>
                                </div>
                                <button class="btn btn-warning" onclick="submitTicketReply(${ticketId}, true)">
                                    <i class="fas fa-paper-plane"></i> ارسال پاسخ ادمین
                                </button>
                            </div>
                        ` : `
                            <div class="new-reply-section">
                                <div class="alert alert-info" style="background: #3498db; color: white; padding: 15px; border-radius: 8px;">
                                    <i class="fas fa-info-circle"></i>
                                    <strong>تنها ادمین‌ها می‌توانند پاسخ دهند.</strong><br>
                                    پاسخ شما پس از بررسی توسط ادمین ارسال خواهد شد.
                                </div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        // حذف مودال قبلی اگر وجود دارد
        const oldModal = document.getElementById('ticket-details-modal');
        const oldOverlay = document.getElementById('ticket-details-overlay');
        if (oldModal) oldModal.remove();
        if (oldOverlay) oldOverlay.remove();
        
        // افزودن مودال جدید به DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // نمایش مودال
        document.getElementById('ticket-details-modal').style.display = 'block';
        document.getElementById('ticket-details-overlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ Error opening ticket details:', error);
        showNotification('خطا در نمایش تیکت', 'error');
    }
}
// 2. تابع ارسال پاسخ به تیکت (فقط برای ادمین‌ها)
async function submitTicketReply(ticketId, isAdmin = false) {
    const messageInput = document.getElementById('new-reply-message');
    const message = messageInput?.value.trim();
    
    if (!message || message.length < 5) {
        showNotification('لطفاً پاسخ معتبر وارد کنید (حداقل ۵ کاراکتر)', 'warning');
        return;
    }
    
    if (!userState.isLoggedIn) {
        showNotification('لطفاً ابتدا وارد شوید', 'warning');
        return;
    }
    
    // چک کن که آیا کاربر ادمینه
    const isUserAdmin = userState.currentUser?.is_admin || userState.currentUser?.phone === '09021707830';
    
    if (!isUserAdmin) {
        showNotification('❌ فقط ادمین‌ها می‌توانند پاسخ دهند', 'error');
        return;
    }
    
    showNotification('در حال ارسال پاسخ ادمین...', 'info');
    
    try {
        const replyData = {
            userId: userState.currentUser.id,
            isAdmin: true, // همیشه true چون فقط ادمین‌ها می‌تونن پاسخ بدن
            message: message
        };
        
        const result = await window.supabaseFunctions.addTicketReply(ticketId, replyData);
        
        if (result.success) {
            showNotification('✅ پاسخ ادمین با موفقیت ارسال شد', 'success');
            
            // رفرش لیست پاسخ‌ها
            closeModal('ticket-details-modal', 'ticket-details-overlay');
            setTimeout(() => openTicketDetails(ticketId), 300);
            
            // پاک کردن فیلد
            if (messageInput) messageInput.value = '';
            
        } else {
            showNotification(result.error || 'خطا در ارسال پاسخ', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error submitting reply:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

// ========== Choose File بهبود یافته ==========
function setupFileInput() {
    const receiptFileInput = document.getElementById('receipt-file');
    const customFileUpload = document.querySelector('.custom-file-upload');
    
    if (!receiptFileInput || !customFileUpload) return;
    
    receiptFileInput.style.display = 'none';
    
    const fileButton = document.createElement('button');
    fileButton.className = 'file-select-btn';
    fileButton.type = 'button';
    fileButton.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <span>انتخاب تصویر رسید</span>
    `;
    
    customFileUpload.innerHTML = '';
    customFileUpload.appendChild(fileButton);
    
    const filePreviewContainer = document.createElement('div');
    filePreviewContainer.className = 'file-preview-container';
    customFileUpload.parentNode.insertBefore(filePreviewContainer, customFileUpload.nextSibling);
    
    fileButton.addEventListener('click', function() {
        receiptFileInput.click();
    });
    
    receiptFileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            
            filePreviewContainer.innerHTML = `
                <div class="selected-file">
                    <i class="fas fa-file-image"></i>
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${(file.size / 1024).toFixed(2)} کیلوبایت</p>
                    <button type="button" class="change-file-btn">
                        <i class="fas fa-exchange-alt"></i> تغییر فایل
                    </button>
                </div>
            `;
            
            const changeBtn = filePreviewContainer.querySelector('.change-file-btn');
            changeBtn.addEventListener('click', function() {
                receiptFileInput.click();
            });
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    filePreviewContainer.innerHTML = `
                        <div class="selected-file">
                            <img src="${e.target.result}" alt="پیش‌نمایش" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 10px;">
                            <p class="file-name">${file.name}</p>
                            <p class="file-size">${(file.size / 1024).toFixed(2)} کیلوبایت</p>
                            <button type="button" class="change-file-btn">
                                <i class="fas fa-exchange-alt"></i> تغییر فایل
                            </button>
                        </div>
                    `;
                    
                    const changeBtn = filePreviewContainer.querySelector('.change-file-btn');
                    changeBtn.addEventListener('click', function() {
                        receiptFileInput.click();
                    });
                };
                reader.readAsDataURL(file);
            }
        }
    });
}

// ========== تنظیم رویدادها ==========
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // منوی موبایل
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // سبد خرید
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleCart();
        });
    }
    
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', toggleCart);
    }
    
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', toggleCart);
    }
    
    // ورود/عضویت
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (userState.isLoggedIn) {
                if (window.innerWidth <= 992) {
                    const dropdown = document.getElementById('user-dropdown');
                    dropdown.classList.toggle('active');
                }
                return;
            }
            
            openModal('login-modal', 'login-overlay');
        });
    }
    
    const submitLogin = document.getElementById('submit-login');
    if (submitLogin) {
        submitLogin.addEventListener('click', handleLogin);
    }
    
    // ثبت‌نام
    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('register-modal', 'register-overlay');
            openModal('login-modal', 'login-overlay');
        });
    }
    
    const submitRegister = document.getElementById('submit-register');
    if (submitRegister) {
        submitRegister.addEventListener('click', handleRegister);
    }
    
    // خروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }

    const showRegisterLink = document.getElementById('show-register');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
        
            const phone = document.getElementById('phone').value.trim();
            if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
                showNotification('لطفاً ابتدا شماره موبایل معتبر وارد کنید', 'warning');
                return;
            }
        
            closeModal('login-modal', 'login-overlay');
            document.getElementById('reg-phone').value = phone;
            openModal('register-modal', 'register-overlay');
        });
    }
    
    // تیکت‌های من
    const myticketsBtn = document.getElementById('mytickets-btn');
    if (myticketsBtn) {
        myticketsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openUserTickets();
        });
    }
    
    // فرآیند خرید
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cartState.items.length === 0) {
                showNotification('سبد خرید شما خالی است', 'warning');
                return;
            }
            
            if (!userState.isLoggedIn) {
                showNotification('لطفاً ابتدا وارد شوید', 'warning');
                openModal('login-modal', 'login-overlay');
                return;
            }
            
            if (userState.currentUser) {
                document.getElementById('first-name').value = userState.currentUser.first_name || '';
                document.getElementById('last-name').value = userState.currentUser.last_name || '';
                document.getElementById('checkout-phone').value = userState.currentUser.phone || '';
            }
            
            renderOrderSummary();
            openModal('checkout-modal', 'checkout-overlay');
            
            setTimeout(setupFileInput, 100);
        });
    }
    
    const finalSubmitBtn = document.getElementById('final-submit-btn');
    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', completeOrder);
    }
    
    // تیکت پشتیبانی
    const ticketBtn = document.getElementById('ticket-btn');
    if (ticketBtn) {
        ticketBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('ticket-modal', 'ticket-overlay');
        });
    }
    
    const openTicketMain = document.getElementById('open-ticket-main');
    if (openTicketMain) {
        openTicketMain.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('ticket-modal', 'ticket-overlay');
        });
    }
    
    const submitTicketBtn = document.getElementById('submit-ticket-btn');
    if (submitTicketBtn) {
        submitTicketBtn.addEventListener('click', submitSupportTicket);
    }
    
    // سابقه خرید
    const ordersBtn = document.getElementById('orders-btn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (!userState.isLoggedIn) {
                showNotification('لطفاً ابتدا وارد شوید', 'warning');
                return;
            }
            
            try {
                const result = await window.supabaseFunctions.getUserOrders(userState.currentUser.id);
                const ordersList = document.getElementById('orders-list');
                
                if (result.success && result.orders && result.orders.length > 0) {
                    let html = '';
                    result.orders.forEach(order => {
                        const items = order.items || [];
                        
                        html += `
                            <div class="order-history-item">
                                <div class="order-history-header">
                                    <span class="order-id">سفارش #${order.id}</span>
                                    <span class="order-date">${formatDate(order.created_at)}</span>
                                </div>
                                <div class="order-history-products">
                                    ${items.map(item => `
                                        <div class="order-history-product">
                                            <span>${item.name} (${item.quantity} عدد)</span>
                                            <span>${formatNumber(item.price * item.quantity)} تومان</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="order-history-footer">
                                    <span>وضعیت: <strong class="status-${order.status === 'تأیید شده' ? 'success' : order.status === 'رد شده' ? 'danger' : 'warning'}">${order.status}</strong></span>
                                    <span class="order-history-total">${formatNumber(order.total)} تومان</span>
                                </div>
                            </div>
                        `;
                    });
                    
                    ordersList.innerHTML = html;
                } else {
                    ordersList.innerHTML = `
                        <div class="empty-orders">
                            <i class="fas fa-history"></i>
                            <p>شما هنوز سفارشی ثبت نکرده‌اید</p>
                        </div>
                    `;
                }
                
                openModal('orders-modal', 'orders-overlay');
                
            } catch (error) {
                console.error('Error loading orders:', error);
                showNotification('خطا در بارگذاری سفارشات', 'error');
            }
        });
    }
    
    // پروفایل
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!userState.isLoggedIn) {
                showNotification('لطفاً ابتدا وارد شوید', 'warning');
                return;
            }
            
            openModal('profile-modal', 'profile-overlay');
        });
    }
    
    // پنل ادمین
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminPanel();
        });
    }
    
    // فیلتر محصولات
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            renderProducts(filter);
        });
    });
    
    // دکمه‌های کپی
    document.getElementById('copy-card-btn')?.addEventListener('click', () => copyToClipboard(adminInfo.cardNumber));
    document.getElementById('copy-card-large-btn')?.addEventListener('click', () => copyToClipboard(adminInfo.cardNumber));
    document.getElementById('copy-phone-btn')?.addEventListener('click', () => copyToClipboard(adminInfo.phone));
    
    // بستن مودال‌ها
    const closeButtons = ['login', 'register', 'checkout', 'ticket', 'orders', 'profile', 'mytickets', 'admin'];
    closeButtons.forEach(modal => {
        const closeBtn = document.getElementById(`close-${modal}`);
        const overlay = document.getElementById(`${modal}-overlay`);
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(`${modal}-modal`, `${modal}-overlay`));
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => closeModal(`${modal}-modal`, `${modal}-overlay`));
        }
    });
    
    // تب‌های ادمین
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            
            this.classList.add('active');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
                
                if (tabId === 'tickets-tab') {
                    renderAdminTickets();
                } else if (tabId === 'users-tab') {
                    renderAdminUsers();
                }
            }
        });
    });
    
    console.log('✅ Event listeners setup completed');
}

// تابع ایجاد مودال تلگرام (اگر وجود ندارد)
function createTelegramModal() {
    console.log('🔧 Creating Telegram modal...');
    
    const modalHtml = `
        <div class="modal-overlay" id="telegram-code-overlay"></div>
        <div class="modal" id="telegram-code-modal">
            <div class="modal-header">
                <h3><i class="fab fa-telegram"></i> تأیید دو مرحله‌ای</h3>
                <button class="close-modal" id="close-telegram-code">&times;</button>
            </div>

            <div class="modal-body">
                <div class="telegram-verification">
                    <div class="verification-info">
                        <i class="fab fa-telegram fa-3x" style="color: #0088cc;"></i>
                        <h4>کد تأیید برای ادمین</h4>
                        <p>کد ۶ رقمی تولید شد. لطفاً آن را وارد کنید:</p>
                        <p id="phone-display" style="margin: 10px 0; font-weight: bold; background: #f8f9fa; padding: 10px; border-radius: 8px;"></p>
                        <p id="code-expiry" style="color: #f39c12; font-size: 0.9rem; margin-top: 10px;"></p>
                    </div>

                    <div class="form-group">
                        <label for="telegram-code">کد ۶ رقمی</label>
                        <input type="text" id="telegram-code" 
                               maxlength="6" 
                               pattern="[0-9]{6}"
                               placeholder="123456"
                               inputmode="numeric"
                               style="text-align: center; font-size: 1.5rem; letter-spacing: 10px; padding: 15px;">
                    </div>

                    <div class="verification-actions">
                        <button class="btn btn-telegram" id="verify-code-btn">
                            <i class="fas fa-check-circle"></i> تأیید و ورود
                        </button>
                        <button class="btn btn-secondary" id="resend-code-btn">
                            <i class="fas fa-redo"></i> ارسال مجدد کد
                        </button>
                        <button class="btn btn-danger" id="cancel-verification-btn">
                            <i class="fas fa-times"></i> انصراف
                        </button>
                    </div>

                    <div class="verification-status" id="verification-status"></div>
                </div>
            </div>
        </div>
    `;
    
    // حذف مودال قبلی اگر وجود دارد
    const oldModal = document.getElementById('telegram-code-modal');
    const oldOverlay = document.getElementById('telegram-code-overlay');
    if (oldModal) oldModal.remove();
    if (oldOverlay) oldOverlay.remove();
    
    // اضافه کردن مودال جدید
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // راه‌اندازی رویدادها
    setupTelegramModalEvents();
    
    console.log('✅ Telegram modal created');
}

// ========== توابع تلگرام 2FA ==========

function setupTelegramModalEvents() {
    console.log('🔧 Setting up Telegram modal events...');
    
    // دکمه تأیید کد
    const verifyBtn = document.getElementById('verify-code-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async function() {
            const codeInput = document.getElementById('telegram-code');
            const code = codeInput.value.trim();
            
            if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
                showNotification('کد باید ۶ رقم عددی باشد', 'warning');
                return;
            }
            
            // بررسی وجود pending login
            if (!window.pendingAdminLogin || !window.pendingAdminLogin.isPending) {
                showNotification('درخواست ورود معتبری وجود ندارد', 'error');
                return;
            }
            
            showNotification('در حال بررسی کد...', 'info');
            
            const phone = window.pendingAdminLogin.phone;
            const verificationResult = window.telegram2FA.verifyCode(code, phone);
            
            console.log('Verification result:', verificationResult);
            
            if (verificationResult.success) {
                showNotification('✅ کد تأیید شد! در حال ورود...', 'success');
                
                // ورود ادمین
                const loginResult = await window.supabaseFunctions.loginOrRegisterUser(
                    phone,
                    'امیرمحمد',
                    'یوسفی',
                    window.pendingAdminLogin.password
                );
                
                if (loginResult.success && loginResult.user) {
                    // به روزرسانی وضعیت کاربر
                    userState.isLoggedIn = true;
                    userState.currentUser = loginResult.user;
                    
                    // ذخیره سشن
                    sessionManager.saveSession(loginResult.user);
                    
                    // به روزرسانی UI
                    updateUserUI();
                    
                    // نمایش دکمه ادمین
                    const adminNav = document.getElementById('admin-nav-item');
                    if (adminNav) {
                        adminNav.style.display = 'block';
                    }
                    
                    // بستن مودال‌ها
                    closeModal('telegram-code-modal', 'telegram-code-overlay');
                    
                    // پاک کردن pending login
                    window.pendingAdminLogin.isPending = false;
                    window.pendingAdminLogin.isVerified = true;
                    
                    showNotification('✅ ورود ادمین موفقیت‌آمیز بود!', 'success');
                    
                    // ریست کردن فیلد کد
                    codeInput.value = '';
                    
                } else {
                    console.error('Login failed:', loginResult.error);
                    showNotification('❌ خطا در ورود ادمین', 'error');
                    codeInput.value = '';
                    codeInput.focus();
                }
                
            } else {
                showNotification(`❌ ${verificationResult.error || 'کد نامعتبر است'}`, 'error');
                codeInput.value = '';
                codeInput.focus();
            }
        });
    }
    
    // دکمه ارسال مجدد
    const resendBtn = document.getElementById('resend-code-btn');
    if (resendBtn) {
        resendBtn.addEventListener('click', async function() {
            if (!window.pendingAdminLogin || !window.pendingAdminLogin.isPending) {
                showNotification('درخواست ورود فعالی وجود ندارد', 'warning');
                return;
            }
            
            showNotification('در حال ارسال کد جدید...', 'info');
            
            const result = await window.telegram2FA.sendCodeToTelegram(window.pendingAdminLogin.phone);
            
            if (result.success) {
                showNotification('✅ کد جدید ارسال شد', 'success');
                document.getElementById('telegram-code').value = '';
                document.getElementById('telegram-code').focus();
            } else {
                showNotification('❌ خطا در ارسال کد جدید', 'error');
            }
        });
    }
    
    // دکمه انصراف
    const cancelBtn = document.getElementById('cancel-verification-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (window.pendingAdminLogin.timer) {
                clearInterval(window.pendingAdminLogin.timer);
            }
            window.pendingAdminLogin.isPending = false;
            closeModal('telegram-code-modal', 'telegram-code-overlay');
            showNotification('فرآیند ورود لغو شد', 'warning');
        });
    }
    
    // بستن مودال
    const closeBtn = document.getElementById('close-telegram-code');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (window.pendingAdminLogin.timer) {
                clearInterval(window.pendingAdminLogin.timer);
            }
            window.pendingAdminLogin.isPending = false;
            closeModal('telegram-code-modal', 'telegram-code-overlay');
        });
    }
    
    // کلیک روی overlay
    const overlay = document.getElementById('telegram-code-overlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            if (window.pendingAdminLogin.timer) {
                clearInterval(window.pendingAdminLogin.timer);
            }
            window.pendingAdminLogin.isPending = false;
            closeModal('telegram-code-modal', 'telegram-code-overlay');
        });
    }
    
    // فشردن Enter در فیلد کد
    const codeInput = document.getElementById('telegram-code');
    if (codeInput) {
        codeInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                document.getElementById('verify-code-btn').click();
            }
        });
    }
    
    console.log('✅ Telegram modal events setup completed');
}

// تابع فعال‌سازی 2FA
function initializeTelegram2FA() {
    try {
        if (window.telegram2FA) {
            console.log('✅ Telegram 2FA is available');
            
            // تنظیم رویدادها
            setupTelegramModalEvents();
            
            // تست اتصال
            window.telegram2FA.initialize().then(success => {
                if (success) {
                    console.log('✅ Telegram Bot connected');
                } else {
                    console.warn('⚠️ Could not connect to Telegram Bot');
                }
            });
            
            return true;
        } else {
            console.warn('⚠️ Telegram 2FA is NOT available');
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing Telegram 2FA:', error);
        return false;
    }
}

// ========== توابع کمکی تلگرام ==========

// تابع تایمر معکوس برای کد تلگرام
function startCodeTimer(phone = null) {
    console.log('⏰ Starting code timer...');
    
    const timerElement = document.getElementById('code-expiry');
    if (!timerElement) {
        console.warn('⚠️ Timer element not found');
        return;
    }
    
    let timeLeft = 300; // 5 دقیقه
    
    // پاک کردن تایمر قبلی
    if (window.codeTimer) {
        clearInterval(window.codeTimer);
    }
    
    window.codeTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timerElement.textContent = `⏰ کد تا ${minutes}:${seconds.toString().padStart(2, '0')} دیگر معتبر است`;
        timerElement.style.color = timeLeft < 60 ? '#e74c3c' : '#f39c12';
        
        if (timeLeft <= 0) {
            clearInterval(window.codeTimer);
            timerElement.textContent = '⏰ کد منقضی شده است';
            timerElement.style.color = '#e74c3c';
            
            // غیرفعال کردن حالت انتظار
            if (window.pendingAdminLogin) {
                window.pendingAdminLogin.isPending = false;
            }
        }
        
        timeLeft--;
    }, 1000);
    
    console.log('✅ Code timer started');
}

// تابع نمایش مودال تلگرام
function showTelegramModal(phone, code = '') {
    console.log('📱 Showing Telegram modal for:', phone);
    
    // مطمئن شو مودال وجود داره
    let modal = document.getElementById('telegram-code-modal');
    let overlay = document.getElementById('telegram-code-overlay');
    
    if (!modal) {
        console.error('❌ Telegram modal not found!');
        createEmergencyTelegramModal();
        modal = document.getElementById('telegram-code-modal');
        overlay = document.getElementById('telegram-code-overlay');
    }
    
    // نمایش مودال
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // تنظیم اطلاعات
    const phoneDisplay = document.getElementById('phone-display');
    if (phoneDisplay) {
        phoneDisplay.textContent = `📱 شماره: ${phone}`;
    }
    
    // تایمر معکوس
    startCodeTimer(phone);
    
    // فوکوس روی فیلد کد
    setTimeout(() => {
        const codeInput = document.getElementById('telegram-code');
        if (codeInput) {
            codeInput.focus();
            codeInput.value = '';
        }
    }, 300);
    
    console.log('✅ Telegram modal shown');
}

// تابع ایجاد مودال اضطراری
function createEmergencyTelegramModal() {
    console.log('🚨 Creating emergency Telegram modal...');
    
    const modalHtml = `
        <div class="modal-overlay" id="telegram-code-overlay"></div>
        <div class="modal" id="telegram-code-modal">
            <div class="modal-header">
                <h3><i class="fab fa-telegram"></i> تأیید دو مرحله‌ای</h3>
                <button class="close-modal" id="close-telegram-code">&times;</button>
            </div>
            <div class="modal-body">
                <div class="telegram-verification">
                    <div class="verification-info">
                        <i class="fab fa-telegram fa-3x" style="color: #0088cc;"></i>
                        <h4>تأیید ادمین</h4>
                        <p>لطفاً کد امنیتی را وارد کنید</p>
                        <p id="phone-display" style="margin: 10px 0; font-weight: bold;"></p>
                        <p id="code-expiry" style="color: #f39c12; font-size: 0.9rem;"></p>
                    </div>
                    
                    <div class="form-group">
                        <label for="telegram-code">کد ۶ رقمی</label>
                        <input type="text" id="telegram-code" 
                               maxlength="6" 
                               pattern="[0-9]{6}"
                               placeholder="123456"
                               inputmode="numeric"
                               style="text-align: center; font-size: 1.5rem; letter-spacing: 10px;">
                    </div>
                    
                    <div class="verification-actions">
                        <button class="btn btn-telegram" id="verify-code-btn">
                            <i class="fas fa-check-circle"></i> تأیید
                        </button>
                        <button class="btn btn-secondary" id="resend-code-btn">
                            <i class="fas fa-redo"></i> ارسال مجدد
                        </button>
                        <button class="btn btn-danger" id="cancel-verification-btn">
                            <i class="fas fa-times"></i> انصراف
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // رویدادها رو دوباره تنظیم کن
    setTimeout(setupTelegramModalEvents, 100);
    
    console.log('✅ Emergency Telegram modal created');
}

// ========== تابع اصلی راه‌اندازی ==========
window.initializeApp = function() {
    console.log('🚀 Starting SidkaShop application...');
    
    try {
        // حذف صفحه لودینگ
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
        
        // بارگذاری سشن
        const savedUser = sessionManager.loadSession();
        if (savedUser) {
            userState.isLoggedIn = true;
            userState.currentUser = savedUser;
            
            if (savedUser.phone === '09021707830' || savedUser.is_admin) {
                const adminNav = document.getElementById('admin-nav-item');
                if (adminNav) {
                    adminNav.style.display = 'block';
                }
            }
        }
        
        // بارگذاری اولیه
        loadCart();
        updateCartUI();
        
        // صبر کن تا DOM کاملاً بارگذاری شود
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAfterDOM);
        } else {
            setTimeout(initAfterDOM, 100);
        }
        
        function initAfterDOM() {
            // الان DOM آماده است
            updateUserUI();
            renderCartItems();
            loadProducts();
            setupEventListeners();

            initializeTelegram2FA(); // راه‌اندازی تلگرام 2FA
            
            // تنظیم شماره کارت
            const cardNumberEls = document.querySelectorAll('#card-number-text, .card-number-large span');
            cardNumberEls.forEach(el => {
                if (el) el.textContent = adminInfo.formattedCard;
            });
            
            console.log('✅ Application initialized successfully');
            showNotification('فروشگاه آماده است!', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        // حداقل صفحه لودینگ رو پاک کن
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
};

async function loadUserData(userPhone) {
    try {
        console.log('📊 Loading user data for:', userPhone);
        
        // بارگذاری سفارشات
        if (window.supabaseFunctions && window.supabaseFunctions.getUserOrders) {
            const ordersResult = await window.supabaseFunctions.getUserOrders(userPhone);
            if (ordersResult.success && ordersResult.orders.length > 0) {
                console.log('✅ Loaded', ordersResult.orders.length, 'orders');
            }
        }
        
        // بارگذاری تیکت‌ها
        if (window.supabaseFunctions && window.supabaseFunctions.getUserTickets) {
            const ticketsResult = await window.supabaseFunctions.getUserTickets(userPhone);
            if (ticketsResult.success && ticketsResult.tickets.length > 0) {
                console.log('✅ Loaded', ticketsResult.tickets.length, 'tickets');
            }
        }
        
    } catch (error) {
        console.warn('⚠️ Error loading user data:', error);
    }
}

// خط آخر main.js اضافه کن:
window.addEventListener('error', function(e) {
    console.error('🚨 خطای جزئیات:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
    });
    
    // نمایش خطا به کاربر
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification notification-error';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.zIndex = '99999';
    errorDiv.innerHTML = `
        <div style="padding: 20px; background: #e74c3c; color: white; border-radius: 10px;">
            <h3>خطا در برنامه</h3>
            <p>${e.message}</p>
            <p>خط: ${e.lineno}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: white;
                color: #e74c3c;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
            ">بستن</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
});

// ========== اتصال توابع به window ==========
window.startCodeTimer = startCodeTimer;
window.showTelegramModal = showTelegramModal;
window.createEmergencyTelegramModal = createEmergencyTelegramModal;
window.initializeTelegram2FA = initializeTelegram2FA;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleCart = toggleCart;
window.toggleMobileMenu = toggleMobileMenu;
window.openModal = openModal;
window.closeModal = closeModal;
window.formatNumber = formatNumber;
window.copyToClipboard = copyToClipboard;
window.viewReceipt = viewReceipt;
window.approveOrder = approveOrder;
window.rejectOrder = rejectOrder;
window.replyToTicket = replyToTicket;
window.openUserTickets = openUserTickets;
window.setupFileInput = setupFileInput;

console.log('✅ main.js loaded successfully');

// خط آخر main.js اضافه کن:
window.addEventListener('error', function(e) {
    console.error('🚨 خطای جزئیات:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
    });
    
    // نمایش خطا به کاربر
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification notification-error';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.zIndex = '99999';
    errorDiv.innerHTML = `
        <div style="padding: 20px; background: #e74c3c; color: white; border-radius: 10px;">
            <h3>خطا در برنامه</h3>
            <p>${e.message}</p>
            <p>خط: ${e.lineno}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: white;
                color: #e74c3c;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
            ">بستن</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
});
