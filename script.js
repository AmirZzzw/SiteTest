// داده‌های محصولات
const products = [
    {
        id: 1,
        name: "ساخت پنل",
        category: "panels",
        description: "ساخت پنل شخصی با امکانات کامل",
        price: 900000,
        icon: "fas fa-cogs"
    },
    {
        id: 2,
        name: "آپدیت پنل",
        category: "panels",
        description: "بروزرسانی پنل به آخرین نسخه",
        price: 235000,
        icon: "fas fa-sync-alt"
    },
    {
        id: 3,
        name: "اشتراک سلف تلگرام",
        category: "subscriptions",
        description: "اشتراک یک ماهه سلف تلگرام تک کاربره",
        price: 40000,
        icon: "fab fa-telegram"
    },
    {
        id: 4,
        name: "اشتراک v2rayNG",
        category: "subscriptions",
        description: "اشتراک 50 گیگ کاربر نامحدود یک ماهه",
        price: 30000,
        icon: "fas fa-server"
    },
    {
        id: 5,
        name: "اشتراک ViaX Panel یک روزه",
        category: "subscriptions",
        description: "اشتراک ViaX Panel یک روزه",
        price: 15000,
        icon: "fas fa-bolt"
    },
    {
        id: 6,
        name: "اشتراک ViaX Panel یک هفته",
        category: "subscriptions",
        description: "اشتراک ViaX Panel یک هفته‌ای",
        price: 80000,
        icon: "fas fa-calendar-week"
    },
    {
        id: 7,
        name: "اشتراک ViaX Panel یک ماهه",
        category: "subscriptions",
        description: "اشتراک ViaX Panel یک ماهه",
        price: 230000,
        icon: "fas fa-calendar-alt"
    },
    {
        id: 8,
        name: "اشتراک ViaX Panel دائم",
        category: "subscriptions",
        description: "اشتراک ViaX Panel دائمی",
        price: 350000,
        icon: "fas fa-infinity"
    },
    {
        id: 9,
        name: "تامنیل یوتیوب",
        category: "design",
        description: "طراحی تامنیل حرفه‌ای برای یوتیوب",
        price: 50000,
        icon: "fab fa-youtube"
    },
    {
        id: 10,
        name: "پروفایل چنل",
        category: "design",
        description: "طراحی پروفایل چنل تلگرام",
        price: 50000,
        icon: "fas fa-id-card"
    }
];

// داده‌های قیمت‌گذاری
const pricingData = [
    { name: "ساخت پنل", description: "ساخت پنل شخصی با امکانات کامل", price: "۹۰۰,۰۰۰" },
    { name: "آپدیت پنل", description: "بروزرسانی پنل به آخرین نسخه", price: "۲۳۵,۰۰۰" },
    { name: "اشتراک یک‌ماهه سلف تلگرام", description: "اشتراک تک‌کاربره ضدبن", price: "۴۰,۰۰۰" },
    { name: "اشتراک 50 گیگ v2rayNG", description: "کاربر نامحدود یک‌ماهه", price: "۳۰,۰۰۰" },
    { name: "اشتراک ViaX Panel یک روزه", description: "اشتراک تک‌کاربره", price: "۱۵,۰۰۰" },
    { name: "اشتراک ViaX Panel یک هفته", description: "اشتراک تک‌کاربره", price: "۸۰,۰۰۰" },
    { name: "اشتراک ViaX Panel یک ماهه", description: "اشتراک تک‌کاربره", price: "۲۳۰,۰۰۰" },
    { name: "اشتراک ViaX Panel دائم", description: "اشتراک تک‌کاربره", price: "۳۵۰,۰۰۰" },
    { name: "تامنیل یوتیوب", description: "طراحی حرفه‌ای تامنیل", price: "۵۰,۰۰۰" },
    { name: "پروفایل چنل", description: "طراحی پروفایل چنل", price: "۵۰,۰۰۰" }
];

// مدیریت وضعیت کاربر
const userState = {
    isLoggedIn: false,
    currentUser: null,
    users: JSON.parse(localStorage.getItem('users')) || [],
    currentOrders: JSON.parse(localStorage.getItem('orders')) || []
};

// مدیریت سبد خرید
const cartState = {
    items: JSON.parse(localStorage.getItem('cart')) || [],
    total: 0
};

