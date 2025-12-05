// main.js - فروشگاه خدمات دیجیتال SidkaShop
// Core Application Logic

// ========== وضعیت برنامه ==========

// اطلاعات ادمین اصلی
const adminInfo = {
    phone: "09021707830",
    name: "امیرمحمد یوسفی",
    cardNumber: "603799822276759"
};

// مدیریت وضعیت کاربر
const userState = {
    isLoggedIn: false,
    currentUser: null
};

// مدیریت سبد خرید (موقت در localStorage)
const cartState = {
    items: JSON.parse(localStorage.getItem('cart')) || [],
    total: 0
};

// ذخیره محصولات در حافظه
let products = [];

// ========== توابع کمکی ==========

// فرمت اعداد به فارسی
function formatNumber(num) {
    return new Intl.NumberFormat('fa-IR').format(num);
}

// فرمت تاریخ به فارسی
function formatDate(date) {
    const d = new Date(date);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return d.toLocaleDateString('fa-IR', options);
}

// ذخیره سبد خرید در localStorage
function saveCartToLocalStorage() {
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

// نمایش پیام
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
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

// کپی متن به کلیپ‌بورد
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showNotification('متن کپی شد!', 'success');
        })
        .catch(err => {
            console.error('خطا در کپی کردن:', err);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('متن کپی شد!', 'success');
        });
};

// ========== مدیریت محصولات ==========

// بارگذاری محصولات از Supabase
async function loadProducts() {
    try {
        showNotification('در حال بارگذاری محصولات...', 'info');
        
        // فراخوانی تابع از supabase-service.js
        const result = await window.supabaseFunctions.getAllProducts();
        
        if (result.success && result.products) {
            products = result.products;
            renderProducts();
            renderPricingTable();
            showNotification('محصولات با موفقیت بارگذاری شدند', 'success');
        } else {
            console.error('خطا در بارگذاری محصولات:', result.error);
            
            // استفاده از داده‌های پیش‌فرض در صورت خطا
            products = getDefaultProducts();
            renderProducts();
            renderPricingTable();
            showNotification('استفاده از محصولات پیش‌فرض', 'warning');
        }
    } catch (error) {
        console.error('خطا در بارگذاری محصولات:', error);
        products = getDefaultProducts();
        renderProducts();
        renderPricingTable();
        showNotification('خطا در اتصال به سرور', 'error');
    }
}

// محصولات پیش‌فرض
function getDefaultProducts() {
    return [
        {
            id: 1,
            name: 'پنل اختصاصی',
            description: 'پنل اختصاصی با کنترل کامل و پشتیبانی ۲۴ ساعته',
            price: 50000,
            category: 'panels',
            icon: 'fas fa-server'
        },
        {
            id: 2,
            name: 'اشتراک VPN یک ماهه',
            description: 'VPN پرسرعت با IP ثابت و بدون محدودیت',
            price: 25000,
            category: 'subscriptions',
            icon: 'fas fa-shield-alt'
        },
        {
            id: 3,
            name: 'طراحی تامنیل',
            description: 'طراحی حرفه‌ای تامنیل برای ویدیوهای شما',
            price: 30000,
            category: 'design',
            icon: 'fas fa-image'
        }
    ];
}

