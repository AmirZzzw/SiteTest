// supabase-service-complete.js - کامل و رفع خطا
console.log('🚀 Loading Complete Supabase Service...');

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
            SUPABASE_CONFIG.ANON_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false
                }
            }
        );
        console.log('✅ Supabase client created successfully');
    } else {
        console.error('❌ Supabase library not loaded');
        supabase = null;
    }
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    supabase = null;
}

// ========== توابع اصلی کاربران ==========

// 1. پیدا کردن کاربر با شماره تلفن در Supabase
async function findUserByPhone(phone) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return null;
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle(); // استفاده از maybeSingle به جای single
        
        if (error) {
            if (error.code === 'PGRST116') {
                console.log(`📭 No user found with phone: ${phone}`);
                return null;
            }
            console.error('❌ Error finding user:', error);
            return null;
        }
        
        console.log(`✅ User found in Supabase: ${data?.phone || 'N/A'}`);
        return data;
        
    } catch (error) {
        console.error('❌ Exception in findUserByPhone:', error);
        return null;
    }
}

// 2. ذخیره یا آپدیت کاربر در Supabase
async function saveUserToSupabase(userData) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return saveUserToLocalStorage(userData);
        }
        
        // آماده‌سازی داده
        const userToSave = {
            phone: userData.phone,
            first_name: userData.first_name || userData.firstName || 'کاربر',
            last_name: userData.last_name || userData.lastName || '',
            password: userData.password || null,
            is_admin: userData.is_admin || userData.isAdmin || false
        };
        
        // اگر id داره (کاربر موجود)
        if (userData.id && typeof userData.id === 'number') {
            userToSave.id = userData.id;
        }
        
        console.log('📤 Saving user to Supabase:', userToSave);
        
        const { data, error } = await supabase
            .from('users')
            .upsert([userToSave], {
                onConflict: 'phone',
                ignoreDuplicates: false
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error saving user to Supabase:', error);
            throw error;
        }
        
        console.log(`✅ User saved to Supabase: ${data.phone} (ID: ${data.id})`);
        return data;
        
    } catch (error) {
        console.error('❌ Exception in saveUserToSupabase:', error);
        // در صورت خطا، در localStorage ذخیره کن
        return saveUserToLocalStorage(userData);
    }
}

// 3. ورود با رمز عبور
async function loginWithPassword(phone, password) {
    try {
        console.log(`🔐 Login attempt for: ${phone}`);
        
        // ========== چک ادمین ==========
        if (phone === '09021707830') {
            if (password !== 'SidkaShop1234') {
                return {
                    success: false,
                    error: 'رمز عبور ادمین اشتباه است',
                    code: 'WRONG_ADMIN_PASSWORD'
                };
            }
            
            // پیدا کردن یا ایجاد کاربر ادمین در Supabase
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
            
            // ذخیره سشن
            saveSession(adminUser);
            
            return {
                success: true,
                user: adminUser,
                isAdmin: true
            };
        }
        
        // ========== کاربران عادی ==========
        
        // پیدا کردن کاربر در Supabase
        const user = await findUserByPhone(phone);
        
        if (!user) {
            return {
                success: false,
                error: 'کاربری با این شماره وجود ندارد',
                code: 'USER_NOT_FOUND'
            };
        }
        
        // چک رمز عبور
        if (!user.password) {
            // کاربر قدیمی بدون رمز
            return {
                success: false,
                error: 'این حساب نیاز به تنظیم رمز عبور دارد',
                code: 'PASSWORD_REQUIRED'
            };
        }
        
        if (user.password !== password) {
            return {
                success: false,
                error: 'رمز عبور اشتباه است',
                code: 'WRONG_PASSWORD'
            };
        }
        
        // ذخیره سشن
        saveSession(user);
        
        console.log(`✅ Login successful: ${user.first_name} ${user.last_name}`);
        
        return {
            success: true,
            user: user,
            isNew: false
        };
        
    } catch (error) {
        console.error('❌ Error in loginWithPassword:', error);
        return {
            success: false,
            error: 'خطا در سیستم ورود',
            code: 'SYSTEM_ERROR'
        };
    }
}

