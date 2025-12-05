// اطلاعات محصولات
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

// اطلاعات قیمت‌گذاری
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
    currentOrders: JSON.parse(localStorage.getItem('orders')) || [],
    tickets: JSON.parse(localStorage.getItem('tickets')) || []
};

// مدیریت سبد خرید
const cartState = {
    items: JSON.parse(localStorage.getItem('cart')) || [],
    total: 0
};

// مدیریت سفارشات
const ordersHistory = JSON.parse(localStorage.getItem('ordersHistory')) || [];

// اطلاعات ادمین اصلی
const adminInfo = {
    phone: "09021707830",
    name: "امیرمحمد یوسفی",
    cardNumber: "603799822276759",
    telegramId: "7549513123",
    botToken: "7408423935:AAH9nkoZg7ykqQMGKDeitIiOtu6uYZl0Vxg"
};

// فرمت اعداد به فارسی
function formatNumber(num) {
    return new Intl.NumberFormat('fa-IR').format(num);
}

// فرمت تاریخ به فارسی
function formatDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleDateString('fa-IR', options);
}

// ذخیره اطلاعات در localStorage
function saveToLocalStorage() {
    localStorage.setItem('users', JSON.stringify(userState.users));
    localStorage.setItem('orders', JSON.stringify(userState.currentOrders));
    localStorage.setItem('ordersHistory', JSON.stringify(ordersHistory));
    localStorage.setItem('tickets', JSON.stringify(userState.tickets));
    localStorage.setItem('cart', JSON.stringify(cartState.items));
}

// به روزرسانی تعداد سبد خرید
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
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
    
    saveToLocalStorage();
    updateCartCount();
    renderProducts();
    renderPricingTable();
    renderCartItems();
    
    showNotification(`${product.name} به سبد خرید اضافه شد`, 'success');
}

// حذف محصول از سبد خرید
function removeFromCart(productId) {
    const itemIndex = cartState.items.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        cartState.items.splice(itemIndex, 1);
        saveToLocalStorage();
        updateCartCount();
        renderProducts();
        renderPricingTable();
        renderCartItems();
        
        const product = products.find(p => p.id === productId);
        if (product) {
            showNotification(`${product.name} از سبد خرید حذف شد`, 'warning');
        }
    }
}

