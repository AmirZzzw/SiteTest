// fallback-data.js
// Fallback data for when Supabase is unavailable

console.log('⚠️ Loading fallback data...');

// محصولات پیش‌فرض
const fallbackProducts = [
    {
        id: 1,
        name: 'پنل اختصاصی',
        description: 'پنل کامل با کنترل کامل و پشتیبانی ۲۴ ساعته',
        price: 50000,
        category: 'panels',
        icon: 'fas fa-server',
        active: true
    },
    {
        id: 2,
        name: 'VPN یک ماهه',
        description: 'VPN پرسرعت با IP ثابت و بدون محدودیت ترافیک',
        price: 25000,
        category: 'subscriptions',
        icon: 'fas fa-shield-alt',
        active: true
    },
    {
        id: 3,
        name: 'طراحی تامنیل',
        description: 'طراحی حرفه‌ای تامنیل برای ویدیوهای شما',
        price: 30000,
        category: 'design',
        icon: 'fas fa-image',
        active: true
    },
    {
        id: 4,
        name: 'طراحی لوگو',
        description: 'طراحی لوگو اختصاصی برای برند شما',
        price: 80000,
        category: 'design',
        icon: 'fas fa-paint-brush',
        active: true
    },
    {
        id: 5,
        name: 'اشتراک شش ماهه',
        description: 'VPN شش ماهه با تخفیف ویژه',
        price: 120000,
        category: 'subscriptions',
        icon: 'fas fa-calendar-alt',
        active: true
    }
];

// توابع شبیه‌سازی شده
const fallbackFunctions = {
    getAllProducts: () => {
        console.log('Fallback: Returning products');
        return Promise.resolve({
            success: true,
            products: fallbackProducts
        });
    },
    
    loginOrRegisterUser: (phone, firstName = '', lastName = '', password = '') => {
        console.log('Fallback: Login/register for', phone);
        const user = {
            id: Date.now(),
            phone: phone,
            first_name: firstName || 'کاربر',
            last_name: lastName || '',
            is_admin: phone === '09021707830',
            created_at: new Date().toISOString()
        };
        
        // ذخیره در localStorage
        localStorage.setItem('fallback_user', JSON.stringify(user));
        
        return Promise.resolve({
            success: true,
            user: user,
            isNew: true
        });
    },
    
    registerUser: (phone, firstName, lastName, password) => {
        return fallbackFunctions.loginOrRegisterUser(phone, firstName, lastName, password);
    },
    
    createNewOrder: (orderData) => {
        console.log('Fallback: Creating order', orderData.id);
        return Promise.resolve({
            success: true,
            order: {
                id: orderData.id,
                ...orderData,
                created_at: new Date().toISOString()
            }
        });
    },
    
    getUserOrders: (userId) => {
        const orders = JSON.parse(localStorage.getItem('fallback_orders') || '[]');
        return Promise.resolve({
            success: true,
            orders: orders.filter(o => o.userId === userId)
        });
    },
    
    createNewTicket: (ticketData) => {
        const tickets = JSON.parse(localStorage.getItem('fallback_tickets') || '[]');
        tickets.push(ticketData);
        localStorage.setItem('fallback_tickets', JSON.stringify(tickets));
        
        return Promise.resolve({
            success: true,
            ticket: ticketData
        });
    },
    
    getDashboardStats: () => {
        return Promise.resolve({
            success: true,
            stats: {
                users: 1,
                orders: 0,
                totalIncome: 0,
                newTickets: 0
            }
        });
    },
    
    // توابع دیگر با موفقیت خالی
    getAllOrders: () => Promise.resolve({ success: true, orders: [] }),
    updateOrderStatus: () => Promise.resolve({ success: true }),
    getUserTickets: () => Promise.resolve({ success: true, tickets: [] }),
    getAllTickets: () => Promise.resolve({ success: true, tickets: [] }),
    addTicketReply: () => Promise.resolve({ success: true }),
    updateTicketStatus: () => Promise.resolve({ success: true }),
    updateUserInfo: () => Promise.resolve({ success: true }),
    getOrderReceipt: () => Promise.resolve({ success: true, receipt: null }),
    checkAuthToken: () => Promise.resolve({ success: false }),
    clearAuthData: () => {
        localStorage.removeItem('fallback_user');
        localStorage.removeItem('fallback_orders');
        localStorage.removeItem('fallback_tickets');
    },
    getUserFromStorage: () => {
        const user = localStorage.getItem('fallback_user');
        return user ? JSON.parse(user) : null;
    },
    saveUserToStorage: (user) => {
        localStorage.setItem('fallback_user', JSON.stringify(user));
        return true;
    }
};

// اگر توابع اصلی وجود ندارن، از fallback استفاده کن
if (!window.supabaseFunctions) {
    console.log('Using fallback functions');
    window.supabaseFunctions = fallbackFunctions;
    
    // همچنین برای توابع ضروری
    if (!window.formatNumber) {
        window.formatNumber = (num) => new Intl.NumberFormat('fa-IR').format(num);
    }
    
    if (!window.copyToClipboard) {
        window.copyToClipboard = (text) => {
            navigator.clipboard.writeText(text)
                .then(() => alert('کپی شد!'))
                .catch(() => {
                    const el = document.createElement('textarea');
                    el.value = text;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    alert('کپی شد!');
                });
        };
    }
}

// راه‌اندازی اولیه fallback
console.log('✅ Fallback data loaded');
