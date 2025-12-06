// supabase-service-complete.js - ذخیره کامل در Supabase
console.log('🚀 Loading Complete Supabase Service...');

// تنظیمات Supabase
const SUPABASE_CONFIG = {
    URL: 'https://oudwditrdwugozxizehm.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZHdkaXRyZHd1Z296eGl6ZWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODQzMTcsImV4cCI6MjA4MDQ2MDMxN30.BQxoJD-WnRQQvIaQQSTzKzXLxf2LdGuPkqBCKvDruGE',
    SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZHdkaXRyZHd1Z296eGl6ZWhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4NDMxNywiZXhwIjIwODA0NjAzMTd9.tdOH4sUcWbYf_cwH5_qiT-nP8z2P-_yDhsPSIyhzo-s'
};

// ایجاد کلاینت‌های Supabase
let supabase;
let supabaseAdmin; // برای عملیات ادمین

try {
    if (window.supabase) {
        // کلاینت عادی (با ANON_KEY)
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
        );
        
        // کلاینت ادمین (با SERVICE_KEY) - برای عملیات خاص
        supabaseAdmin = window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.SERVICE_KEY
        );
        
        console.log('✅ Both Supabase clients created');
    } else {
        console.error('❌ Supabase library not loaded');
        supabase = null;
        supabaseAdmin = null;
    }
} catch (error) {
    console.error('❌ Failed to create Supabase clients:', error);
    supabase = null;
    supabaseAdmin = null;
}

// ========== توابع کاربران در Supabase ==========

// 1. پیدا کردن کاربر با شماره تلفن
async function findUserByPhone(phone) {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not available, checking localStorage');
            return findUserInLocalStorage(phone);
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') { // No rows returned
                return null;
            }
            console.error('❌ Error finding user:', error);
            return null;
        }
        
        console.log(`✅ User found in Supabase: ${data.phone}`);
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
            console.warn('⚠️ Supabase not available, saving to localStorage');
            return saveUserToLocalStorage(userData);
        }
        
        // آماده‌سازی داده
        const userToSave = {
            phone: userData.phone,
            first_name: userData.first_name || userData.firstName,
            last_name: userData.last_name || userData.lastName,
            password: userData.password,
            is_admin: userData.is_admin || false
        };
        
        // اگر id داره (کاربر موجود)
        if (userData.id) {
            userToSave.id = userData.id;
        }
        
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
        throw error;
    }
}

// 3. ورود با رمز عبور (بررسی در Supabase)
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
            
            // پیدا کردن یا ایجاد کاربر ادمین
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

// 4. ثبت‌نام جدید در Supabase
async function registerUserInSupabase(phone, firstName, lastName, password) {
    try {
        console.log(`📝 Registering: ${firstName} ${lastName}`);
        
        // اعتبارسنجی
        if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
            return {
                success: false,
                error: 'شماره موبایل معتبر وارد کنید',
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
        if (!supabaseAdmin) {
            console.warn('⚠️ Admin client not available');
            return getAllUsersFromLocalStorage();
        }
        
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error getting users:', error);
            throw error;
        }
        
        console.log(`✅ Retrieved ${data.length} users from Supabase`);
        return data;
        
    } catch (error) {
        console.error('❌ Exception in getAllUsersFromSupabase:', error);
        return [];
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
        throw error;
    }
}

// ========== توابع کمکی ==========

// ذخیره سشن
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

// Fallback: جستجو در localStorage
function findUserInLocalStorage(phone) {
    try {
        const userKey = `sidka_user_${phone}`;
        const userData = localStorage.getItem(userKey);
        
        if (userData) {
            return JSON.parse(userData);
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error in findUserInLocalStorage:', error);
        return null;
    }
}

// Fallback: ذخیره در localStorage
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
        console.log(`✅ User saved to localStorage: ${userData.phone}`);
        return userToSave;
    } catch (error) {
        console.error('❌ Error in saveUserToLocalStorage:', error);
        throw error;
    }
}

// Fallback: دریافت همه کاربران از localStorage
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