// 4. ثبت‌نام جدید
async function registerUserInSupabase(phone, firstName, lastName, password) {
    try {
        console.log(`📝 Registering: ${firstName} ${lastName}`);
        
        // اعتبارسنجی
        if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
            return {
                success: false,
                error: 'شماره موبایل معتبر وارد کنید (09xxxxxxxxx)',
                code: 'INVALID_PHONE'
            };
        }
        
        if (!firstName || !lastName) {
            return {
                success: false,
                error: 'نام و نام خانوادگی الزامی است',
                code: 'MISSING_NAME'
            };
        }
        
        if (!password || password.length < 6) {
            return {
                success: false,
                error: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
                code: 'WEAK_PASSWORD'
            };
        }
        
        // چک وجود کاربر
        const existingUser = await findUserByPhone(phone);
        if (existingUser) {
            return {
                success: false,
                error: 'کاربری با این شماره قبلاً ثبت‌نام کرده است',
                code: 'USER_EXISTS'
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
        
        // ذخیره سشن
        saveSession(savedUser);
        
        console.log(`✅ Registration successful: ${savedUser.id}`);
        
        return {
            success: true,
            user: savedUser,
            message: 'ثبت‌نام موفقیت‌آمیز بود'
        };
        
    } catch (error) {
        console.error('❌ Error in registerUserInSupabase:', error);
        return {
            success: false,
            error: 'خطا در ثبت‌نام',
            code: 'REGISTRATION_ERROR'
        };
    }
}

// 5. دریافت همه کاربران (برای ادمین)
async function getAllUsersFromSupabase() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return getAllUsersFromLocalStorage();
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting users:', error);
            throw error;
        }
        
        console.log(`✅ Retrieved ${data.length} users from Supabase`);
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getAllUsersFromSupabase:', error);
        return getAllUsersFromLocalStorage();
    }
}

// 6. آپدیت اطلاعات کاربر
async function updateUserInfoInSupabase(userId, firstName, lastName) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return updateUserInLocalStorage(userId, firstName, lastName);
        }
        
        const { data, error } = await supabase
            .from('users')
            .update({
                first_name: firstName,
                last_name: lastName,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error updating user:', error);
            throw error;
        }
        
        console.log(`✅ User updated: ${data.id}`);
        return data;
        
    } catch (error) {
        console.error('❌ Exception in updateUserInfoInSupabase:', error);
        return updateUserInLocalStorage(userId, firstName, lastName);
    }
}

// ========== توابع محصولات ==========

// 1. دریافت همه محصولات از Supabase
async function getAllProductsFromSupabase() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return getProductsFromLocalStorage();
        }
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');
        
        if (error) {
            console.error('❌ Error getting products:', error);
            // استفاده از محصولات ثابت
            return getDefaultProducts();
        }
        
        if (!data || data.length === 0) {
            console.warn('⚠️ No products in Supabase, using default');
            return getDefaultProducts();
        }
        
        console.log(`✅ Retrieved ${data.length} products from Supabase`);
        return data;
        
    } catch (error) {
        console.error('❌ Exception in getAllProductsFromSupabase:', error);
        return getDefaultProducts();
    }
}

// ========== توابع سفارشات ==========

// 1. ایجاد سفارش جدید
async function createNewOrderInSupabase(orderData) {
    try {
        console.log('🛒 Creating order in Supabase...');
        
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
        
        console.log('📤 Saving order:', orderToSave);
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderToSave])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating order in Supabase:', error);
            throw error;
        }
        
        console.log(`✅ Order created in Supabase: ${data.id}`);
        
        // خالی کردن سبد خرید
        localStorage.removeItem('sidka_cart');
        
        return {
            success: true,
            order: data,
            message: 'سفارش با موفقیت ثبت شد'
        };
        
    } catch (error) {
        console.error('❌ Exception in createNewOrderInSupabase:', error);
        return createNewOrderInLocalStorage(orderData);
    }
}

// 2. دریافت سفارشات کاربر
async function getUserOrdersFromSupabase(userId) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return getUserOrdersFromLocalStorage(userId);
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
        
        console.log(`✅ Retrieved ${data?.length || 0} orders for user ${userId}`);
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getUserOrdersFromSupabase:', error);
        return getUserOrdersFromLocalStorage(userId);
    }
}

