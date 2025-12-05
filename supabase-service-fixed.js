// supabase-service-fixed.js - با ذخیره‌سازی بر اساس کاربر
console.log('🔧 Loading User-Based Storage Service...');

// ========== سیستم ذخیره‌سازی مبتنی بر کاربر ==========

// کلیدهای ذخیره‌سازی برای هر کاربر
function getUserStorageKey(userId, dataType) {
    return `sidka_${dataType}_user_${userId}`;
}

// ذخیره داده برای کاربر خاص
function saveUserData(userId, dataType, data) {
    try {
        const key = getUserStorageKey(userId, dataType);
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`✅ Saved ${dataType} for user ${userId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error saving ${dataType}:`, error);
        return false;
    }
}

// دریافت داده کاربر
function getUserData(userId, dataType) {
    try {
        const key = getUserStorageKey(userId, dataType);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`❌ Error reading ${dataType}:`, error);
        return [];
    }
}

// ادغام داده‌های کاربر با داده‌های عمومی
function mergeUserData(userId, dataType) {
    try {
        // داده‌های کاربر
        const userKey = getUserStorageKey(userId, dataType);
        let userData = JSON.parse(localStorage.getItem(userKey) || '[]');
        
        // داده‌های عمومی (برای سازگاری با نسخه قدیم)
        const publicKey = `sidka_${dataType}`;
        let publicData = JSON.parse(localStorage.getItem(publicKey) || '[]');
        
        // فقط داده‌های مربوط به این کاربر رو از عمومی بگیر
        const userPublicData = publicData.filter(item => 
            item.userId == userId || item.user_id == userId
        );
        
        // ادغام و حذف تکراری‌ها
        const allData = [...userData, ...userPublicData];
        const uniqueData = [];
        const seenIds = new Set();
        
        allData.forEach(item => {
            if (item.id && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                uniqueData.push(item);
            }
        });
        
        // ذخیره در مخزن کاربر
        saveUserData(userId, dataType, uniqueData);
        
        // حذف داده‌های کاربر از مخزن عمومی
        const remainingPublicData = publicData.filter(item => 
            item.userId != userId && item.user_id != userId
        );
        localStorage.setItem(publicKey, JSON.stringify(remainingPublicData));
        
        return uniqueData;
    } catch (error) {
        console.error(`❌ Error merging ${dataType}:`, error);
        return [];
    }
}

// انتقال داده‌های قدیم به سیستم جدید
function migrateOldData() {
    try {
        console.log('🔄 Migrating old data to new system...');
        
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        
        // گروه‌بندی سفارشات بر اساس کاربر
        const ordersByUser = {};
        orders.forEach(order => {
            const userId = order.userId || order.user_id;
            if (userId) {
                if (!ordersByUser[userId]) ordersByUser[userId] = [];
                ordersByUser[userId].push(order);
            }
        });
        
        // ذخیره برای هر کاربر
        Object.keys(ordersByUser).forEach(userId => {
            saveUserData(userId, 'orders', ordersByUser[userId]);
        });
        
        // همین کار برای تیکت‌ها
        const ticketsByUser = {};
        tickets.forEach(ticket => {
            const userId = ticket.userId || ticket.user_id;
            if (userId) {
                if (!ticketsByUser[userId]) ticketsByUser[userId] = [];
                ticketsByUser[userId].push(ticket);
            }
        });
        
        Object.keys(ticketsByUser).forEach(userId => {
            saveUserData(userId, 'tickets', ticketsByUser[userId]);
        });
        
        console.log('✅ Data migration completed');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
    }
}

// اجرای مهاجرت هنگام بارگذاری
migrateOldData();

// ========== توابع اصلی ==========