// مدیریت سابقه سفارشات
const ordersHistory = JSON.parse(localStorage.getItem('ordersHistory')) || [];

// فرمت اعداد به فارسی
function formatNumber(num) {
    return new Intl.NumberFormat('fa-IR').format(num);
}

// فرمت تاریخ به فارسی
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('fa-IR', options);
}

// ذخیره سبد خرید در localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cartState.items));
}

// ذخیره کاربران در localStorage
function saveUsersToLocalStorage() {
    localStorage.setItem('users', JSON.stringify(userState.users));
}

// ذخیره سفارشات در localStorage
function saveOrdersToLocalStorage() {
    localStorage.setItem('orders', JSON.stringify(userState.currentOrders));
    localStorage.setItem('ordersHistory', JSON.stringify(ordersHistory));
}

// به روزرسانی تعداد سبد خرید
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // به روزرسانی کل مبلغ سبد خرید
    cartState.total = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartTotalPrice = document.getElementById('cart-total-price');
    if (cartTotalPrice) {
        cartTotalPrice.textContent = `${formatNumber(cartState.total)} تومان`;
    }
}

// نمایش محصولات
function renderProducts(filter = 'all') {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(product => product.category === filter);
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-category', product.category);
        
        const isInCart = cartState.items.find(item => item.id === product.id);
        
        productCard.innerHTML = `
            <div class="product-image">
                <i class="${product.icon}"></i>
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
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

// نمایش جدول قیمت‌ها
function renderPricingTable() {
    const pricingTableBody = document.getElementById('pricing-table-body');
    if (!pricingTableBody) return;
    
    pricingTableBody.innerHTML = '';
    
    pricingData.forEach(item => {
        const row = document.createElement('tr');
        
        // پیدا کردن محصول مرتبط برای دسترسی به id
        const product = products.find(p => p.name === item.name);
        const isInCart = product ? cartState.items.find(cartItem => cartItem.id === product.id) : false;
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td class="price-cell">${item.price} تومان</td>
            <td>
                ${product 
                    ? (isInCart 
                        ? `<button class="btn btn-secondary" onclick="removeFromCart(${product.id})">حذف از سبد</button>` 
                        : `<button class="btn btn-primary" onclick="addToCart(${product.id})">افزودن به سبد</button>`)
                    : ''}
            </td>
        `;
        
        pricingTableBody.appendChild(row);
    });
}

// افزودن محصول به سبد خرید
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cartState.items.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartState.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    saveCartToLocalStorage();
    updateCartCount();
    renderProducts();
    renderPricingTable();
    renderCartItems();
    
    // نمایش پیام موفقیت
    showNotification(`${product.name} به سبد خرید اضافه شد`, 'success');
}

// حذف محصول از سبد خرید
function removeFromCart(productId) {
    const itemIndex = cartState.items.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        cartState.items.splice(itemIndex, 1);
        saveCartToLocalStorage();
        updateCartCount();
        renderProducts();
        renderPricingTable();
        renderCartItems();
        
        // نمایش پیام موفقیت
        const product = products.find(p => p.id === productId);
        if (product) {
            showNotification(`${product.name} از سبد خرید حذف شد`, 'warning');
        }
    }
}

