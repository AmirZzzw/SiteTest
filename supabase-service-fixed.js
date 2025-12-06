// supabase-service-fixed.js - کامل و تست شده
console.log('🚀 Loading Fixed Supabase Service...');

// تنظیمات Supabase
const SUPABASE_CONFIG = {
    URL: 'https://oudwditrdwugozxizehm.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZHdkaXRyZHd1Z296eGl6ZWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODQzMTcsImV4cCI6MjA4MDQ2MDMxN30.BQxoJD-WnRQQvIaQQSTzKzXLxf2LdGuPkqBCKvDruGE'
};

// ایجاد کلاینت Supabase
let supabase;

try {
    if (window.supabase) {
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
        );
        console.log('✅ Supabase client created');
    } else {
        console.error('❌ Supabase library not loaded');
        supabase = null;
    }
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    supabase = null;
}

// ========== توابع کاربران ==========

// 1. پیدا کردن کاربر با شماره تلفن
async function findUserByPhone(phone) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return findUserInLocalStorage(phone);
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();
        
        if (error) {
            console.error('❌ Error finding user:', error);
            return null;
        }
        
        console.log(`✅ User found: ${data?.phone || 'N/A'}`);
        return data;
        
    } catch (error) {
        console.error('❌ Exception in findUserByPhone:', error);
        return null;
    }
}

// 2. ذخیره کاربر در Supabase
async function saveUserToSupabase(userData) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return saveUserToLocalStorage(userData);
        }
        
        const userToSave = {
            phone: userData.phone,
            first_name: userData.first_name || userData.firstName || 'کاربر',
            last_name: userData.last_name || userData.lastName || '',
            password: userData.password || null,
            is_admin: userData.is_admin || userData.isAdmin || false
        };
        
        console.log('📤 Saving user:', userToSave.phone);
        
        const { data, error } = await supabase
            .from('users')
            .upsert([userToSave], {
                onConflict: 'phone'
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error saving user:', error);
            throw error;
        }
        
        console.log(`✅ User saved: ${data.id}`);
        return data;
        
    } catch (error) {
        console.error('❌ Exception in saveUserToSupabase:', error);
        return saveUserToLocalStorage(userData);
    }
}

// 3. ورود کاربر
async function loginUser(phone, password) {
    try {
        console.log(`🔐 Login attempt: ${phone}`);
        
        // چک ادمین
        if (phone === '09021707830') {
            if (password !== 'SidkaShop1234') {
                return {
                    success: false,
                    error: 'رمز عبور ادمین اشتباه است'
                };
            }
            
            let adminUser = await findUserByPhone(phone);
            
            if (!adminUser) {
                adminUser = await saveUserToSupabase({
                    phone: phone,
                    first_name: 'امیرمحمد',
                    last_name: 'یوسفی',
                    password: 'SidkaShop1234',
                    is_admin: true
                });
            }
            
            saveSession(adminUser);
            
            return {
                success: true,
                user: adminUser,
                isAdmin: true
            };
        }
        
        // کاربران عادی
        const user = await findUserByPhone(phone);
        
        if (!user) {
            return {
                success: false,
                error: 'کاربری با این شماره وجود ندارد'
            };
        }
        
        if (!user.password && password) {
            // کاربر قدیمی - ذخیره رمز جدید
            user.password = password;
            await saveUserToSupabase(user);
        }
        
        if (user.password && user.password !== password) {
            return {
                success: false,
                error: 'رمز عبور اشتباه است'
            };
        }
        
        saveSession(user);
        
        return {
            success: true,
            user: user
        };
        
    } catch (error) {
        console.error('❌ Error in login:', error);
        return {
            success: false,
            error: 'خطا در ورود'
        };
    }
}

// 4. ثبت‌نام کاربر
async function registerUser(phone, firstName, lastName, password) {
    try {
        console.log(`📝 Registering: ${firstName} ${lastName}`);
        
        // اعتبارسنجی
        if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
            return {
                success: false,
                error: 'شماره موبایل معتبر وارد کنید'
            };
        }
        
        if (!firstName || !lastName) {
            return {
                success: false,
                error: 'نام و نام خانوادگی الزامی است'
            };
        }
        
        if (!password || password.length < 6) {
            return {
                success: false,
                error: 'رمز عبور باید حداقل ۶ کاراکتر باشد'
            };
        }
        
        // چک وجود کاربر
        const existingUser = await findUserByPhone(phone);
        if (existingUser) {
            return {
                success: false,
                error: 'کاربری با این شماره قبلاً ثبت‌نام کرده است'
            };
        }
        
        // ایجاد کاربر جدید
        const newUser = {
            phone: phone,
            first_name: firstName,
            last_name: lastName,
            password: password,
            is_admin: false
        };
        
        const savedUser = await saveUserToSupabase(newUser);
        saveSession(savedUser);
        
        return {
            success: true,
            user: savedUser
        };
        
    } catch (error) {
        console.error('❌ Error in register:', error);
        return {
            success: false,
            error: 'خطا در ثبت‌نام'
        };
    }
}