// نمایش محصولات
function renderProducts(filter = 'all') {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(product => product.category === filter);
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-box-open"></i>
                <p>محصولی در این دسته‌بندی موجود نیست</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-category', product.category);
        
        const isInCart = cartState.items.find(item => item.id === product.id);
        
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

// نمایش جدول قیمت‌ها
function renderPricingTable() {
    const pricingTableBody = document.getElementById('pricing-table-body');
    if (!pricingTableBody) return;
    
    pricingTableBody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        const isInCart = cartState.items.find(item => item.id === product.id);
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.description || ''}</td>
            <td class="price-cell">${formatNumber(product.price)} تومان</td>
            <td>
                ${isInCart 
                    ? `<button class="btn btn-secondary" onclick="removeFromCart(${product.id})">حذف از سبد</button>` 
                    : `<button class="btn btn-primary" onclick="addToCart(${product.id})">افزودن به سبد</button>`}
            </td>
        `;
        
        pricingTableBody.appendChild(row);
    });
}

// ========== مدیریت سبد خرید ==========

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
    
    showNotification(`${product.name} به سبد خرید اضافه شد`, 'success');
}

// حذف محصول از سبد خرید
function removeFromCart(productId) {
    const itemIndex = cartState.items.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        const product = products.find(p => p.id === productId);
        cartState.items.splice(itemIndex, 1);
        saveCartToLocalStorage();
        updateCartCount();
        renderProducts();
        renderPricingTable();
        renderCartItems();
        
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

// ========== مدیریت کاربران ==========

// ورود/عضویت کاربر
async function loginUser(phone) {
    showNotification('در حال ورود...', 'info');
    
    try {
        // فراخوانی تابع از supabase-service.js
        const result = await window.supabaseFunctions.loginOrRegisterUser(phone);
        
        if (result.success) {
            userState.isLoggedIn = true;
            userState.currentUser = result.user;
            
            updateUserUI();
            showNotification(`خوش آمدید ${result.user.first_name || 'کاربر'}!`, 'success');
            
            // اگر کاربر ادمین بود
            if (phone === adminInfo.phone) {
                setTimeout(() => {
                    const adminNavItem = document.getElementById('admin-nav-item');
                    if (adminNavItem) {
                        adminNavItem.style.display = 'block';
                    }
                }, 500);
            }
            
            return true;
        } else {
            showNotification('خطا در ورود: ' + result.error, 'error');
            return false;
        }
    } catch (error) {
        console.error('خطا در ورود:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
        return false;
    }
}

// خروج کاربر
function logoutUser() {
    userState.isLoggedIn = false;
    userState.currentUser = null;
    
    updateUserUI();
    const adminNavItem = document.getElementById('admin-nav-item');
    if (adminNavItem) {
        adminNavItem.style.display = 'none';
    }
    showNotification('با موفقیت خارج شدید', 'info');
}

// به روزرسانی رابط کاربری بر اساس وضعیت ورود
function updateUserUI() {
    const loginBtn = document.getElementById('login-btn');
    
    if (userState.isLoggedIn && userState.currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userState.currentUser.first_name || 'پروفایل'}`;
        
        // به روزرسانی اطلاعات پروفایل
        if (document.getElementById('profile-name')) {
            document.getElementById('profile-name').textContent = userState.currentUser.first_name || '---';
            document.getElementById('profile-lastname').textContent = userState.currentUser.last_name || '---';
            document.getElementById('profile-phone').textContent = userState.currentUser.phone || '---';
        }
    } else {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> ورود';
    }
}

// ========== مدیریت سفارشات ==========