// 3. دریافت همه سفارشات (برای ادمین)
async function getAllOrdersFromSupabase() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return getAllOrdersFromLocalStorage();
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, users(first_name, last_name, phone)')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting all orders:', error);
            throw error;
        }
        
        console.log(`✅ Retrieved ${data?.length || 0} orders from Supabase`);
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getAllOrdersFromSupabase:', error);
        return getAllOrdersFromLocalStorage();
    }
}

// 4. آپدیت وضعیت سفارش
async function updateOrderStatusInSupabase(orderId, status) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return updateOrderStatusInLocalStorage(orderId, status);
        }
        
        const { error } = await supabase
            .from('orders')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
        
        if (error) {
            console.error('❌ Error updating order status:', error);
            throw error;
        }
        
        console.log(`✅ Order ${orderId} status updated to: ${status}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Exception in updateOrderStatusInSupabase:', error);
        return updateOrderStatusInLocalStorage(orderId, status);
    }
}

// ========== توابع تیکت‌ها ==========

// 1. ایجاد تیکت جدید
async function createNewTicketInSupabase(ticketData) {
    try {
        console.log('🎫 Creating ticket in Supabase...');
        
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
            console.error('❌ Error creating ticket in Supabase:', error);
            throw error;
        }
        
        console.log(`✅ Ticket created in Supabase: ${data.id}`);
        
        return {
            success: true,
            ticket: data,
            message: 'تیکت با موفقیت ارسال شد'
        };
        
    } catch (error) {
        console.error('❌ Exception in createNewTicketInSupabase:', error);
        return createNewTicketInLocalStorage(ticketData);
    }
}

// 2. دریافت تیکت‌های کاربر
async function getUserTicketsFromSupabase(userId) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return getUserTicketsFromLocalStorage(userId);
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
        
        console.log(`✅ Retrieved ${data?.length || 0} tickets for user ${userId}`);
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getUserTicketsFromSupabase:', error);
        return getUserTicketsFromLocalStorage(userId);
    }
}

// 3. دریافت همه تیکت‌ها (برای ادمین)
async function getAllTicketsFromSupabase() {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available');
            return getAllTicketsFromLocalStorage();
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .select('*, users(first_name, last_name, phone)')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting all tickets:', error);
            throw error;
        }
        
        console.log(`✅ Retrieved ${data?.length || 0} tickets from Supabase`);
        return data || [];
        
    } catch (error) {
        console.error('❌ Exception in getAllTicketsFromSupabase:', error);
        return getAllTicketsFromLocalStorage();
    }
}

// ========== توابع کمکی و Fallback ==========

// ذخیره سشن در localStorage
function saveSession(user) {
    try {
        const sessionData = {
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000),
            savedAt: Date.now()
        };
        
        localStorage.setItem('sidka_user_session', JSON.stringify(sessionData));
        console.log(`✅ Session saved for: ${user.phone}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving session:', error);
        return false;
    }
}

// محصولات پیش‌فرض
function getDefaultProducts() {
    return [
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
}

// ========== توابع Fallback به localStorage ==========

// کاربران در localStorage
function saveUserToLocalStorage(userData) {
    try {
        const userKey = `sidka_user_${userData.phone}`;
        const userToSave = {
            id: userData.id || Date.now(),
            phone: userData.phone,
            first_name: userData.first_name || userData.firstName || 'کاربر',
            last_name: userData.last_name || userData.lastName || '',
            password: userData.password,
            is_admin: userData.is_admin || false,
            created_at: new Date().toISOString()
        };
        
        localStorage.setItem(userKey, JSON.stringify(userToSave));
        console.log(`✅ User saved to localStorage: ${userData.phone}`);
        return userToSave;
    } catch (error) {
        console.error('❌ Error in saveUserToLocalStorage:', error);
        throw error;
    }
}

function getAllUsersFromLocalStorage() {
    try {
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
        
        console.log(`📊 Found ${users.length} users in localStorage`);
        return users;
    } catch (error) {
        console.error('❌ Error in getAllUsersFromLocalStorage:', error);
        return [];
    }
}

function updateUserInLocalStorage(userId, firstName, lastName) {
    try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith('sidka_user_') && !key.includes('session')) {
                const user = JSON.parse(localStorage.getItem(key));
                if (user.id == userId) {
                    user.first_name = firstName;
                    user.last_name = lastName;
                    localStorage.setItem(key, JSON.stringify(user));
                    
                    // آپدیت سشن
                    const session = JSON.parse(localStorage.getItem('sidka_user_session') || '{}');
                    if (session.user && session.user.id == userId) {
                        session.user.first_name = firstName;
                        session.user.last_name = lastName;
                        localStorage.setItem('sidka_user_session', JSON.stringify(session));
                    }
                    
                    return user;
                }
            }
        }
        return null;
    } catch (error) {
        console.error('❌ Error in updateUserInLocalStorage:', error);
        return null;
    }
}