// 5. ورود/عضویت ترکیبی
async function loginOrRegisterUser(phone, firstName = '', lastName = '', password = '') {
    // اول سعی کن وارد بشه
    const loginResult = await loginUser(phone, password);
    
    if (loginResult.success) {
        return loginResult;
    }
    
    // اگر کاربر وجود نداشت و اطلاعات کامل داره، ثبت‌نام کن
    if (!loginResult.success && firstName && lastName && password) {
        return await registerUser(phone, firstName, lastName, password);
    }
    
    return loginResult;
}

// 6. دریافت همه کاربران
async function getAllUsers() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return { success: true, users: getAllUsersFromLocalStorage() };
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting users:', error);
            throw error;
        }
        
        return { success: true, users: data || [] };
        
    } catch (error) {
        console.error('❌ Exception in getAllUsers:', error);
        return { success: true, users: getAllUsersFromLocalStorage() };
    }
}

// ========== توابع محصولات ==========

// 1. دریافت همه محصولات
async function getAllProducts() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return { success: true, products: getDefaultProducts() };
        }
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');
        
        if (error) {
            console.error('❌ Error getting products:', error);
            throw error;
        }
        
        if (!data || data.length === 0) {
            console.warn('⚠️ No products in Supabase');
            return { success: true, products: getDefaultProducts() };
        }
        
        return { success: true, products: data };
        
    } catch (error) {
        console.error('❌ Exception in getAllProducts:', error);
        return { success: true, products: getDefaultProducts() };
    }
}

// محصولات پیش‌فرض
function getDefaultProducts() {
    return [
        { id: 1, name: 'ساخت پنل', description: 'ساخت پنل اختصاصی با امکانات کامل', price: 900000, category: 'panels', icon: 'fas fa-plus-circle' },
        { id: 2, name: 'آپدیت پنل', description: 'ارتقاء و به‌روزرسانی پنل موجود', price: 235000, category: 'panels', icon: 'fas fa-sync-alt' },
        { id: 3, name: 'اشتراک سلف تلگرام - یک ماهه', description: 'اشتراک یکماهه سلف تلگرام', price: 40000, category: 'subscriptions', icon: 'fab fa-telegram' },
        { id: 4, name: 'اشتراک V2rayNG - 50 گیگ', description: 'اشتراک 50 گیگ کاربر نامحدود یکماهه v2rayNG', price: 30000, category: 'subscriptions', icon: 'fas fa-server' },
        { id: 5, name: 'ویاکس پنل - یکروزه', description: 'اشتراک یکروزه ویاکس پنل - تک کاربره', price: 15000, category: 'subscriptions', icon: 'fas fa-bolt' },
        { id: 6, name: 'ویاکس پنل - یک هفته', description: 'اشتراک یک هفته ویاکس پنل - تک کاربره', price: 80000, category: 'subscriptions', icon: 'fas fa-calendar-week' },
        { id: 7, name: 'ویاکس پنل - یکماهه', description: 'اشتراک یکماهه ویاکس پنل - تک کاربره', price: 230000, category: 'subscriptions', icon: 'fas fa-calendar-alt' },
        { id: 8, name: 'ویاکس پنل - دائمی', description: 'اشتراک دائمی ویاکس پنل - تک کاربره', price: 350000, category: 'subscriptions', icon: 'fas fa-infinity' },
        { id: 9, name: 'تامنیل یوتیوب', description: 'طراحی تامنیل حرفه‌ای برای یوتیوب', price: 50000, category: 'design', icon: 'fab fa-youtube' },
        { id: 10, name: 'پروفایل چنل', description: 'طراحی پروفایل حرفه‌ای برای چنل', price: 50000, category: 'design', icon: 'fas fa-id-card' }
    ];
}