// تکمیل فرآیند خرید
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
    
    // تبدیل فایل به base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const receiptImage = e.target.result;
        
        // آماده کردن داده‌های سفارش
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
                image: receiptImage,
                note: receiptNote,
                status: 'در انتظار تأیید'
            },
            items: cartState.items
        };
        
        showNotification('در حال ثبت سفارش...', 'info');
        
        try {
            // ذخیره در Supabase
            const result = await window.supabaseFunctions.createNewOrder(orderData);
            
            if (result.success) {
                // به روزرسانی اطلاعات کاربر
                if (userState.currentUser.first_name !== firstName || userState.currentUser.last_name !== lastName) {
                    await window.supabaseFunctions.updateUserInfo(
                        userState.currentUser.id, 
                        firstName, 
                        lastName
                    );
                }
                
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
                showNotification(`سفارش شما با موفقیت ثبت شد. کد پیگیری: ${orderData.id}`, 'success');
                
                // ریست فرم
                document.getElementById('first-name').value = '';
                document.getElementById('last-name').value = '';
                document.getElementById('checkout-phone').value = '';
                document.getElementById('receipt-file').value = '';
                document.getElementById('receipt-note').value = '';
            } else {
                showNotification('خطا در ثبت سفارش: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('خطا در ثبت سفارش:', error);
            showNotification('خطا در ارتباط با سرور', 'error');
        }
    };
    
    reader.readAsDataURL(receiptFile);
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

// ========== مدیریت تیکت‌ها ==========

// ارسال تیکت پشتیبانی
async function submitSupportTicket() {
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
    
    const ticketData = {
        id: Date.now(),
        userId: userState.currentUser.id,
        subject: subject,
        message: message
    };
    
    showNotification('در حال ارسال تیکت...', 'info');
    
    try {
        const result = await window.supabaseFunctions.createNewTicket(ticketData);
        
        if (result.success) {
            // بستن مودال و ریست فرم
            closeModal('ticket-modal', 'ticket-overlay');
            document.getElementById('ticket-subject').value = '';
            document.getElementById('ticket-message').value = '';
            
            showNotification('تیکت شما با موفقیت ارسال شد. به زودی پاسخ می‌دهیم.', 'success');
        } else {
            showNotification('خطا در ارسال تیکت: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('خطا در ارسال تیکت:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

// ========== نمایش سابقه خرید ==========

async function renderOrdersHistory() {
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
    
    showNotification('در حال بارگذاری سفارشات...', 'info');
    
    try {
        const result = await window.supabaseFunctions.getUserOrders(userState.currentUser.id);
        
        if (result.success && result.orders && result.orders.length > 0) {
            // نمایش سفارشات از جدید به قدیم
            result.orders.sort((a, b) => b.id - a.id).forEach(order => {
                const orderItem = document.createElement('div');
                orderItem.className = 'order-history-item';
                
                const itemsList = order.items.map(item => 
                    `<div class="order-history-product">
                        <span>${item.name} (${item.quantity} عدد)</span>
                        <span>${formatNumber(item.price * item.quantity)} تومان</span>
                    </div>`
                ).join('');
                
                const orderDate = order.created_at ? formatDate(order.created_at) : '---';
                
                orderItem.innerHTML = `
                    <div class="order-history-header">
                        <span class="order-id">سفارش #${order.id}</span>
                        <span class="order-date">${orderDate}</span>
                    </div>
                    <div class="order-history-products">
                        ${itemsList}
                    </div>
                    <div class="order-history-footer">
                        <span>وضعیت: <strong class="status-${order.status === 'تأیید شده' ? 'success' : order.status === 'رد شده' ? 'danger' : 'warning'}">${order.status || 'در انتظار'}</strong></span>
                        <span class="order-history-total">${formatNumber(order.total)} تومان</span>
                    </div>
                `;
                
                ordersList.appendChild(orderItem);
            });
        } else {
            ordersList.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-history"></i>
                    <p>شما تاکنون خریدی انجام نداده‌اید</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('خطا در دریافت سفارشات:', error);
        ordersList.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-exclamation-circle"></i>
                <p>خطا در بارگذاری سفارشات</p>
            </div>
        `;
    }
}

// ========== نمایش تیکت‌های کاربر ==========

async function renderUserTickets() {
    const container = document.getElementById('user-tickets-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!userState.isLoggedIn) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>لطفاً ابتدا وارد شوید</p>
            </div>
        `;
        return;
    }
    
    showNotification('در حال بارگذاری تیکت‌ها...', 'info');
    
    try {
        const result = await window.supabaseFunctions.getUserTickets(userState.currentUser.id);
        
        if (result.success && result.tickets && result.tickets.length > 0) {
            result.tickets.forEach(ticket => {
                const ticketElement = document.createElement('div');
                ticketElement.className = 'user-ticket-item';
                
                const ticketDate = ticket.created_at ? formatDate(ticket.created_at) : '---';
                
                ticketElement.innerHTML = `
                    <div class="ticket-summary">
                        <h4>${ticket.subject}</h4>
                        <p>${ticket.message.substring(0, 150)}${ticket.message.length > 150 ? '...' : ''}</p>
                        <div class="ticket-meta">
                            <span class="status-badge status-${ticket.status === 'جدید' ? 'new' : ticket.status === 'در حال بررسی' ? 'pending' : 'solved'}">
                                ${ticket.status}
                            </span>
                            <span class="ticket-date">${ticketDate}</span>
                            <span class="reply-count">${ticket.replies ? ticket.replies.length : 0} پاسخ</span>
                        </div>
                        <button class="btn btn-secondary" onclick="viewUserTicketDetails(${ticket.id})">
                            مشاهده جزئیات
                        </button>
                    </div>
                `;
                
                container.appendChild(ticketElement);
            });
        } else {
            container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-ticket-alt"></i>
                    <p>شما هنوز تیکتی ارسال نکرده‌اید</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('خطا در دریافت تیکت‌های کاربر:', error);
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>خطا در بارگذاری تیکت‌ها</p>
            </div>
        `;
    }
}

// ========== پنل ادمین ==========

// باز کردن پنل ادمین
async function openAdminPanel() {
    if (!userState.isLoggedIn || userState.currentUser.phone !== adminInfo.phone) {
        showNotification('شما دسترسی ادمین ندارید', 'error');
        return;
    }
    
    await renderAdminPanel();
    openModal('admin-modal', 'admin-overlay');
}

// رندر پنل ادمین
async function renderAdminPanel() {
    showNotification('در حال بارگذاری پنل ادمین...', 'info');
    
    try {
        // دریافت آمار
        const statsResult = await window.supabaseFunctions.getDashboardStats();
        if (statsResult.success) {
            document.getElementById('stats-users-count').textContent = statsResult.stats.users;
            document.getElementById('stats-orders-count').textContent = statsResult.stats.orders;
            document.getElementById('stats-total-income').textContent = formatNumber(statsResult.stats.totalIncome) + " تومان";
        }
        
        // دریافت سفارشات
        await renderAdminOrders();
        
        // دریافت تیکت‌ها
        await renderAdminTickets();
        
    } catch (error) {
        console.error('خطا در بارگذاری پنل ادمین:', error);
        showNotification('خطا در بارگذاری پنل ادمین', 'error');
    }
}

// رندر سفارشات در پنل ادمین
async function renderAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;
    
    try {
        const result = await window.supabaseFunctions.getAllOrders();
        
        if (result.success && result.orders) {
            container.innerHTML = '';
            
            result.orders.forEach(order => {
                const item = document.createElement('div');
                item.className = 'admin-item';
                
                const itemsText = order.items ? order.items.map(item => `${item.name} (${item.quantity} عدد)`).join('، ') : '';
                const customer = order.customer_info || {};
                const receipt = order.receipt_info || {};
                
                item.innerHTML = `
                    <div style="flex: 1;">
                        <h4>سفارش #${order.id}</h4>
                        <p><strong>مشتری:</strong> ${customer.firstName || ''} ${customer.lastName || ''}</p>
                        <p><strong>شماره:</strong> ${customer.phone || ''}</p>
                        <p><strong>محصولات:</strong> ${itemsText}</p>
                        <p><strong>توضیحات رسید:</strong> ${receipt.note || 'بدون توضیح'}</p>
                        <p><strong>تاریخ:</strong> ${order.created_at ? formatDate(order.created_at) : '---'}</p>
                        <p><strong>مبلغ:</strong> ${formatNumber(order.total)} تومان</p>
                        <p><strong>وضعیت:</strong> 
                            <span class="status-badge status-${order.status === 'تأیید شده' ? 'success' : order.status === 'رد شده' ? 'danger' : 'warning'}">
                                ${order.status || 'در انتظار'}
                            </span>
                        </p>
                    </div>
                    <div class="admin-item-actions">
                        ${receipt.image ? 
                            `<button class="btn btn-primary" onclick="viewReceiptAdmin(${order.id})">
                                <i class="fas fa-receipt"></i> مشاهده رسید
                            </button>` : 
                            `<span class="badge-warning">بدون رسید</span>`
                        }
                        <button class="btn btn-success" onclick="approveOrder(${order.id})">
                            <i class="fas fa-check"></i> تأیید
                        </button>
                        <button class="btn btn-danger" onclick="rejectOrder(${order.id})">
                            <i class="fas fa-times"></i> رد
                        </button>
                    </div>
                `;
                
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p class="empty-message">هنوز سفارشی ثبت نشده است</p>';
        }
    } catch (error) {
        console.error('خطا در دریافت سفارشات:', error);
        container.innerHTML = '<p class="empty-message">خطا در بارگذاری سفارشات</p>';
    }
}

// رندر تیکت‌ها در پنل ادمین
async function renderAdminTickets() {
    const container = document.getElementById('admin-tickets-list');
    if (!container) return;
    
    try {
        const result = await window.supabaseFunctions.getAllTickets();
        
        if (result.success && result.tickets) {
            container.innerHTML = '';
            
            result.tickets.forEach(ticket => {
                const item = document.createElement('div');
                item.className = 'admin-item ticket-item';
                
                const user = ticket.users || {};
                const ticketDate = ticket.created_at ? formatDate(ticket.created_at) : '---';
                
                item.innerHTML = `
                    <div style="flex: 1;">
                        <div class="ticket-header">
                            <h4>${ticket.subject}</h4>
                            <span class="ticket-id">#${ticket.id}</span>
                        </div>
                        <div class="ticket-info">
                            <p><strong>ارسال کننده:</strong> ${user.first_name || ''} ${user.last_name || ''} (${user.phone || ''})</p>
                            <p><strong>تاریخ:</strong> ${ticketDate}</p>
                            <p><strong>پیام:</strong> ${ticket.message.substring(0, 100)}${ticket.message.length > 100 ? '...' : ''}</p>
                        </div>
                        <div class="ticket-meta">
                            <span class="status-badge status-${ticket.status === 'جدید' ? 'new' : ticket.status === 'در حال بررسی' ? 'pending' : 'solved'}">
                                ${ticket.status}
                            </span>
                            <span class="reply-count">${ticket.replies ? ticket.replies.length : 0} پاسخ</span>
                        </div>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn btn-primary" onclick="viewTicketAdmin(${ticket.id})">
                            <i class="fas fa-eye"></i> مشاهده
                        </button>
                        <button class="btn btn-success" onclick="markTicketAsSolved(${ticket.id})">
                            <i class="fas fa-check"></i> حل شد
                        </button>
                    </div>
                `;
                
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p class="empty-message">هیچ تیکتی ارسال نشده است</p>';
        }
    } catch (error) {
        console.error('خطا در دریافت تیکت‌ها:', error);
        container.innerHTML = '<p class="empty-message">خطا در بارگذاری تیکت‌ها</p>';
    }
}

// تأیید سفارش
async function approveOrder(orderId) {
    try {
        const result = await window.supabaseFunctions.updateOrderStatus(orderId, 'تأیید شده');
        
        if (result.success) {
            showNotification('سفارش تأیید شد', 'success');
            await renderAdminOrders();
        } else {
            showNotification('خطا در تأیید سفارش', 'error');
        }
    } catch (error) {
        console.error('خطا در تأیید سفارش:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

// رد سفارش
async function rejectOrder(orderId) {
    try {
        const result = await window.supabaseFunctions.updateOrderStatus(orderId, 'رد شده');
        
        if (result.success) {
            showNotification('سفارش رد شد', 'warning');
            await renderAdminOrders();
        } else {
            showNotification('خطا در رد سفارش', 'error');
        }
    } catch (error) {
        console.error('خطا در رد سفارش:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

// علامت زدن تیکت به عنوان حل شده
async function markTicketAsSolved(ticketId) {
    try {
        const result = await window.supabaseFunctions.updateTicketStatus(ticketId, 'حل شده');
        
        if (result.success) {
            showNotification('تیکت به عنوان حل شده علامت زده شد', 'success');
            await renderAdminTickets();
        } else {
            showNotification('خطا در بروزرسانی تیکت', 'error');
        }
    } catch (error) {
        console.error('خطا در بروزرسانی تیکت:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
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

// ========== مدیریت منوی موبایل ==========

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

// ========== مدیریت سبد خرید ==========

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

// ========== تابع اصلی اجرای برنامه ==========

export function initializeApp() {
    console.log("برنامه در حال راه‌اندازی...");
    
    // مقداردهی اولیه
    updateCartCount();
    renderCartItems();
    updateUserUI();
    
    // برقراری ارتباط بین توابع و window
    setupGlobalFunctions();
    
    // بارگذاری محصولات
    loadProducts();
    
    // تنظیم رویدادها
    setupEventListeners();
    
    return true;
}

// ========== اتصال توابع به window ==========

function setupGlobalFunctions() {
    // توابع عمومی
    window.formatNumber = formatNumber;
    window.formatDate = formatDate;
    window.showNotification = showNotification;
    
    // توابع محصولات و سبد خرید
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    
    // توابع ادمین
    window.openAdminPanel = openAdminPanel;
    window.approveOrder = approveOrder;
    window.rejectOrder = rejectOrder;
    window.markTicketAsSolved = markTicketAsSolved;
    window.viewUserTicketDetails = viewUserTicketDetails;
    
    // توابع مودال
    window.openModal = openModal;
    window.closeModal = closeModal;
    
    // توابع تیکت‌ها
    window.viewTicketAdmin = viewTicketAdmin;
    window.viewReceiptAdmin = viewReceiptAdmin;
}

// ========== تنظیم رویدادها ==========

function setupEventListeners() {
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
        submitLogin.addEventListener('click', async function() {
            const phoneInput = document.getElementById('phone');
            const phone = phoneInput.value.trim();
            
            if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
                showNotification('لطفاً شماره موبایل معتبر وارد کنید', 'warning');
                return;
            }
            
            const success = await loginUser(phone);
            if (success) {
                phoneInput.value = '';
                closeModal('login-modal', 'login-overlay');
            }
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
                document.getElementById('first-name').value = userState.currentUser.first_name || '';
                document.getElementById('last-name').value = userState.currentUser.last_name || '';
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
    const ordersBtn = document.getElementById('orders-btn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await renderOrdersHistory();
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
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
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
    
    // تیکت‌های من
    const myTicketsBtn = document.getElementById('mytickets-btn');
    if (myTicketsBtn) {
        myTicketsBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await renderUserTickets();
            openModal('mytickets-modal', 'mytickets-overlay');
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
    
    // تب‌های ادمین
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // غیرفعال کردن همه تب‌ها
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            
            // فعال کردن تب انتخاب شده
            this.classList.add('active');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
    
    // اسکرول نرم برای لینک‌های داخلی
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#cart' || href === '#login' || href === '#profile' || 
                href === '#orders' || href === '#admin' || href === '#ticket' ||
                href === '#mytickets') {
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
}
