// main.js - نسخه اصلاح شده
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
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
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
            backgroundColor: type === 'success' ? '#2ecc71' : 
                            type === 'warning' ? '#f39c12' : 
                            type === 'error' ? '#e74c3c' : '#3498db',
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
        
    } catch (error) {
        console.error('Error showing notification:', error);
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
    
    if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
        showNotification('شماره موبایل معتبر وارد کنید (09xxxxxxxxx)', 'warning');
        return;
    }
    
    if (!password || password.length < 6) {
        showNotification('رمز عبور الزامی است (حداقل ۶ کاراکتر)', 'warning');
        return;
    }
    
    showNotification('در حال ورود...', 'info');
    
    try {
        const result = await window.supabaseFunctions.loginUser(phone, password);
        
        if (result.success) {
            userState.isLoggedIn = true;
            userState.currentUser = result.user;
            
            sessionManager.saveSession(result.user);
            
            updateUserUI();
            showNotification(`خوش آمدید ${result.user.first_name || 'کاربر'}!`, 'success');
            
            if (phone === adminInfo.phone || result.user.is_admin) {
                document.getElementById('admin-nav-item').style.display = 'block';
            }
            
            closeModal('login-modal', 'login-overlay');
            
            phoneInput.value = '';
            passwordInput.value = '';
            
        } else {
            showNotification(result.error || 'خطا در ورود', 'error');
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

function handleLogout() {
    userState.isLoggedIn = false;
    userState.currentUser = null;
    
    sessionManager.clearSession();
    updateUserUI();
    
    document.getElementById('admin-nav-item').style.display = 'none';
    
    showNotification('با موفقیت خارج شدید', 'info');
}

function updateUserUI() {
    const loginBtn = document.getElementById('login-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
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
            userId: userState.currentUser.id,
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

async function openUserTickets() {
    if (!userState.isLoggedIn) {
        showNotification('لطفاً ابتدا وارد شوید', 'warning');
        return;
    }
    
    try {
        const result = await window.supabaseFunctions.getUserTickets(userState.currentUser.id);
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
                    </div>
                `;
            });
            
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
    
    // خروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
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
    
    console.log('✅ Event listeners setup completed');
}

// ========== تابع اصلی راه‌اندازی ==========
window.initializeApp = function() {
    console.log('🚀 Starting SidkaShop application...');
    
    try {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.remove(), 500);
        }
        
        const savedUser = sessionManager.loadSession();
        if (savedUser) {
            userState.isLoggedIn = true;
            userState.currentUser = savedUser;
            
            if (savedUser.phone === adminInfo.phone || savedUser.is_admin) {
                document.getElementById('admin-nav-item').style.display = 'block';
            }
        }
        
        loadCart();
        updateUserUI();
        updateCartUI();
        renderCartItems();
        loadProducts();
        setupEventListeners();
        
        document.querySelectorAll('#card-number-text, .card-number-large span').forEach(el => {
            el.textContent = adminInfo.formattedCard;
        });
        
        console.log('✅ Application initialized successfully');
        showNotification('فروشگاه آماده است!', 'success');
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showNotification('خطا در راه‌اندازی برنامه', 'error');
    }
};

// ========== اتصال توابع به window ==========
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleCart = toggleCart;
window.toggleMobileMenu = toggleMobileMenu;
window.openModal = openModal;
window.closeModal = closeModal;
window.formatNumber = formatNumber;
window.copyToClipboard = copyToClipboard;

console.log('✅ main.js loaded successfully');