// نمایش آیتم‌های سبد خرید
function renderCartItems() {
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const orderSummaryItems = document.getElementById('order-summary-items');
    
    if (!cartItems || !emptyCart) return;
    
    cartItems.innerHTML = '';
    
    if (cartState.items.length === 0) {
        emptyCart.style.display = 'block';
        cartItems.appendChild(emptyCart);
        
        if (orderSummaryItems) {
            orderSummaryItems.innerHTML = '<p class="empty-cart-message">سبد خرید خالی است</p>';
        }
        
        return;
    }
    
    emptyCart.style.display = 'none';
    
    cartState.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        cartItem.innerHTML = `
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
        
        cartItems.appendChild(cartItem);
    });
    
    // به روزرسانی خلاصه سفارش
    if (orderSummaryItems) {
        orderSummaryItems.innerHTML = '';
        
        cartState.items.forEach(item => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-summary-item';
            
            orderItem.innerHTML = `
                <span>${item.name} (${item.quantity} عدد)</span>
                <span>${formatNumber(item.price * item.quantity)} تومان</span>
            `;
            
            orderSummaryItems.appendChild(orderItem);
        });
        
        const orderTotalPrice = document.getElementById('order-total-price');
        if (orderTotalPrice) {
            orderTotalPrice.textContent = `${formatNumber(cartState.total)} تومان`;
        }
    }
}

// نمایش پیام
function showNotification(message, type = 'info') {
    // حذف نوتیفیکیشن قبلی اگر وجود دارد
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // استایل‌های نوتیفیکیشن
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
    
    if (type === 'success') {
        notification.style.backgroundColor = '#2ecc71';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#f39c12';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    } else {
        notification.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    // حذف خودکار پس از 3 ثانیه
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// مدیریت ورود/عضویت
function loginUser(phone) {
    // بررسی اینکه آیا کاربر قبلاً ثبت‌نام کرده است
    let user = userState.users.find(u => u.phone === phone);
    
    if (!user) {
        // ایجاد کاربر جدید
        user = {
            id: Date.now(),
            phone,
            firstName: '',
            lastName: '',
            registeredAt: new Date().toISOString()
        };
        
        userState.users.push(user);
        saveUsersToLocalStorage();
    }
    
    userState.isLoggedIn = true;
    userState.currentUser = user;
    
    // به روزرسانی رابط کاربری
    updateUserUI();
    
    // بستن مودال ورود
    closeModal('login-modal', 'login-overlay');
    
    showNotification(`خوش آمدید ${user.firstName || 'کاربر'}!`, 'success');
}

// خروج کاربر
function logoutUser() {
    userState.isLoggedIn = false;
    userState.currentUser = null;
    
    // به روزرسانی رابط کاربری
    updateUserUI();
    
    showNotification('با موفقیت خارج شدید', 'info');
}

// به روزرسانی رابط کاربری بر اساس وضعیت ورود
function updateUserUI() {
    const loginBtn = document.getElementById('login-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userState.isLoggedIn && userState.currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userState.currentUser.firstName || 'پروفایل'}`;
        loginBtn.href = '#profile';
        
        // به روزرسانی اطلاعات پروفایل
        document.getElementById('profile-name').textContent = userState.currentUser.firstName || '---';
        document.getElementById('profile-lastname').textContent = userState.currentUser.lastName || '---';
        document.getElementById('profile-phone').textContent = userState.currentUser.phone || '---';
        
        // تعداد سفارشات کاربر
        const userOrders = ordersHistory.filter(order => order.userId === userState.currentUser.id);
        document.getElementById('profile-orders-count').textContent = userOrders.length;
        
    } else {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> ورود';
        loginBtn.href = '#login';
    }
}

// تکمیل فرآیند خرید
function completeOrder(firstName, lastName, phone) {
    if (cartState.items.length === 0) {
        showNotification('سبد خرید شما خالی است', 'warning');
        return;
    }
    
    // اگر کاربر وارد سیستم نباشد، ابتدا ثبت‌نام/ورود انجام شود
    if (!userState.isLoggedIn) {
        showNotification('لطفاً ابتدا وارد شوید', 'warning');
        openModal('login-modal', 'login-overlay');
        return;
    }
    
    // به روزرسانی اطلاعات کاربر
    const user = userState.currentUser;
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    
    // ذخیره اطلاعات کاربر
    const userIndex = userState.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        userState.users[userIndex] = user;
        saveUsersToLocalStorage();
    }
    
    // ایجاد سفارش
    const order = {
        id: Date.now(),
        userId: user.id,
        items: [...cartState.items],
        total: cartState.total,
        customerInfo: {
            firstName,
            lastName,
            phone
        },
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    // افزودن به تاریخچه سفارشات
    ordersHistory.push(order);
    saveOrdersToLocalStorage();
    
    // خالی کردن سبد خرید
    cartState.items = [];
    saveCartToLocalStorage();
    updateCartCount();
    renderCartItems();
    renderProducts();
    renderPricingTable();
    
    // بستن مودال پرداخت
    closeModal('checkout-modal', 'checkout-overlay');
    
    // نمایش پیام موفقیت
    showNotification(`سفارش شما با موفقیت ثبت شد. کد پیگیری: ${order.id}`, 'success');
    
    // به روزرسانی رابط کاربری
    updateUserUI();
}