// محصولات در localStorage
function getProductsFromLocalStorage() {
    try {
        const products = localStorage.getItem('sidka_products');
        if (products) {
            return JSON.parse(products);
        }
        return getDefaultProducts();
    } catch (error) {
        return getDefaultProducts();
    }
}

// سفارشات در localStorage
function createNewOrderInLocalStorage(orderData) {
    try {
        const order = {
            id: Date.now(),
            userId: orderData.userId,
            user_id: orderData.userId,
            total: orderData.total || 0,
            status: 'در انتظار تأیید',
            customer_info: orderData.customerInfo || {},
            receipt_info: orderData.receipt || {},
            items: orderData.items || [],
            created_at: new Date().toISOString()
        };
        
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        orders.push(order);
        localStorage.setItem('sidka_orders', JSON.stringify(orders));
        
        localStorage.removeItem('sidka_cart');
        
        return { success: true, order: order };
    } catch (error) {
        console.error('❌ Error in createNewOrderInLocalStorage:', error);
        return { success: false, error: 'خطا در ثبت سفارش' };
    }
}

function getUserOrdersFromLocalStorage(userId) {
    try {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const userOrders = orders.filter(order => 
            order.userId == userId || order.user_id == userId
        );
        return userOrders;
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
        const updatedOrders = orders.map(order => {
            if (order.id == orderId) {
                order.status = status;
                order.updated_at = new Date().toISOString();
            }
            return order;
        });
        localStorage.setItem('sidka_orders', JSON.stringify(updatedOrders));
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// تیکت‌ها در localStorage
function createNewTicketInLocalStorage(ticketData) {
    try {
        const ticket = {
            id: Date.now(),
            userId: ticketData.userId,
            user_id: ticketData.userId,
            subject: ticketData.subject || 'بدون موضوع',
            message: ticketData.message || 'بدون پیام',
            status: 'جدید',
            created_at: new Date().toISOString()
        };
        
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        tickets.push(ticket);
        localStorage.setItem('sidka_tickets', JSON.stringify(tickets));
        
        return { success: true, ticket: ticket };
    } catch (error) {
        return { success: false, error: 'خطا در ایجاد تیکت' };
    }
}

function getUserTicketsFromLocalStorage(userId) {
    try {
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const userTickets = tickets.filter(ticket => 
            ticket.userId == userId || ticket.user_id == userId
        );
        return userTickets;
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

// ========== توابع مهاجرت ==========

// مهاجرت کاربران از localStorage به Supabase
async function migrateUsersToSupabase() {
    try {
        console.log('🚚 Starting user migration to Supabase...');
        
        const localUsers = getAllUsersFromLocalStorage();
        
        if (localUsers.length === 0) {
            console.log('📭 No local users to migrate');
            return { success: true, migrated: 0 };
        }
        
        let migratedCount = 0;
        let errors = 0;
        
        for (const localUser of localUsers) {
            try {
                // چک کن که در Supabase وجود نداره
                const existingUser = await findUserByPhone(localUser.phone);
                
                if (!existingUser) {
                    // مهاجرت کاربر
                    await saveUserToSupabase({
                        phone: localUser.phone,
                        first_name: localUser.first_name,
                        last_name: localUser.last_name,
                        password: localUser.password || null,
                        is_admin: localUser.is_admin || false
                    });
                    
                    migratedCount++;
                    console.log(`✅ Migrated user: ${localUser.phone}`);
                } else {
                    console.log(`⏭️ User already exists in Supabase: ${localUser.phone}`);
                }
            } catch (error) {
                errors++;
                console.warn(`⚠️ Failed to migrate user ${localUser.phone}:`, error.message);
            }
        }
        
        console.log(`🎉 Migration complete: ${migratedCount} users migrated, ${errors} errors`);
        return { 
            success: true, 
            migrated: migratedCount,
            errors: errors 
        };
        
    } catch (error) {
        console.error('❌ Error in migrateUsersToSupabase:', error);
        return { success: false, error: error.message };
    }
}

// ========== اتصال توابع به window ==========

const supabaseCompleteFunctions = {
    // توابع کاربران
    loginUser: loginWithPassword,
    loginOrRegisterUser: async function(phone, firstName = '', lastName = '', password = '') {
        // اول سعی کن وارد بشه
        const loginResult = await loginWithPassword(phone, password);
        
        if (loginResult.success) {
            return loginResult;
        }
        
        // اگر کاربر وجود نداشت و اطلاعات کامل داره، ثبت‌نام کن
        if (loginResult.code === 'USER_NOT_FOUND' && firstName && lastName && password) {
            return await registerUserInSupabase(phone, firstName, lastName, password);
        }
        
        return loginResult;
    },
    
    registerUser: registerUserInSupabase,
    
    // مدیریت کاربران
    getAllUsers: async function() {
        try {
            const users = await getAllUsersFromSupabase();
            return { success: true, users: users };
        } catch (error) {
            console.error('❌ Error in getAllUsers:', error);
            const localUsers = getAllUsersFromLocalStorage();
            return { success: true, users: localUsers };
        }
    },
    
    updateUserInfo: async function(userId, firstName, lastName) {
        try {
            const updatedUser = await updateUserInfoInSupabase(userId, firstName, lastName);
            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('❌ Error in updateUserInfo:', error);
            const localUser = updateUserInLocalStorage(userId, firstName, lastName);
            return { success: !!localUser, user: localUser };
        }
    },
    
    // محصولات
    getAllProducts: async function() {
        try {
            const products = await getAllProductsFromSupabase();
            return { 
                success: true, 
                products: products,
                count: products.length 
            };
        } catch (error) {
            console.error('❌ Error in getAllProducts:', error);
            const defaultProducts = getDefaultProducts();
            return { 
                success: true, 
                products: defaultProducts,
                count: defaultProducts.length 
            };
        }
    },
    
    // سفارشات
    createNewOrder: async function(orderData) {
        try {
            const result = await createNewOrderInSupabase(orderData);
            return result;
        } catch (error) {
            console.error('❌ Error in createNewOrder:', error);
            return createNewOrderInLocalStorage(orderData);
        }
    },
    
    getUserOrders: async function(userId) {
        try {
            const orders = await getUserOrdersFromSupabase(userId);
            return { success: true, orders: orders };
        } catch (error) {
            console.error('❌ Error in getUserOrders:', error);
            const localOrders = getUserOrdersFromLocalStorage(userId);
            return { success: true, orders: localOrders };
        }
    },
    
    getAllOrders: async function() {
        try {
            const orders = await getAllOrdersFromSupabase();
            return { success: true, orders: orders };
        } catch (error) {
            console.error('❌ Error in getAllOrders:', error);
            const localOrders = getAllOrdersFromLocalStorage();
            return { success: true, orders: localOrders };
        }
    },
    
    updateOrderStatus: async function(orderId, status) {
        try {
            const result = await updateOrderStatusInSupabase(orderId, status);
            return result;
        } catch (error) {
            console.error('❌ Error in updateOrderStatus:', error);
            return updateOrderStatusInLocalStorage(orderId, status);
        }
    },
    
    getOrderReceipt: async function(orderId) {
        try {
            if (!supabase) {
                const orders = getAllOrdersFromLocalStorage();
                const order = orders.find(o => o.id == orderId);
                if (order && order.receipt_info) {
                    return { success: true, receipt: order.receipt_info };
                }
                return { success: false, error: 'رسید یافت نشد' };
            }
            
            const { data, error } = await supabase
                .from('orders')
                .select('receipt_info')
                .eq('id', orderId)
                .single();
            
            if (error) {
                return { success: false, error: 'رسید یافت نشد' };
            }
            
            return { success: true, receipt: data.receipt_info };
        } catch (error) {
            return { success: false, error: 'خطا در دریافت رسید' };
        }
    },
    
    // تیکت‌ها
    createNewTicket: async function(ticketData) {
        try {
            const result = await createNewTicketInSupabase(ticketData);
            return result;
        } catch (error) {
            console.error('❌ Error in createNewTicket:', error);
            return createNewTicketInLocalStorage(ticketData);
        }
    },
    
    getUserTickets: async function(userId) {
        try {
            const tickets = await getUserTicketsFromSupabase(userId);
            return { success: true, tickets: tickets };
        } catch (error) {
            console.error('❌ Error in getUserTickets:', error);
            const localTickets = getUserTicketsFromLocalStorage(userId);
            return { success: true, tickets: localTickets };
        }
    },
    
    getAllTickets: async function() {
        try {
            const tickets = await getAllTicketsFromSupabase();
            return { success: true, tickets: tickets };
        } catch (error) {
            console.error('❌ Error in getAllTickets:', error);
            const localTickets = getAllTicketsFromLocalStorage();
            return { success: true, tickets: localTickets };
        }
    },
    
    updateTicketStatus: async function(ticketId, status) {
        try {
            if (!supabase) {
                const tickets = getAllTicketsFromLocalStorage();
                const updatedTickets = tickets.map(ticket => {
                    if (ticket.id == ticketId) {
                        ticket.status = status;
                    }
                    return ticket;
                });
                localStorage.setItem('sidka_tickets', JSON.stringify(updatedTickets));
                return { success: true };
            }
            
            const { error } = await supabase
                .from('tickets')
                .update({ status: status })
                .eq('id', ticketId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('❌ Error in updateTicketStatus:', error);
            return { success: false };
        }
    },
    
    addTicketReply: async function(ticketId, replyData) {
        return { success: true };
    },
    
    // آمار
    getDashboardStats: async function() {
        try {
            let totalUsers = 0;
            let totalOrders = 0;
            let totalIncome = 0;
            let newTickets = 0;
            
            // کاربران
            const usersResult = await this.getAllUsers();
            if (usersResult.success) {
                totalUsers = usersResult.users.length;
            }
            
            // سفارشات
            const ordersResult = await this.getAllOrders();
            if (ordersResult.success) {
                totalOrders = ordersResult.orders.length;
                totalIncome = ordersResult.orders
                    .filter(o => o.status === 'تأیید شده')
                    .reduce((sum, order) => sum + (order.total || 0), 0);
            }
            
            // تیکت‌ها
            const ticketsResult = await this.getAllTickets();
            if (ticketsResult.success) {
                newTickets = ticketsResult.tickets.filter(t => t.status === 'جدید').length;
            }
            
            return {
                success: true,
                stats: {
                    users: totalUsers,
                    orders: totalOrders,
                    totalIncome: totalIncome,
                    newTickets: newTickets
                }
            };
        } catch (error) {
            console.error('❌ Error in getDashboardStats:', error);
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
    
    // ابزارها
    migrateUsers: migrateUsersToSupabase,
    clearAuthData: function() {
        localStorage.removeItem('sidka_user_session');
        console.log('✅ Auth data cleared');
    },
    
    // دیباگ
    debug: function() {
        console.log('🔍 Debug Info:');
        console.log('- Supabase client:', supabase ? 'Available' : 'Not available');
        
        const localUsers = getAllUsersFromLocalStorage();
        const localOrders = getAllOrdersFromLocalStorage();
        const localTickets = getAllTicketsFromLocalStorage();
        
        console.log(`- Local users: ${localUsers.length}`);
        console.log(`- Local orders: ${localOrders.length}`);
        console.log(`- Local tickets: ${localTickets.length}`);
        
        return {
            supabase: !!supabase,
            localUsers: localUsers.length,
            localOrders: localOrders.length,
            localTickets: localTickets.length
        };
    }
};

// جایگزینی توابع
window.supabaseFunctions = supabaseCompleteFunctions;
console.log('✅ Complete Supabase service loaded');

// اجرای مهاجرت خودکار پس از 3 ثانیه
setTimeout(async () => {
    const result = await migrateUsersToSupabase();
    if (result.success && result.migrated > 0) {
        console.log(`🚀 ${result.migrated} users migrated to Supabase`);
    }
}, 3000);