// نمایش آیتم‌های سبد خرید
function renderCartItems() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    
    if (cartState.items.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>سبد خرید شما خالی است</p>
            </div>
        `;
        return;
    }
    
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
}

// نمایش خلاصه سفارش
function renderOrderSummary() {
    const orderSummaryItems = document.getElementById('order-summary-items');
    const orderTotalPrice = document.getElementById('order-total-price');
    const paymentAmount = document.getElementById('payment-amount');
    
    if (!orderSummaryItems || !orderTotalPrice || !paymentAmount) return;
    
    orderSummaryItems.innerHTML = '';
    
    if (cartState.items.length === 0) {
        orderSummaryItems.innerHTML = '<p class="empty-cart-message">سبد خرید خالی است</p>';
        orderTotalPrice.textContent = '۰ تومان';
        paymentAmount.textContent = '۰';
        return;
    }
    
    cartState.items.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-summary-item';
        
        orderItem.innerHTML = `
            <span>${item.name} (${item.quantity} عدد)</span>
            <span>${formatNumber(item.price * item.quantity)} تومان</span>
        `;
        
        orderSummaryItems.appendChild(orderItem);
    });
    
    orderTotalPrice.textContent = `${formatNumber(cartState.total)} تومان`;
    paymentAmount.textContent = formatNumber(cartState.total);
}

// کپی متن به کلیپ‌بورد
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showNotification('متن کپی شد!', 'success');
        })
        .catch(err => {
            console.error('خطا در کپی کردن:', err);
            showNotification('خطا در کپی کردن', 'error');
        });
}

// نمایش پیام
function showNotification(message, type = 'info') {
    // حذف نوتیفیکیشن قبلی
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // استایل نوتیفیکیشن
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
    
    // حذف خودکار
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
    // بررسی ادمین
    if (phone === adminInfo.phone) {
        userState.isLoggedIn = true;
        userState.currentUser = {
            id: 0,
            phone: adminInfo.phone,
            firstName: adminInfo.name.split(' ')[0],
            lastName: adminInfo.name.split(' ')[1],
            isAdmin: true,
            registeredAt: new Date().toISOString()
        };
        
        updateUserUI();
        showNotification(`خوش آمدید ادمین!`, 'success');
        return;
    }
    
    // کاربر عادی
    let user = userState.users.find(u => u.phone === phone);
    
    if (!user) {
        user = {
            id: Date.now(),
            phone,
            firstName: '',
            lastName: '',
            isAdmin: false,
            registeredAt: new Date().toISOString()
        };
        
        userState.users.push(user);
        saveToLocalStorage();
    }
    
    userState.isLoggedIn = true;
    userState.currentUser = user;
    
    updateUserUI();
    showNotification(`خوش آمدید ${user.firstName || 'کاربر'}!`, 'success');
}

// خروج کاربر
function logoutUser() {
    userState.isLoggedIn = false;
    userState.currentUser = null;
    
    updateUserUI();
    showNotification('با موفقیت خارج شدید', 'info');
}

// به روزرسانی رابط کاربری بر اساس وضعیت ورود
function updateUserUI() {
    const loginBtn = document.getElementById('login-btn');
    const adminNavItem = document.getElementById('admin-nav-item');
    
    if (userState.isLoggedIn && userState.currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userState.currentUser.firstName || 'پروفایل'}`;
        
        // نمایش لینک ادمین برای ادمین اصلی
        if (userState.currentUser.phone === adminInfo.phone) {
            adminNavItem.style.display = 'block';
        } else {
            adminNavItem.style.display = 'none';
        }
        
        // به روزرسانی اطلاعات پروفایل
        if (document.getElementById('profile-name')) {
            document.getElementById('profile-name').textContent = userState.currentUser.firstName || '---';
            document.getElementById('profile-lastname').textContent = userState.currentUser.lastName || '---';
            document.getElementById('profile-phone').textContent = userState.currentUser.phone || '---';
        }
        
    } else {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> ورود';
        adminNavItem.style.display = 'none';
    }
}

// تکمیل فرآیند خرید
function completeOrder() {
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
    
    // اعتبارسنجی
    if (!firstName || !lastName) {
        showNotification('لطفاً نام و نام خانوادگی خود را وارد کنید', 'warning');
        return;
    }
    
    if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
        showNotification('لطفاً شماره موبایل معتبر وارد کنید', 'warning');
        return;
    }
    
    if (!receiptFile) {
        showNotification('لطفاً تصویر رسید پرداخت را آپلود کنید', 'warning');
        return;
    }
    
    // ایجاد سفارش
    const order = {
        id: Date.now(),
        userId: userState.currentUser.id,
        items: [...cartState.items],
        total: cartState.total,
        customerInfo: {
            firstName,
            lastName,
            phone
        },
        receipt: {
            fileName: receiptFile.name,
            note: receiptNote,
            uploadTime: new Date().toISOString()
        },
        date: new Date().toISOString(),
        status: 'در انتظار تأیید'
    };
    
    // افزودن به تاریخچه سفارشات
    ordersHistory.push(order);
    
    // به روزرسانی اطلاعات کاربر
    const user = userState.currentUser;
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    
    const userIndex = userState.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        userState.users[userIndex] = user;
    }
    
    // خالی کردن سبد خرید
    cartState.items = [];
    
    // ذخیره همه چیز
    saveToLocalStorage();
    updateCartCount();
    renderCartItems();
    renderProducts();
    renderPricingTable();
    
    // بستن مودال پرداخت
    closeModal('checkout-modal', 'checkout-overlay');
    
    // نمایش پیام موفقیت
    showNotification(`سفارش شما با موفقیت ثبت شد. کد پیگیری: ${order.id}`, 'success');
    
    // ارسال به تلگرام (شبیه‌سازی)
    sendToTelegram(order);
    
    // ریست فرم
    document.getElementById('first-name').value = '';
    document.getElementById('last-name').value = '';
    document.getElementById('checkout-phone').value = '';
    document.getElementById('receipt-file').value = '';
    document.getElementById('receipt-note').value = '';
}