// نمایش سابقه خرید
function renderOrdersHistory() {
    const ordersList = document.getElementById('orders-list');
    const emptyOrders = document.getElementById('empty-orders');
    
    if (!ordersList || !emptyOrders) return;
    
    ordersList.innerHTML = '';
    
    if (!userState.isLoggedIn) {
        emptyOrders.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>برای مشاهده سابقه خرید، لطفاً وارد شوید</p>
        `;
        emptyOrders.style.display = 'block';
        ordersList.appendChild(emptyOrders);
        return;
    }
    
    // دریافت سفارشات کاربر جاری
    const userOrders = ordersHistory.filter(order => order.userId === userState.currentUser.id);
    
    if (userOrders.length === 0) {
        emptyOrders.style.display = 'block';
        ordersList.appendChild(emptyOrders);
        return;
    }
    
    emptyOrders.style.display = 'none';
    
    // نمایش سفارشات از جدید به قدیم
    userOrders.sort((a, b) => b.id - a.id).forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-history-item';
        
        const itemsList = order.items.map(item => 
            `<div class="order-history-product">
                <span>${item.name} (${item.quantity} عدد)</span>
                <span>${formatNumber(item.price * item.quantity)} تومان</span>
            </div>`
        ).join('');
        
        orderItem.innerHTML = `
            <div class="order-history-header">
                <span class="order-id">سفارش #${order.id}</span>
                <span class="order-date">${formatDate(order.date)}</span>
            </div>
            <div class="order-history-products">
                ${itemsList}
            </div>
            <div class="order-history-total">
                <span>مجموع:</span>
                <span>${formatNumber(order.total)} تومان</span>
            </div>
        `;
        
        ordersList.appendChild(orderItem);
    });
}

// مدیریت مودال‌ها
function openModal(modalId, overlayId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        
        // جلوگیری از اسکرول بدنه
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId, overlayId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
        
        // بازگرداندن اسکرول بدنه
        document.body.style.overflow = 'auto';
    }
}

// مدیریت منوی موبایل
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
    
    const menuToggle = document.getElementById('menu-toggle');
    if (navLinks.classList.contains('active')) {
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
}

// مدیریت سبد خرید
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

// رویدادهای اولیه
document.addEventListener('DOMContentLoaded', function() {
    // مقداردهی اولیه
    renderProducts();
    renderPricingTable();
    renderCartItems();
    updateCartCount();
    updateUserUI();
    
    // فیلتر محصولات
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // حذف کلاس active از همه دکمه‌ها
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // افزودن کلاس active به دکمه کلیک شده
            this.classList.add('active');
            // فیلتر محصولات
            const filter = this.getAttribute('data-filter');
            renderProducts(filter);
        });
    });
    
    // مدیریت سبد خرید
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
    
    // مدیریت مودال ورود
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (userState.isLoggedIn) {
                // اگر کاربر وارد شده باشد، دراپ‌داون را نمایش می‌دهیم
                const userDropdown = document.getElementById('user-dropdown');
                if (window.innerWidth <= 992) {
                    userDropdown.classList.toggle('active');
                }
                return;
            }
            
            openModal('login-modal', 'login-overlay');
        });
    }
    
    const closeLogin = document.getElementById('close-login');
    if (closeLogin) {
        closeLogin.addEventListener('click', function() {
            closeModal('login-modal', 'login-overlay');
        });
    }
    
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.addEventListener('click', function() {
            closeModal('login-modal', 'login-overlay');
        });
    }
    
    // ارسال فرم ورود
    const submitLogin = document.getElementById('submit-login');
    if (submitLogin) {
        submitLogin.addEventListener('click', function() {
            const phoneInput = document.getElementById('phone');
            const phone = phoneInput.value.trim();
            
            if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
                showNotification('لطفاً شماره موبایل معتبر وارد کنید', 'warning');
                return;
            }
            
            loginUser(phone);
            phoneInput.value = '';
        });
    }
    
    // مدیریت خروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
    
    // مدیریت فرآیند خرید
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cartState.items.length === 0) {
                showNotification('سبد خرید شما خالی است', 'warning');
                return;
            }
            
            openModal('checkout-modal', 'checkout-overlay');
        });
    }
    
    const closeCheckout = document.getElementById('close-checkout');
    if (closeCheckout) {
        closeCheckout.addEventListener('click', function() {
            closeModal('checkout-modal', 'checkout-overlay');
        });
    }
    
    const checkoutOverlay = document.getElementById('checkout-overlay');
    if (checkoutOverlay) {
        checkoutOverlay.addEventListener('click', function() {
            closeModal('checkout-modal', 'checkout-overlay');
        });
    }
    
    // تایید سفارش
    const confirmOrder = document.getElementById('confirm-order');
    if (confirmOrder) {
        confirmOrder.addEventListener('click', function() {
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const phone = document.getElementById('checkout-phone').value.trim();
            
            if (!firstName || !lastName) {
                showNotification('لطفاً نام و نام خانوادگی خود را وارد کنید', 'warning');
                return;
            }
            
            if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
                showNotification('لطفاً شماره موبایل معتبر وارد کنید', 'warning');
                return;
            }
            
            completeOrder(firstName, lastName, phone);
        });
    }
    
    // مدیریت سابقه خرید
    const ordersLink = document.querySelector('a[href="#orders"]');
    if (ordersLink) {
        ordersLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!userState.isLoggedIn) {
                showNotification('لطفاً ابتدا وارد شوید', 'warning');
                openModal('login-modal', 'login-overlay');
                return;
            }
            
            renderOrdersHistory();
            openModal('orders-modal', 'orders-overlay');
        });
    }
    
    const closeOrders = document.getElementById('close-orders');
    if (closeOrders) {
        closeOrders.addEventListener('click', function() {
            closeModal('orders-modal', 'orders-overlay');
        });
    }
    
    const ordersOverlay = document.getElementById('orders-overlay');
    if (ordersOverlay) {
        ordersOverlay.addEventListener('click', function() {
            closeModal('orders-modal', 'orders-overlay');
        });
    }
    
    // مدیریت پروفایل
    const profileLink = document.querySelector('a[href="#profile"]');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!userState.isLoggedIn) {
                showNotification('لطفاً ابتدا وارد شوید', 'warning');
                openModal('login-modal', 'login-overlay');
                return;
            }
            
            openModal('profile-modal', 'profile-overlay');
        });
    }
    
    const closeProfile = document.getElementById('close-profile');
    if (closeProfile) {
        closeProfile.addEventListener('click', function() {
            closeModal('profile-modal', 'profile-overlay');
        });
    }
    
    const profileOverlay = document.getElementById('profile-overlay');
    if (profileOverlay) {
        profileOverlay.addEventListener('click', function() {
            closeModal('profile-modal', 'profile-overlay');
        });
    }
    
    // مدیریت منوی موبایل
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // بستن منوی موبایل هنگام کلیک روی لینک
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                const navLinksContainer = document.querySelector('.nav-links');
                navLinksContainer.classList.remove('active');
                
                const menuToggle = document.getElementById('menu-toggle');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                
                // بستن دراپ‌داون کاربر در حالت موبایل
                const userDropdown = document.getElementById('user-dropdown');
                userDropdown.classList.remove('active');
            }
        });
    });
    
    // پیش‌پر کردن اطلاعات کاربر در فرم خرید اگر وارد سیستم باشد
    document.getElementById('checkout-phone').addEventListener('focus', function() {
        if (userState.isLoggedIn && userState.currentUser) {
            document.getElementById('first-name').value = userState.currentUser.firstName || '';
            document.getElementById('last-name').value = userState.currentUser.lastName || '';
            this.value = userState.currentUser.phone || '';
        }
    });
    
    // اسکرول نرم برای لینک‌های داخلی
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // اگر لینک برای مودال‌ها یا سبد خرید است، از اسکرول جلوگیری کن
            if (href === '#cart' || href === '#login' || href === '#profile' || href === '#orders') {
                return;
            }
            
            if (href !== '#') {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // بستن منوی موبایل
                    if (window.innerWidth <= 992) {
                        const navLinksContainer = document.querySelector('.nav-links');
                        navLinksContainer.classList.remove('active');
                        
                        const menuToggle = document.getElementById('menu-toggle');
                        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                }
            }
        });
    });
    
    // باز کردن لینک‌های خارجی در تب جدید
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.getAttribute('target')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
});