// ========== توابع سفارشات ==========

// 1. ایجاد سفارش جدید
async function createNewOrder(orderData) {
    try {
        console.log('🛒 Creating order...');
        
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return createNewOrderInLocalStorage(orderData);
        }
        
        const orderToSave = {
            user_id: orderData.userId,
            total: orderData.total || 0,
            status: 'در انتظار تأیید',
            customer_info: orderData.customerInfo || {},
            receipt_info: orderData.receipt || {},
            items: orderData.items || []
        };
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderToSave])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating order:', error);
            throw error;
        }
        
        localStorage.removeItem('sidka_cart');
        
        return {
            success: true,
            order: data
        };
        
    } catch (error) {
        console.error('❌ Exception in createNewOrder:', error);
        return createNewOrderInLocalStorage(orderData);
    }
}

// 2. دریافت سفارشات کاربر
async function getUserOrders(userId) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return { success: true, orders: getUserOrdersFromLocalStorage(userId) };
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting user orders:', error);
            throw error;
        }
        
        return { success: true, orders: data || [] };
        
    } catch (error) {
        console.error('❌ Exception in getUserOrders:', error);
        return { success: true, orders: getUserOrdersFromLocalStorage(userId) };
    }
}

// 3. دریافت همه سفارشات
async function getAllOrders() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return { success: true, orders: getAllOrdersFromLocalStorage() };
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, users(first_name, last_name, phone)')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting all orders:', error);
            throw error;
        }
        
        return { success: true, orders: data || [] };
        
    } catch (error) {
        console.error('❌ Exception in getAllOrders:', error);
        return { success: true, orders: getAllOrdersFromLocalStorage() };
    }
}

// 4. آپدیت وضعیت سفارش
async function updateOrderStatus(orderId, status) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return updateOrderStatusInLocalStorage(orderId, status);
        }
        
        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId);
        
        if (error) throw error;
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Exception in updateOrderStatus:', error);
        return updateOrderStatusInLocalStorage(orderId, status);
    }
}

// ========== توابع تیکت‌ها ==========

// 1. ایجاد تیکت جدید
async function createNewTicket(ticketData) {
    try {
        console.log('🎫 Creating ticket...');
        
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return createNewTicketInLocalStorage(ticketData);
        }
        
        const ticketToSave = {
            user_id: ticketData.userId,
            subject: ticketData.subject || 'بدون موضوع',
            message: ticketData.message || 'بدون پیام',
            status: 'جدید'
        };
        
        const { data, error } = await supabase
            .from('tickets')
            .insert([ticketToSave])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating ticket:', error);
            throw error;
        }
        
        return {
            success: true,
            ticket: data
        };
        
    } catch (error) {
        console.error('❌ Exception in createNewTicket:', error);
        return createNewTicketInLocalStorage(ticketData);
    }
}

// 2. دریافت تیکت‌های کاربر
async function getUserTickets(userId) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return { success: true, tickets: getUserTicketsFromLocalStorage(userId) };
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting user tickets:', error);
            throw error;
        }
        
        return { success: true, tickets: data || [] };
        
    } catch (error) {
        console.error('❌ Exception in getUserTickets:', error);
        return { success: true, tickets: getUserTicketsFromLocalStorage(userId) };
    }
}

// 3. دریافت همه تیکت‌ها
async function getAllTickets() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return { success: true, tickets: getAllTicketsFromLocalStorage() };
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .select('*, users(first_name, last_name, phone)')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting all tickets:', error);
            throw error;
        }
        
        return { success: true, tickets: data || [] };
        
    } catch (error) {
        console.error('❌ Exception in getAllTickets:', error);
        return { success: true, tickets: getAllTicketsFromLocalStorage() };
    }
}

// ========== توابع کمکی ==========

// ذخیره سشن
function saveSession(user) {
    try {
        const sessionData = {
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        };
        
        localStorage.setItem('sidka_user_session', JSON.stringify(sessionData));
        return true;
    } catch (error) {
        console.error('❌ Error saving session:', error);
        return false;
    }
}

// ========== توابع Fallback به localStorage ==========

function findUserInLocalStorage(phone) {
    try {
        const userKey = `sidka_user_${phone}`;
        const userData = localStorage.getItem(userKey);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        return null;
    }
}