// 1. ایجاد سفارش جدید
async function createNewOrder(orderData) {
    try {
        console.log('🛒 Creating order for user:', orderData.userId);
        
        const order = {
            id: orderData.id || Date.now(),
            userId: orderData.userId,
            user_id: orderData.userId,
            total: orderData.total || 0,
            status: 'در انتظار تأیید',
            customer_info: orderData.customerInfo || {},
            receipt_info: orderData.receipt || {},
            items: orderData.items || [],
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        // ذخیره برای کاربر
        const userOrders = getUserData(orderData.userId, 'orders');
        userOrders.push(order);
        saveUserData(orderData.userId, 'orders', userOrders);
        
        // همچنین در مخزن عمومی (برای سازگاری)
        const publicOrders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        publicOrders.push(order);
        localStorage.setItem('sidka_orders', JSON.stringify(publicOrders));
        
        // خالی کردن سبد خرید
        localStorage.removeItem('sidka_cart');
        
        console.log(`✅ Order #${order.id} saved for user ${orderData.userId}`);
        
        return {
            success: true,
            order: order,
            message: 'سفارش با موفقیت ثبت شد'
        };
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
        return {
            success: false,
            error: 'خطا در ثبت سفارش'
        };
    }
}

// 2. دریافت سفارشات کاربر
async function getUserOrders(userId) {
    try {
        console.log(`📋 Getting orders for user ${userId}`);
        
        // اول از مخزن کاربر بگیر
        let userOrders = getUserData(userId, 'orders');
        
        // اگر خالی بود، از مخزن عمومی مهاجرت کن
        if (userOrders.length === 0) {
            userOrders = mergeUserData(userId, 'orders');
        }
        
        // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
        userOrders.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
            const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        
        console.log(`📊 Found ${userOrders.length} orders for user ${userId}`);
        
        return {
            success: true,
            orders: userOrders,
            count: userOrders.length
        };
        
    } catch (error) {
        console.error('❌ Error getting user orders:', error);
        return {
            success: true,
            orders: [],
            count: 0
        };
    }
}

// 3. دریافت همه سفارشات (برای ادمین)
async function getAllOrders() {
    try {
        console.log('📋 Getting ALL orders (admin view)');
        
        // جمع‌آوری از همه کاربران
        let allOrders = [];
        const keys = Object.keys(localStorage);
        
        // سفارشات کاربران
        const userOrderKeys = keys.filter(key => key.startsWith('sidka_orders_user_'));
        userOrderKeys.forEach(key => {
            try {
                const orders = JSON.parse(localStorage.getItem(key) || '[]');
                allOrders = [...allOrders, ...orders];
            } catch (e) {
                console.warn(`⚠️ Error reading ${key}:`, e);
            }
        });
        
        // سفارشات عمومی (قدیمی)
        const publicOrders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        allOrders = [...allOrders, ...publicOrders];
        
        // حذف تکراری‌ها
        const uniqueOrders = [];
        const seenIds = new Set();
        
        allOrders.forEach(order => {
            if (order.id && !seenIds.has(order.id)) {
                seenIds.add(order.id);
                
                // اضافه کردن اطلاعات کاربر اگر موجود نیست
                if (!order.users) {
                    order.users = {
                        first_name: order.customer_info?.firstName || 'کاربر',
                        last_name: order.customer_info?.lastName || '',
                        phone: order.customer_info?.phone || '---'
                    };
                }
                
                uniqueOrders.push(order);
            }
        });
        
        // مرتب‌سازی
        uniqueOrders.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
            const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        
        console.log(`📊 Total orders: ${uniqueOrders.length}`);
        
        return {
            success: true,
            orders: uniqueOrders,
            count: uniqueOrders.length
        };
        
    } catch (error) {
        console.error('❌ Error getting all orders:', error);
        return {
            success: true,
            orders: [],
            count: 0
        };
    }
}

// 4. ایجاد تیکت جدید
async function createNewTicket(ticketData) {
    try {
        console.log('🎫 Creating ticket for user:', ticketData.userId);
        
        const ticket = {
            id: Date.now(),
            userId: ticketData.userId,
            user_id: ticketData.userId,
            subject: ticketData.subject || 'بدون موضوع',
            message: ticketData.message || 'بدون پیام',
            status: 'جدید',
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        // ذخیره برای کاربر
        const userTickets = getUserData(ticketData.userId, 'tickets');
        userTickets.push(ticket);
        saveUserData(ticketData.userId, 'tickets', userTickets);
        
        // همچنین در مخزن عمومی
        const publicTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        publicTickets.push(ticket);
        localStorage.setItem('sidka_tickets', JSON.stringify(publicTickets));
        
        console.log(`✅ Ticket #${ticket.id} saved for user ${ticketData.userId}`);
        
        return {
            success: true,
            ticket: ticket,
            message: 'تیکت با موفقیت ارسال شد'
        };
        
    } catch (error) {
        console.error('❌ Error creating ticket:', error);
        return {
            success: false,
            error: 'خطا در ارسال تیکت'
        };
    }
}

// 5. دریافت تیکت‌های کاربر
async function getUserTickets(userId) {
    try {
        console.log(`📨 Getting tickets for user ${userId}`);
        
        // از مخزن کاربر بگیر
        let userTickets = getUserData(userId, 'tickets');
        
        // اگر خالی بود، مهاجرت کن
        if (userTickets.length === 0) {
            userTickets = mergeUserData(userId, 'tickets');
        }
        
        // مرتب‌سازی
        userTickets.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
            const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        
        console.log(`📨 Found ${userTickets.length} tickets for user ${userId}`);
        
        return {
            success: true,
            tickets: userTickets,
            count: userTickets.length
        };
        
    } catch (error) {
        console.error('❌ Error getting user tickets:', error);
        return {
            success: true,
            tickets: [],
            count: 0
        };
    }
}

// 6. دریافت همه تیکت‌ها (برای ادمین)
async function getAllTickets() {
    try {
        console.log('📨 Getting ALL tickets (admin view)');
        
        // جمع‌آوری از همه کاربران
        let allTickets = [];
        const keys = Object.keys(localStorage);
        
        // تیکت‌های کاربران
        const userTicketKeys = keys.filter(key => key.startsWith('sidka_tickets_user_'));
        userTicketKeys.forEach(key => {
            try {
                const tickets = JSON.parse(localStorage.getItem(key) || '[]');
                allTickets = [...allTickets, ...tickets];
            } catch (e) {
                console.warn(`⚠️ Error reading ${key}:`, e);
            }
        });
        
        // تیکت‌های عمومی
        const publicTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        allTickets = [...allTickets, ...publicTickets];
        
        // حذف تکراری‌ها و اضافه کردن اطلاعات کاربر
        const uniqueTickets = [];
        const seenIds = new Set();
        
        allTickets.forEach(ticket => {
            if (ticket.id && !seenIds.has(ticket.id)) {
                seenIds.add(ticket.id);
                
                // اگر اطلاعات کاربر نداره
                if (!ticket.users) {
                    ticket.users = {
                        first_name: 'کاربر',
                        last_name: '',
                        phone: ticket.userId || '---'
                    };
                }
                
                uniqueTickets.push(ticket);
            }
        });
        
        // مرتب‌سازی
        uniqueTickets.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
            const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
        
        console.log(`📨 Total tickets: ${uniqueTickets.length}`);
        
        return {
            success: true,
            tickets: uniqueTickets,
            count: uniqueTickets.length
        };
        
    } catch (error) {
        console.error('❌ Error getting all tickets:', error);
        return {
            success: true,
            tickets: [],
            count: 0
        };
    }
}

// 7. به‌روزرسانی وضعیت سفارش
async function updateOrderStatus(orderId, status) {
    try {
        console.log(`📊 Updating order ${orderId} to ${status}`);
        
        // پیدا کردن سفارش در همه مخازن
        const keys = Object.keys(localStorage);
        const orderKeys = keys.filter(key => 
            key.startsWith('sidka_orders_user_') || key === 'sidka_orders'
        );
        
        let updated = false;
        
        orderKeys.forEach(key => {
            try {
                const orders = JSON.parse(localStorage.getItem(key) || '[]');
                const updatedOrders = orders.map(order => {
                    if (order.id == orderId) {
                        order.status = status;
                        order.updated_at = new Date().toISOString();
                        updated = true;
                    }
                    return order;
                });
                
                localStorage.setItem(key, JSON.stringify(updatedOrders));
            } catch (e) {
                console.warn(`⚠️ Error updating ${key}:`, e);
            }
        });
        
        if (updated) {
            console.log(`✅ Order ${orderId} status updated to ${status}`);
            return { success: true };
        } else {
            return { success: false, error: 'سفارش یافت نشد' };
        }
        
    } catch (error) {
        console.error('❌ Error updating order:', error);
        return { success: false, error: error.message };
    }
}

// 8. محصولات
async function getAllProducts() {
    // محصولات ثابت
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
    
    return {
        success: true,
        products: products,
        count: products.length
    };
}

// 9. ورود/عضویت
async function loginOrRegisterUser(phone, firstName = '', lastName = '', password = '') {
    try {
        const ADMIN_PHONE = '09021707830';
        const ADMIN_PASSWORD = 'SidkaShop1234';
        
        // ادمین
        if (phone === ADMIN_PHONE) {
            if (password !== ADMIN_PASSWORD) {
                return { success: false, error: 'رمز ادمین اشتباه است' };
            }
            
            const adminUser = {
                id: 1,
                phone: ADMIN_PHONE,
                first_name: 'امیرمحمد',
                last_name: 'یوسفی',
                is_admin: true,
                created_at: new Date().toISOString()
            };
            
            // ذخیره سشن
            localStorage.setItem('sidka_user_session', JSON.stringify({
                user: adminUser,
                expiry: Date.now() + (24 * 60 * 60 * 1000)
            }));
            
            return { success: true, user: adminUser };
        }
        
        // کاربر عادی - ایجاد یا بازیابی
        let user;
        const userKey = `sidka_user_${phone}`;
        const storedUser = localStorage.getItem(userKey);
        
        if (storedUser) {
            user = JSON.parse(storedUser);
            console.log(`✅ Existing user found: ${user.first_name} ${user.last_name}`);
        } else {
            user = {
                id: Date.now(),
                phone: phone,
                first_name: firstName || 'کاربر',
                last_name: lastName || '',
                is_admin: false,
                created_at: new Date().toISOString()
            };
            
            localStorage.setItem(userKey, JSON.stringify(user));
            console.log(`✅ New user created: ${user.first_name} ${user.last_name}`);
        }
        
        // ذخیره سشن
        localStorage.setItem('sidka_user_session', JSON.stringify({
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        }));
        
        // مهاجرت داده‌های قدیم این کاربر
        mergeUserData(user.id, 'orders');
        mergeUserData(user.id, 'tickets');
        
        return {
            success: true,
            user: user,
            isNew: !storedUser
        };
        
    } catch (error) {
        console.error('❌ Error in login:', error);
        return { success: false, error: 'خطا در ورود' };
    }
}

// 10. آمار
async function getDashboardStats() {
    try {
        let totalOrders = 0;
        let totalIncome = 0;
        let newTickets = 0;
        
        // بررسی همه کلیدها
        const keys = Object.keys(localStorage);
        
        // سفارشات
        keys.forEach(key => {
            if (key.startsWith('sidka_orders_user_') || key === 'sidka_orders') {
                try {
                    const orders = JSON.parse(localStorage.getItem(key) || '[]');
                    totalOrders += orders.length;
                    
                    totalIncome += orders
                        .filter(o => o.status === 'تأیید شده')
                        .reduce((sum, order) => sum + (order.total || 0), 0);
                } catch (e) {
                    console.warn(`⚠️ Error reading ${key}:`, e);
                }
            }
        });
        
        // تیکت‌ها
        keys.forEach(key => {
            if (key.startsWith('sidka_tickets_user_') || key === 'sidka_tickets') {
                try {
                    const tickets = JSON.parse(localStorage.getItem(key) || '[]');
                    newTickets += tickets.filter(t => t.status === 'جدید').length;
                } catch (e) {
                    console.warn(`⚠️ Error reading ${key}:`, e);
                }
            }
        });
        
        // تخمین تعداد کاربران
        const userKeys = keys.filter(key => key.startsWith('sidka_user_') && !key.includes('session'));
        const estimatedUsers = Math.max(1, userKeys.length);
        
        return {
            success: true,
            stats: {
                users: estimatedUsers,
                orders: totalOrders,
                totalIncome: totalIncome,
                newTickets: newTickets
            }
        };
        
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        return {
            success: true,
            stats: {
                users: 1,
                orders: 0,
                totalIncome: 0,
                newTickets: 0
            }
        };
    }
}

// 11. توابع ساده شده
async function updateTicketStatus(ticketId, status) {
    try {
        const keys = Object.keys(localStorage);
        const ticketKeys = keys.filter(key => 
            key.startsWith('sidka_tickets_user_') || key === 'sidka_tickets'
        );
        
        ticketKeys.forEach(key => {
            try {
                const tickets = JSON.parse(localStorage.getItem(key) || '[]');
                const updatedTickets = tickets.map(ticket => {
                    if (ticket.id == ticketId) {
                        ticket.status = status;
                    }
                    return ticket;
                });
                localStorage.setItem(key, JSON.stringify(updatedTickets));
            } catch (e) {
                console.warn(`⚠️ Error updating ${key}:`, e);
            }
        });
        
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// ========== اتصال به window ==========

const supabaseFunctionsFixed = {
    // توابع کاربر
    loginOrRegisterUser,
    loginUser: loginOrRegisterUser,
    registerUser: loginOrRegisterUser,
    
    // محصولات
    getAllProducts,
    
    // سفارشات
    createNewOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    getOrderReceipt: async function(orderId) {
        // پیدا کردن سفارش در همه مخازن
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith('sidka_orders_user_') || key === 'sidka_orders') {
                const orders = JSON.parse(localStorage.getItem(key) || '[]');
                const order = orders.find(o => o.id == orderId);
                if (order && order.receipt_info) {
                    return { success: true, receipt: order.receipt_info };
                }
            }
        }
        return { success: false, error: 'رسید یافت نشد' };
    },
    
    // تیکت‌ها
    createNewTicket,
    getUserTickets,
    getAllTickets,
    updateTicketStatus,
    addTicketReply: async function() {
        return { success: true };
    },
    
    // کاربران
    getAllUsers: async function() {
        const keys = Object.keys(localStorage);
        const userKeys = keys.filter(key => 
            key.startsWith('sidka_user_') && !key.includes('session')
        );
        
        const users = userKeys.map(key => {
            try {
                return JSON.parse(localStorage.getItem(key));
            } catch {
                return null;
            }
        }).filter(user => user);
        
        return { success: true, users: users };
    },
    
    updateUserInfo: async function(userId, firstName, lastName) {
        try {
            // به‌روزرسانی در سشن
            const session = JSON.parse(localStorage.getItem('sidka_user_session') || '{}');
            if (session.user && session.user.id == userId) {
                session.user.first_name = firstName;
                session.user.last_name = lastName;
                localStorage.setItem('sidka_user_session', JSON.stringify(session));
            }
            
            // به‌روزرسانی در مخزن کاربر
            const userKey = `sidka_user_${session.user?.phone || userId}`;
            const user = JSON.parse(localStorage.getItem(userKey) || '{}');
            if (user.id == userId) {
                user.first_name = firstName;
                user.last_name = lastName;
                localStorage.setItem(userKey, JSON.stringify(user));
            }
            
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    },
    
    // آمار
    getDashboardStats,
    
    // ابزارها
    clearAuthData: function() {
        // فقط سشن رو پاک کن، نه داده‌های کاربر
        localStorage.removeItem('sidka_user_session');
        console.log('✅ Auth data cleared (user data preserved)');
    }
};

// جایگزینی توابع
window.supabaseFunctions = supabaseFunctionsFixed;
console.log('✅ User-based storage service loaded');