// Fallback: آپدیت کاربر در localStorage
function updateUserInLocalStorage(userId, firstName, lastName) {
    try {
        const keys = Object.keys(localStorage);
        const userKey = keys.find(key => 
            key.startsWith('sidka_user_') && 
            !key.includes('session')
        );
        
        if (userKey) {
            const user = JSON.parse(localStorage.getItem(userKey));
            if (user.id == userId) {
                user.first_name = firstName;
                user.last_name = lastName;
                localStorage.setItem(userKey, JSON.stringify(user));
                
                // آپدیت سشن هم
                const session = JSON.parse(localStorage.getItem('sidka_user_session') || '{}');
                if (session.user && session.user.id == userId) {
                    session.user.first_name = firstName;
                    session.user.last_name = lastName;
                    localStorage.setItem('sidka_user_session', JSON.stringify(session));
                }
                
                return user;
            }
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error in updateUserInLocalStorage:', error);
        return null;
    }
}

// ========== مهاجرت کاربران از localStorage به Supabase ==========

async function migrateUsersToSupabase() {
    try {
        console.log('🚚 Starting user migration to Supabase...');
        
        const localUsers = getAllUsersFromLocalStorage();
        
        if (localUsers.length === 0) {
            console.log('📭 No local users to migrate');
            return { success: true, migrated: 0 };
        }
        
        let migratedCount = 0;
        
        for (const localUser of localUsers) {
            try {
                // چک کن که در Supabase وجود نداره
                const existingUser = await findUserByPhone(localUser.phone);
                
                if (!existingUser) {
                    // مهاجرت کاربر
                    await saveUserToSupabase({
                        phone: localUser.phone,
                        first_name: localUser.first_name || localUser.firstName,
                        last_name: localUser.last_name || localUser.lastName,
                        password: localUser.password || null,
                        is_admin: localUser.is_admin || false
                    });
                    
                    migratedCount++;
                    console.log(`✅ Migrated user: ${localUser.phone}`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to migrate user ${localUser.phone}:`, error);
            }
        }
        
        console.log(`🎉 Migration complete: ${migratedCount} users migrated`);
        return { success: true, migrated: migratedCount };
        
    } catch (error) {
        console.error('❌ Error in migrateUsersToSupabase:', error);
        return { success: false, error: error.message };
    }
}

// ========== توابع سفارشات و تیکت‌ها (همچنان در Supabase) ==========

// توابع قبلی رو با کمی تغییر اینجا بیار...

// ========== اتصال همه توابع به window ==========

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
    
    // توابع مدیریت کاربران
    getAllUsers: getAllUsersFromSupabase,
    updateUserInfo: updateUserInfoInSupabase,
    
    // توابع محصولات
    getAllProducts: async function() {
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
    },
    
    // توابع سفارشات (همان قبلی با تغییرات جزئی)
    createNewOrder: async function(orderData) {
        try {
            // ذخیره در Supabase
            if (supabase) {
                const { data, error } = await supabase
                    .from('orders')
                    .insert([{
                        user_id: orderData.userId,
                        total: orderData.total,
                        status: 'در انتظار تأیید',
                        customer_info: orderData.customerInfo,
                        receipt_info: orderData.receipt,
                        items: orderData.items
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                // خالی کردن سبد خرید
                localStorage.removeItem('sidka_cart');
                
                return {
                    success: true,
                    order: data,
                    message: 'سفارش در Supabase ذخیره شد'
                };
            }
            
            // Fallback به localStorage
            return fallbackFunctions.createNewOrder(orderData);
            
        } catch (error) {
            console.error('❌ Error creating order:', error);
            return fallbackFunctions.createNewOrder(orderData);
        }
    },
    
    getUserOrders: async function(userId) {
        try {
            if (supabase) {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                return {
                    success: true,
                    orders: data || []
                };
            }
            
            return fallbackFunctions.getUserOrders(userId);
            
        } catch (error) {
            console.error('❌ Error getting user orders:', error);
            return fallbackFunctions.getUserOrders(userId);
        }
    },
    
    // بقیه توابع...
    
    // ابزارهای مدیریتی
    migrateUsers: migrateUsersToSupabase,
    
    // دیباگ
    debug: function() {
        console.log('🔍 Debug Info:');
        console.log('- Supabase client:', supabase ? 'Available' : 'Not available');
        console.log('- Admin client:', supabaseAdmin ? 'Available' : 'Not available');
        
        // تعداد کاربران در localStorage
        const localUsers = getAllUsersFromLocalStorage();
        console.log(`- Local users: ${localUsers.length}`);
        
        return {
            supabase: !!supabase,
            admin: !!supabaseAdmin,
            localUsers: localUsers.length
        };
    }
};

// توابع Fallback
const fallbackFunctions = {
    createNewOrder: async function(orderData) {
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
    },
    
    getUserOrders: async function(userId) {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const userOrders = orders.filter(order => order.userId == userId || order.user_id == userId);
        return { success: true, orders: userOrders };
    }
};

// جایگزینی توابع
window.supabaseFunctions = supabaseCompleteFunctions;
console.log('✅ Complete Supabase service loaded');

// اجرای مهاجرت خودکار
setTimeout(async () => {
    const result = await migrateUsersToSupabase();
    if (result.success && result.migrated > 0) {
        console.log(`🚀 ${result.migrated} users migrated to Supabase`);
    }
}, 3000);