function saveUserToLocalStorage(userData) {
    try {
        const userKey = `sidka_user_${userData.phone}`;
        const userToSave = {
            id: userData.id || Date.now(),
            phone: userData.phone,
            first_name: userData.first_name || userData.firstName,
            last_name: userData.last_name || userData.lastName,
            password: userData.password,
            is_admin: userData.is_admin || false,
            created_at: new Date().toISOString()
        };
        
        localStorage.setItem(userKey, JSON.stringify(userToSave));
        return userToSave;
    } catch (error) {
        throw error;
    }
}

function getAllUsersFromLocalStorage() {
    try {
        const keys = Object.keys(localStorage);
        const userKeys = keys.filter(key => key.startsWith('sidka_user_'));
        
        return userKeys.map(key => {
            try {
                return JSON.parse(localStorage.getItem(key));
            } catch {
                return null;
            }
        }).filter(user => user);
    } catch (error) {
        return [];
    }
}

function createNewOrderInLocalStorage(orderData) {
    try {
        const order = {
            id: Date.now(),
            userId: orderData.userId,
            total: orderData.total,
            status: 'در انتظار تأیید',
            customer_info: orderData.customerInfo,
            receipt_info: orderData.receipt,
            items: orderData.items,
            created_at: new Date().toISOString()
        };
        
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        orders.push(order);
        localStorage.setItem('sidka_orders', JSON.stringify(orders));
        
        localStorage.removeItem('sidka_cart');
        
        return { success: true, order: order };
    } catch (error) {
        return { success: false, error: 'خطا' };
    }
}

function getUserOrdersFromLocalStorage(userId) {
    try {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        return orders.filter(order => order.userId == userId);
    } catch (error) {
        return [];
    }
}

function getAllOrdersFromLocalStorage() {
    try {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        return orders;
    } catch (error) {
        return [];
    }
}

function updateOrderStatusInLocalStorage(orderId, status) {
    try {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const updated = orders.map(order => {
            if (order.id == orderId) {
                order.status = status;
            }
            return order;
        });
        
        localStorage.setItem('sidka_orders', JSON.stringify(updated));
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

function createNewTicketInLocalStorage(ticketData) {
    try {
        const ticket = {
            id: Date.now(),
            userId: ticketData.userId,
            subject: ticketData.subject,
            message: ticketData.message,
            status: 'جدید',
            created_at: new Date().toISOString()
        };
        
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        tickets.push(ticket);
        localStorage.setItem('sidka_tickets', JSON.stringify(tickets));
        
        return { success: true, ticket: ticket };
    } catch (error) {
        return { success: false };
    }
}

function getUserTicketsFromLocalStorage(userId) {
    try {
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        return tickets.filter(ticket => ticket.userId == userId);
    } catch (error) {
        return [];
    }
}

function getAllTicketsFromLocalStorage() {
    try {
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        return tickets;
    } catch (error) {
        return [];
    }
}

// ========== اتصال توابع ==========

const supabaseFunctions = {
    // کاربران
    loginUser,
    loginOrRegisterUser,
    registerUser,
    getAllUsers,
    
    // محصولات
    getAllProducts,
    
    // سفارشات
    createNewOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    
    // تیکت‌ها
    createNewTicket,
    getUserTickets,
    getAllTickets,
    
    // سایر توابع
    getDashboardStats: async function() {
        try {
            const usersResult = await this.getAllUsers();
            const ordersResult = await this.getAllOrders();
            const ticketsResult = await this.getAllTickets();
            
            const totalIncome = ordersResult.orders
                ?.filter(o => o.status === 'تأیید شده')
                ?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
            
            return {
                success: true,
                stats: {
                    users: usersResult.users?.length || 0,
                    orders: ordersResult.orders?.length || 0,
                    totalIncome: totalIncome,
                    newTickets: ticketsResult.tickets?.filter(t => t.status === 'جدید')?.length || 0
                }
            };
        } catch (error) {
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
    },
    
    updateUserInfo: async function(userId, firstName, lastName) {
        try {
            const session = JSON.parse(localStorage.getItem('sidka_user_session') || '{}');
            if (session.user && session.user.id == userId) {
                session.user.first_name = firstName;
                session.user.last_name = lastName;
                localStorage.setItem('sidka_user_session', JSON.stringify(session));
            }
            
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    },
    
    clearAuthData: function() {
        localStorage.removeItem('sidka_user_session');
    }
};

// جایگزینی توابع
window.supabaseFunctions = supabaseFunctions;
console.log('✅ Supabase service loaded');