// ارسال اطلاعات به تلگرام
function sendToTelegram(order) {
    const message = `🚨 سفارش جدید!\n\n`
        + `📦 کد سفارش: ${order.id}\n`
        + `👤 مشتری: ${order.customerInfo.firstName} ${order.customerInfo.lastName}\n`
        + `📱 شماره: ${order.customerInfo.phone}\n`
        + `💰 مبلغ: ${formatNumber(order.total)} تومان\n`
        + `📅 تاریخ: ${formatDate(order.date)}\n\n`
        + `🛒 محصولات:\n`;
    
    order.items.forEach(item => {
        message += `• ${item.name} (${item.quantity} عدد) - ${formatNumber(item.price * item.quantity)} تومان\n`;
    });
    
    message += `\n📝 توضیحات: ${order.receipt.note || 'بدون توضیح'}`;
    
    // شبیه‌سازی ارسال به تلگرام
    console.log('ارسال به تلگرام:', message);
    
    // در نسخه واقعی:
    // fetch(`https://api.telegram.org/bot${adminInfo.botToken}/sendMessage`, {
    //     method: 'POST',
    //     headers: {'Content-Type': 'application/json'},
    //     body: JSON.stringify({
    //         chat_id: adminInfo.telegramId,
    //         text: message
    //     })
    // });
    
    showNotification('اطلاعات سفارش به تلگرام ارسال شد', 'success');
}

// ارسال تیکت پشتیبانی
function submitSupportTicket() {
    if (!userState.isLoggedIn) {
        showNotification('لطفاً ابتدا وارد شوید', 'warning');
        openModal('login-modal', 'login-overlay');
        return;
    }
    
    const subject = document.getElementById('ticket-subject').value.trim();
    const message = document.getElementById('ticket-message').value.trim();
    
    if (!subject || !message) {
        showNotification('لطفاً موضوع و پیام را وارد کنید', 'warning');
        return;
    }
    
    const ticket = {
        id: Date.now(),
        userId: userState.currentUser.id,
        userPhone: userState.currentUser.phone,
        userName: `${userState.currentUser.firstName || ''} ${userState.currentUser.lastName || ''}`.trim(),
        subject,
        message,
        date: new Date().toISOString(),
        status: 'جدید',
        replies: []
    };
    
    userState.tickets.push(ticket);
    saveToLocalStorage();
    
    // ارسال به تلگرام
    const telegramMessage = `📨 تیکت جدید پشتیبانی!\n\n`
        + `🆔 کد تیکت: ${ticket.id}\n`
        + `👤 ارسال کننده: ${ticket.userName}\n`
        + `📱 شماره: ${ticket.userPhone}\n`
        + `📌 موضوع: ${ticket.subject}\n`
        + `📝 پیام:\n${ticket.message}\n`
        + `📅 تاریخ: ${formatDate(ticket.date)}`;
    
    console.log('ارسال تیکت به تلگرام:', telegramMessage);
    
    // بستن مودال و ریست فرم
    closeModal('ticket-modal', 'ticket-overlay');
    document.getElementById('ticket-subject').value = '';
    document.getElementById('ticket-message').value = '';
    
    showNotification('تیکت شما با موفقیت ارسال شد. به زودی پاسخ می‌دهیم.', 'success');
}

