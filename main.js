// main.js - Essential Version
console.log('🚀 Initializing SidkaShop...');

// متغیرهای اصلی
let products = [];
let userState = { isLoggedIn: false, currentUser: null };
let cartState = { items: [], total: 0 };
const adminInfo = { phone: "09021707830", name: "امیرمحمد یوسفی", cardNumber: "6037998222276759" };

// توابع اصلی
function formatNumber(num) { return new Intl.NumberFormat('fa-IR').format(num); }
function formatDate(dateString) { try { return new Date(dateString).toLocaleDateString('fa-IR'); } catch { return '---'; } }

// مدیریت سبد خرید
function loadCart() {
    const saved = localStorage.getItem('sidka_cart');
    if (saved) cartState.items = JSON.parse(saved);
    updateCartTotal();
}
function saveCart() { localStorage.setItem('sidka_cart', JSON.stringify(cartState.items)); }
function updateCartTotal() {
    cartState.total = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateCartUI();
}
function updateCartUI() {
    const count = document.querySelector('.cart-count');
    if (count) {
        const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
        count.textContent = totalItems;
        count.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    const totalEl = document.getElementById('cart-total-price');
    if (totalEl) totalEl.textContent = `${formatNumber(cartState.total)} تومان`;
}
function renderCartItems() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    if (cartState.items.length === 0) {
        container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>سبد خرید خالی است</p></div>`;
        return;
    }
    
    let html = '';
    cartState.items.forEach(item => {
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${formatNumber(item.price)} تومان</div>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
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

// توابع عمومی
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cartState.items.find(item => item.id === productId);
    if (existing) existing.quantity += 1;
    else cartState.items.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    
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
        if (product) showNotification(`${product.name} از سبد خرید حذف شد`, 'warning');
    }
}

function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) { removeFromCart(productId); return; }
    const item = cartState.items.find(item => item.id === productId);
    if (item) { item.quantity = newQuantity; saveCart(); updateCartTotal(); renderCartItems(); }
}

// محصولات
async function loadProducts() {
    try {
        const result = await window.supabaseFunctions.getAllProducts();
        products = result.success ? result.products : [];
        renderProducts();
        renderPricingTable();
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
    }
}

function renderProducts(filter = 'all') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-products"><i class="fas fa-box-open"></i><p>محصولی یافت نشد</p></div>`;
        return;
    }
    
    let html = '';
    filtered.forEach(product => {
        const inCart = cartState.items.find(item => item.id === product.id);
        const cartCount = inCart ? inCart.quantity : 0;
        
        html += `
            <div class="product-card" data-category="${product.category}">
                <div class="product-image"><i class="${product.icon || 'fas fa-box'}"></i></div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-price">${formatNumber(product.price)} تومان</div>
                    <div class="product-actions">
                        ${cartCount > 0 ? `
                            <div class="product-in-cart">
                                <button class="btn btn-danger" onclick="removeFromCart(${product.id})"><i class="fas fa-trash"></i> حذف</button>
                                <span class="cart-badge">${cartCount}</span>
                            </div>
                        ` : `<button class="btn btn-primary" onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> افزودن به سبد</button>`}
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
                        <button class="btn btn-sm btn-danger" onclick="removeFromCart(${product.id})"><i class="fas fa-trash"></i> حذف</button>
                    ` : `<button class="btn btn-sm btn-primary" onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> افزودن</button>`}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// تنظیم رویدادها
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // منوی موبایل
    document.getElementById('menu-toggle')?.addEventListener('click', toggleMobileMenu);
    
    // سبد خرید
    document.getElementById('cart-toggle')?.addEventListener('click', (e) => { e.preventDefault(); toggleCart(); });
    document.getElementById('close-cart')?.addEventListener('click', toggleCart);
    document.getElementById('cart-overlay')?.addEventListener('click', toggleCart);
    
    // ورود/عضویت
    document.getElementById('login-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const saved = localStorage.getItem('sidka_user_session');
        if (saved && JSON.parse(saved).user) {
            if (window.innerWidth <= 992) {
                document.getElementById('user-dropdown').classList.toggle('active');
            }
            return;
        }
        openModal('login-modal', 'login-overlay');
    });
    
    document.getElementById('submit-login')?.addEventListener('click', async () => {
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
            showNotification('شماره موبایل معتبر وارد کنید', 'warning');
            return;
        }
        
        if (!password || password.length < 6) {
            showNotification('رمز عبور الزامی است (حداقل ۶ کاراکتر)', 'warning');
            return;
        }
        
        const result = await window.supabaseFunctions.loginUser(phone, password);
        if (result.success) {
            userState.isLoggedIn = true;
            userState.currentUser = result.user;
            localStorage.setItem('sidka_user_session', JSON.stringify({ user: result.user, expiry: Date.now() + 86400000 }));
            updateUserUI();
            showNotification(`خوش آمدید ${result.user.first_name || 'کاربر'}!`, 'success');
            closeModal('login-modal', 'login-overlay');
        } else {
            showNotification(result.error || 'خطا در ورود', 'error');
        }
    });
    
    // تیکت‌ها
    document.getElementById('ticket-btn')?.addEventListener('click', (e) => { e.preventDefault(); openModal('ticket-modal', 'ticket-overlay'); });
    document.getElementById('submit-ticket-btn')?.addEventListener('click', async () => {
        if (!userState.isLoggedIn) { showNotification('لطفاً ابتدا وارد شوید', 'warning'); return; }
        
        const subject = document.getElementById('ticket-subject').value.trim();
        const message = document.getElementById('ticket-message').value.trim();
        
        if (!subject || !message) { showNotification('موضوع و پیام را وارد کنید', 'warning'); return; }
        
        const result = await window.supabaseFunctions.createNewTicket({
            userId: userState.currentUser.id,
            subject: subject,
            message: message
        });
        
        if (result.success) {
            closeModal('ticket-modal', 'ticket-overlay');
            showNotification('تیکت شما ارسال شد', 'success');
        }
    });
    
    // خرید
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        if (cartState.items.length === 0) { showNotification('سبد خرید شما خالی است', 'warning'); return; }
        if (!userState.isLoggedIn) { showNotification('لطفاً ابتدا وارد شوید', 'warning'); openModal('login-modal', 'login-overlay'); return; }
        
        if (userState.currentUser) {
            document.getElementById('first-name').value = userState.currentUser.first_name || '';
            document.getElementById('last-name').value = userState.currentUser.last_name || '';
            document.getElementById('checkout-phone').value = userState.currentUser.phone || '';
        }
        
        renderOrderSummary();
        openModal('checkout-modal', 'checkout-overlay');
    });
    
    // فیلتر محصولات
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderProducts(this.getAttribute('data-filter'));
        });
    });
    
    console.log('✅ Event listeners setup completed');
}

// راه‌اندازی
window.initializeApp = function() {
    console.log('🚀 Starting SidkaShop application...');
    
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.remove(), 500);
    }
    
    // بارگذاری سشن
    const sessionStr = localStorage.getItem('sidka_user_session');
    if (sessionStr) {
        const sessionData = JSON.parse(sessionStr);
        if (sessionData.expiry > Date.now()) {
            userState.isLoggedIn = true;
            userState.currentUser = sessionData.user;
            updateUserUI();
        }
    }
    
    // بارگذاری اولیه
    loadCart();
    updateCartUI();
    renderCartItems();
    loadProducts();
    setupEventListeners();
    
    console.log('✅ Application initialized successfully');
};

// اتصال توابع به window
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleCart = toggleCart;
window.toggleMobileMenu = toggleMobileMenu;
window.formatNumber = formatNumber;

console.log('✅ main.js loaded successfully');
