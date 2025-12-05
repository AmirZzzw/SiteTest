// supabase-service.js - نسخه ساده
console.log('✅ Loading Supabase service...');

const supabaseFunctions = {
    loginOrRegisterUser: async (phone, firstName = '', lastName = '', password = '') => {
        console.log('🔑 Login/register for:', phone);
        
        const user = {
            id: Date.now(),
            phone: phone,
            first_name: firstName || 'کاربر',
            last_name: lastName || '',
            is_admin: phone === '09021707830'
        };
        
        localStorage.setItem('sidka_user_session', JSON.stringify({
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        }));
        
        return { success: true, user: user, isNew: true };
    },
    
    loginUser: async (phone, password) => {
        console.log('🔑 Login for:', phone);
        
        if (phone === '09021707830' && password !== 'SidkaShop1234') {
            return { success: false, error: 'رمز عبور ادمین اشتباه است' };
        }
        
        const user = {
            id: Date.now(),
            phone: phone,
            first_name: phone === '09021707830' ? 'امیرمحمد' : 'کاربر',
            last_name: phone === '09021707830' ? 'یوسفی' : 'عزیز',
            is_admin: phone === '09021707830'
        };
        
        localStorage.setItem('sidka_user_session', JSON.stringify({
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        }));
        
        return { success: true, user: user };
    },
    
    registerUser: async (phone, firstName, lastName, password) => {
        console.log('📝 Register:', phone);
        
        const user = {
            id: Date.now(),
            phone: phone,
            first_name: firstName,
            last_name: lastName,
            password: password,
            is_admin: false
        };
        
        localStorage.setItem('sidka_user_session', JSON.stringify({
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        }));
        
        return { success: true, user: user };
    },
    
    getAllProducts: async () => {
        const products = [
            { id: 1, name: 'ساخت پنل', description: 'ساخت پنل اختصاصی با امکانات کامل', price: 900000, category: 'panels', icon: 'fas fa-plus-circle', active: true },
            { id: 2, name: 'آپدیت پنل', description: 'ارتقاء و به‌روزرسانی پنل موجود', price: 235000, category: 'panels', icon: 'fas fa-sync-alt', active: true },
            { id: 3, name: 'اشتراک سلف تلگرام - یک ماهه', description: 'اشتراک یکماهه سلف تلگرام', price: 40000, category: 'subscriptions', icon: 'fab fa-telegram', active: true },
            { id: 4, name: 'اشتراک V2rayNG - 50 گیگ', description: 'اشتراک 50 گیگ کاربر نامحدود یکماهه v2rayNG', price: 30000, category: 'subscriptions', icon: 'fas fa-server', active: true },
            { id: 5, name: 'ویاکس پنل - یکروزه', description: 'اشتراک یکروزه ویاکس پنل - تک کاربره', price: 15000, category: 'subscriptions', icon: 'fas fa-bolt', active: true },
            { id: 6, name: 'ویاکس پنل - یک هفته', description: 'اشتراک یک هفته ویاکس پنل - تک کاربره', price: 80000, category: 'subscriptions', icon: 'fas fa-calendar-week', active: true },
            { id: 7, name: 'ویاکس پنل - یکماهه', description: 'اشتراک یکماهه ویاکس پنل - تک کاربره', price: 230000, category: 'subscriptions', icon: 'fas fa-calendar-alt', active: true },
            { id: 8, name: 'ویاکس پنل - دائمی', description: 'اشتراک دائمی ویاکس پنل - تک کاربره', price: 350000, category: 'subscriptions', icon: 'fas fa-infinity', active: true },
            { id: 9, name: 'تامنیل یوتیوب', description: 'طراحی تامنیل حرفه‌ای برای یوتیوب', price: 50000, category: 'design', icon: 'fab fa-youtube', active: true },
            { id: 10, name: 'پروفایل چنل', description: 'طراحی پروفایل حرفه‌ای برای چنل', price: 50000, category: 'design', icon: 'fas fa-id-card', active: true }
        ];
        
        return { success: true, products: products, count: products.length };
    },
    
    createNewOrder: async (orderData) => {
        console.log('🛒 Creating order:', orderData.id);
        
        const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('local_orders', JSON.stringify(orders));
        
        localStorage.removeItem('sidka_cart');
        
        return { success: true, order: orderData, message: 'سفارش با موفقیت ثبت شد' };
    },
    
    getUserOrders: async (userId) => {
        const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        const userOrders = orders.filter(o => o.userId == userId);
        return { success: true, orders: userOrders };
    },
    
    createNewTicket: async (ticketData) => {
        console.log('🎫 Creating ticket:', ticketData.subject);
        
        const tickets = JSON.parse(localStorage.getItem('local_tickets') || '[]');
        const ticket = {
            id: Date.now(),
            ...ticketData,
            created_at: new Date().toISOString(),
            status: 'جدید'
        };
        tickets.push(ticket);
        localStorage.setItem('local_tickets', JSON.stringify(tickets));
        
        return { success: true, ticket: ticket };
    },
    
    getUserTickets: async (userId) => {
        const tickets = JSON.parse(localStorage.getItem('local_tickets') || '[]');
        const userTickets = tickets.filter(t => t.userId == userId);
        return { success: true, tickets: userTickets };
    },
    
    getAllOrders: () => ({ success: true, orders: JSON.parse(localStorage.getItem('local_orders') || '[]') }),
    getAllTickets: () => ({ success: true, tickets: JSON.parse(localStorage.getItem('local_tickets') || '[]') }),
    getAllUsers: () => ({ success: true, users: [] }),
    updateOrderStatus: () => ({ success: true }),
    updateTicketStatus: () => ({ success: true }),
    addTicketReply: () => ({ success: true }),
    updateUserInfo: () => ({ success: true }),
    getDashboardStats: () => ({ success: true, stats: { users: 1, orders: 0, totalIncome: 0, newTickets: 0 } }),
    getOrderReceipt: () => ({ success: false, error: 'رسید یافت نشد' })
};

window.supabaseFunctions = supabaseFunctions;
console.log('✅ Supabase service loaded (local storage version)');