// نمایش سابقه خرید
function renderOrdersHistory() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    if (!userState.isLoggedIn) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-exclamation-circle"></i>
                <p>برای مشاهده سابقه خرید، لطفاً وارد شوید</p>
            </div>
        `;
        return;
    }
    
    // دریافت سفارشات کاربر جاری
    const userOrders = ordersHistory.filter(order => order.userId === userState.currentUser.id);
    
    if (userOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-history"></i>
                <p>شما تاکنون خریدی انجام نداده‌اید</p>
            </div>
        `;
        return;
    }
    
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
            <div class="order-history-footer">
                <span>وضعیت: <strong>${order.status}</strong></span>
                <span class="order-history-total">${formatNumber(order.total)} تومان</span>
            </div>
        `;
        
        ordersList.appendChild(orderItem);
    });
}

// پنل ادمین
function openAdminPanel() {
    if (!userState.isLoggedIn || userState.currentUser.phone !== adminInfo.phone) {
        showNotification('شما دسترسی ادمین ندارید', 'error');
        return;
    }
    
    renderAdminPanel();
    openModal('admin-modal', 'admin-overlay');
}

function renderAdminPanel() {
    // آمار
    document.getElementById('stats-users-count').textContent = userState.users.length;
    document.getElementById('stats-orders-count').textContent = ordersHistory.length;
    
    const totalIncome = ordersHistory.reduce((sum, order) => sum + order.total, 0);
    document.getElementById('stats-total-income').textContent = formatNumber(totalIncome) + " تومان";
    
    // سفارشات
    renderAdminOrders();
    
    // کاربران
    renderAdminUsers();
    
    // محصولات
    renderAdminProducts();
}

function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (ordersHistory.length === 0) {
        container.innerHTML = '<p class="empty-message">هنوز سفارشی ثبت نشده است</p>';
        return;
    }
    
    // مرتب کردن سفارشات از جدید به قدیم
    const sortedOrders = [...ordersHistory].sort((a, b) => b.id - a.id);
    
    sortedOrders.forEach(order => {
        const user = userState.users.find(u => u.id === order.userId);
        const item = document.createElement('div');
        item.className = 'admin-item';
        
        const itemsText = order.items.map(item => `${item.name} (${item.quantity} عدد)`).join('، ');
        
        item.innerHTML = `
            <div>
                <h4>سفارش #${order.id}</h4>
                <p>مشتری: ${order.customerInfo?.firstName || 'نامشخص'} ${order.customerInfo?.lastName || ''}</p>
                <p>شماره: ${order.customerInfo?.phone || 'نامشخص'}</p>
                <p>محصولات: ${itemsText}</p>
                <p>توضیحات رسید: ${order.receipt?.note || 'بدون توضیح'}</p>
                <small>تاریخ: ${formatDate(order.date)} | مبلغ: ${formatNumber(order.total)} تومان</small>
            </div>
            <div class="admin-item-actions">
                <span class="status-badge">${order.status}</span>
            </div>
        `;
        
        container.appendChild(item);
    });
}

function renderAdminUsers() {
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (userState.users.length === 0) {
        container.innerHTML = '<p class="empty-message">هیچ کاربری ثبت‌نام نکرده است</p>';
        return;
    }
    
    userState.users.forEach(user => {
        // نمایش همه کاربران به جز ادمین
        if (user.phone === adminInfo.phone) return;
        
        const item = document.createElement('div');
        item.className = 'admin-item';
        
        const userOrders = ordersHistory.filter(order => order.userId === user.id);
        const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
        
        item.innerHTML = `
            <div>
                <h4>${user.firstName || 'کاربر'} ${user.lastName || ''}</h4>
                <p>شماره: ${user.phone}</p>
                <p>تعداد سفارشات: ${userOrders.length} | مجموع خرید: ${formatNumber(totalSpent)} تومان</p>
                <small>عضویت از: ${formatDate(user.registeredAt)}</small>
            </div>
            <div class="admin-item-actions">
                ${userOrders.length > 0 ? 
                    `<span class="badge-success">مشتری وفادار</span>` : 
                    `<span class="badge-warning">بدون سفارش</span>`}
            </div>
        `;
        
        container.appendChild(item);
    });
}

function renderAdminProducts() {
    const container = document.getElementById('admin-products-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        
        // تعداد فروش این محصول
        const salesCount = ordersHistory.reduce((count, order) => {
            const productInOrder = order.items.find(item => item.id === product.id);
            return count + (productInOrder ? productInOrder.quantity : 0);
        }, 0);
        
        // درآمد از این محصول
        const productRevenue = salesCount * product.price;
        
        item.innerHTML = `
            <div>
                <h4>${product.name}</h4>
                <p>${product.description}</p>
                <small>دسته‌بندی: ${product.category} | قیمت: ${formatNumber(product.price)} تومان</small>
            </div>
            <div class="admin-item-actions">
                <div class="product-stats">
                    <span>فروش: ${salesCount}</span>
                    <span>درآمد: ${formatNumber(productRevenue)} تومان</span>
                </div>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// مدیریت مودال‌ها
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
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
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
                // نمایش دراپ‌داون
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
            closeModal('login-modal', 'login-overlay');
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
            
            if (!userState.isLoggedIn) {
                openModal('login-modal', 'login-overlay');
                return;
            }
            
            // پر کردن خودکار اطلاعات کاربر
            if (userState.currentUser) {
                document.getElementById('first-name').value = userState.currentUser.firstName || '';
                document.getElementById('last-name').value = userState.currentUser.lastName || '';
                document.getElementById('checkout-phone').value = userState.currentUser.phone || '';
            }
            
            renderOrderSummary();
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
    const finalSubmitBtn = document.getElementById('final-submit-btn');
    if (finalSubmitBtn) {
        finalSubmitBtn.addEventListener('click', completeOrder);
    }
    
    // مدیریت تیکت پشتیبانی
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
    
    const closeTicket = document.getElementById('close-ticket');
    if (closeTicket) {
        closeTicket.addEventListener('click', function() {
            closeModal('ticket-modal', 'ticket-overlay');
        });
    }
    
    const ticketOverlay = document.getElementById('ticket-overlay');
    if (ticketOverlay) {
        ticketOverlay.addEventListener('click', function() {
            closeModal('ticket-modal', 'ticket-overlay');
        });
    }
    
    // ارسال تیکت
    const submitTicketBtn = document.getElementById('submit-ticket-btn');
    if (submitTicketBtn) {
        submitTicketBtn.addEventListener('click', submitSupportTicket);
    }
    
    // سابقه خرید
    const ordersLink = document.querySelector('a[href="#orders"]');
    if (ordersLink) {
        ordersLink.addEventListener('click', function(e) {
            e.preventDefault();
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
    
    // پروفایل
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
    
    // پنل ادمین
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminPanel();
        });
    }
    
    const closeAdmin = document.getElementById('close-admin');
    if (closeAdmin) {
        closeAdmin.addEventListener('click', function() {
            closeModal('admin-modal', 'admin-overlay');
        });
    }
    
    const adminOverlay = document.getElementById('admin-overlay');
    if (adminOverlay) {
        adminOverlay.addEventListener('click', function() {
            closeModal('admin-modal', 'admin-overlay');
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
                
                const userDropdown = document.getElementById('user-dropdown');
                userDropdown.classList.remove('active');
            }
        });
    });
    
    // دکمه‌های کپی
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.parentElement.querySelector('span').textContent.replace(/\s/g, '');
            copyToClipboard(text);
        });
    });
    
    // اسکرول نرم برای لینک‌های داخلی
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#cart' || href === '#login' || href === '#profile' || 
                href === '#orders' || href === '#admin' || href === '#ticket') {
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
    
    // ورود اتوماتیک ادمین برای تست
    // برای تست سریع، این خط رو غیرفعال کن:
    // loginUser(adminInfo.phone);
});
