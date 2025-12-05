// main.js - فایل اصلی جدید
console.log('🚀 سایت در حال راه‌اندازی...');

// منتظر بمون تا DOM کاملاً لود شه
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ DOM آماده');
    
    // منتظر بمون تا supabaseFunctions لود شه
    await waitForSupabase();
    
    // شروع برنامه
    initApp();
});

// منتظر ماندن برای لود شدن توابع Supabase
function waitForSupabase() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.supabaseFunctions && window.supabaseFunctions.getAllProducts) {
                clearInterval(checkInterval);
                console.log('✅ Supabase functions ready');
                resolve();
            }
        }, 100);
        
        // تایم‌اوت بعد از 5 ثانیه
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('⚠️ Supabase functions timeout');
            resolve();
        }, 5000);
    });
}

// مقداردهی اولیه برنامه
async function initApp() {
    console.log('🎯 شروع برنامه...');
    
    try {
        // تست اتصال
        const testResult = await window.supabaseFunctions.getAllProducts();
        
        if (testResult.success) {
            console.log(`✅ اتصال موفق: ${testResult.products.length} محصول`);
            startApplication(testResult.products);
        } else {
            console.error('❌ خطا در اتصال:', testResult.error);
            showNotification('خطا در اتصال به سرور', 'error');
        }
    } catch (error) {
        console.error('❌ خطای غیرمنتظره:', error);
        showNotification('خطا در راه‌اندازی برنامه', 'error');
    }
}

// شروع برنامه اصلی
function startApplication(loadedProducts) {
    console.log('🏁 برنامه اصلی شروع شد');
    
    // ذخیره محصولات
    window.products = loadedProducts;
    
    // مقداردهی اولیه
    initCart();
    initUI();
    renderProducts();
    renderPricingTable();
    
    // اضافه کردن event listeners
    setupEventListeners();
    
    showNotification('سایت آماده است!', 'success');
}

// ========== توابع مدیریت سبد خرید ==========

let cart = {
    items: JSON.parse(localStorage.getItem('cart')) || [],
    total: 0
};

function initCart() {
    updateCartTotal();
    updateCartCount();
}

function updateCartTotal() {
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart.items));
}

function addToCart(productId) {
    const product = window.products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.items.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartTotal();
    updateCartCount();
    renderCartItems();
    showNotification(`${product.name} به سبد اضافه شد`, 'success');
}

function removeFromCart(productId) {
    const itemIndex = cart.items.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        const product = window.products.find(p => p.id === productId);
        cart.items.splice(itemIndex, 1);
        saveCart();
        updateCartTotal();
        updateCartCount();
        renderCartItems();
        
        if (product) {
            showNotification(`${product.name} از سبد حذف شد`, 'warning');
        }
    }
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.items.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>سبد خرید خالی است</p>
            </div>
        `;
        return;
    }
    
    cart.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">${formatNumber(item.price)} تومان</div>
            </div>
            <div class="cart-item-actions">
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <span class="cart-item-quantity">${item.quantity}</span>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    
    // آپدیت جمع کل
    const cartTotalElement = document.getElementById('cart-total-price');
    if (cartTotalElement) {
        cartTotalElement.textContent = `${formatNumber(cart.total)} تومان`;
    }
}

// ========== توابع نمایش ==========

function renderProducts(filter = 'all') {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid || !window.products) return;
    
    productsGrid.innerHTML = '';
    
    const filteredProducts = filter === 'all' 
        ? window.products 
        : window.products.filter(p => p.category === filter);
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const isInCart = cart.items.find(item => item.id === product.id);
        
        productCard.innerHTML = `
            <div class="product-image">
                <i class="${product.icon || 'fas fa-box'}"></i>
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-price">${formatNumber(product.price)} تومان</div>
                <div class="product-actions">
                    ${isInCart 
                        ? `<button class="btn btn-secondary" onclick="removeFromCart(${product.id})">حذف از سبد</button>` 
                        : `<button class="btn btn-primary" onclick="addToCart(${product.id})">افزودن به سبد</button>`}
                </div>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
    });
}

function renderPricingTable() {
    const tableBody = document.getElementById('pricing-table-body');
    if (!tableBody || !window.products) return;
    
    tableBody.innerHTML = '';
    
    window.products.forEach(product => {
        const row = document.createElement('tr');
        const isInCart = cart.items.find(item => item.id === product.id);
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.description || ''}</td>
            <td class="price-cell">${formatNumber(product.price)} تومان</td>
            <td>
                ${isInCart 
                    ? `<button class="btn btn-secondary" onclick="removeFromCart(${product.id})">حذف</button>` 
                    : `<button class="btn btn-primary" onclick="addToCart(${product.id})">افزودن</button>`}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// ========== توابع کمکی ==========

function formatNumber(num) {
    return new Intl.NumberFormat('fa-IR').format(num);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = '600';
    notification.style.zIndex = '2000';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    
    if (type === 'success') notification.style.backgroundColor = '#2ecc71';
    else if (type === 'warning') notification.style.backgroundColor = '#f39c12';
    else if (type === 'error') notification.style.backgroundColor = '#e74c3c';
    else notification.style.backgroundColor = '#3498db';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// ========== UI و Event Listeners ==========

function initUI() {
    // آپدیت دکمه ورود
    updateLoginUI();
}

function updateLoginUI() {
    const loginBtn = document.getElementById('login-btn');
    if (!loginBtn) return;
    
    // فعلاً ساده
    loginBtn.innerHTML = '<i class="fas fa-user"></i> ورود';
}

function setupEventListeners() {
    console.log('🔗 اضافه کردن Event Listeners...');
    
    // فیلتر محصولات
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            renderProducts(filter);
        });
    });
    
    // دکمه‌های کپی
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const text = this.parentElement.querySelector('span').textContent.replace(/\s/g, '');
            copyToClipboard(text);
        });
    });
    
    // سبد خرید
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleCart();
        });
    }
    
    // فرم ورود
    const submitLogin = document.getElementById('submit-login');
    if (submitLogin) {
        submitLogin.addEventListener('click', async function() {
            const phoneInput = document.getElementById('phone');
            const phone = phoneInput.value.trim();
            
            if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
                showNotification('شماره موبایل معتبر نیست', 'warning');
                return;
            }
            
            try {
                const result = await window.supabaseFunctions.loginOrRegisterUser(phone);
                
                if (result.success) {
                    showNotification(`خوش آمدید ${result.user.first_name || 'کاربر'}!`, 'success');
                    phoneInput.value = '';
                    closeModal('login-modal', 'login-overlay');
                    
                    // اگر ادمین بود
                    if (phone === '09021707830') {
                        document.getElementById('admin-nav-item').style.display = 'block';
                    }
                } else {
                    showNotification('خطا در ورود', 'error');
                }
            } catch (error) {
                console.error('خطا:', error);
                showNotification('خطا در ورود', 'error');
            }
        });
    }
    
    // اضافه کردن بقیه event listeners...
    console.log('✅ Event Listeners اضافه شدند');
}

// توابع عمومی که از HTML صدا زده می‌شن
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = function() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.toggle('active');
        cartOverlay.style.display = cartSidebar.classList.contains('active') ? 'block' : 'none';
        document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : 'auto';
    }
};

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text)
        .then(() => showNotification('کپی شد!', 'success'))
        .catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('کپی شد!', 'success');
        });
};

// توابع مودال (ساده شده)
window.openModal = function(modalId, overlayId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function(modalId, overlayId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};
