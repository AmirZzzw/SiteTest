// supabase-service.js - نسخه اصلاح شده کامل
console.log('📦 Loading Supabase service...');

// تنظیمات Supabase
const SUPABASE_CONFIG = {
    URL: 'https://oudwditrdwugozxizehm.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZHdkaXRyZHd1Z296eGl6ZWhtIiwicm9sZURI6ImFub24iLCJpYXQiOjE3NjQ4ODQzMTcsImV4cCI6MjA4MDQ2MDMxN30.BQxoJD-WnRQQvIaQQSTzKzXLxf2LdGuPkqBCKvDruGE'
};

// ایجاد کلاینت Supabase
let supabase;

try {
    supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
    console.log('✅ Supabase client created successfully');
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    supabase = null;
}

// ========== توابع اصلی ==========

// 1. تابع اصلی ورود/عضویت
async function loginOrRegisterUser(phone, firstName = '', lastName = '', password = '') {
    try {
        console.log(`🔑 Login/Register attempt for: ${phone}`);
        
        // رمز عبور ادمین
        const ADMIN_PHONE = '09021707830';
        const ADMIN_PASSWORD = 'SidkaShop1234';
        
        // ========== حالت ادمین ==========
        if (phone === ADMIN_PHONE) {
            if (password !== ADMIN_PASSWORD) {
                return {
                    success: false,
                    error: 'رمز عبور ادمین اشتباه است',
                    code: 'WRONG_ADMIN_PASSWORD'
                };
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
            saveSession(adminUser);
            
            // ذخیره در Supabase اگر موجود بود
            if (supabase) {
                try {
                    await supabase
                        .from('users')
                        .upsert({
                            phone: ADMIN_PHONE,
                            first_name: 'امیرمحمد',
                            last_name: 'یوسفی',
                            password: ADMIN_PASSWORD,
                            is_admin: true
                        }, {
                            onConflict: 'phone'
                        });
                } catch (error) {
                    console.warn('⚠️ Could not save admin to Supabase:', error);
                }
            }
            
            return {
                success: true,
                user: adminUser,
                isAdmin: true
            };
        }
        
        // ========== کاربران عادی ==========
        
        // 1. اول سعی کن کاربر رو پیدا کنی
        let user = await findUserByPhone(phone);
        
        if (user) {
            // کاربر موجود هست
            console.log(`✅ Existing user found: ${user.first_name}`);
            
            // اگر کاربر رمز داشته و رمز اشتباه وارد شده
            if (user.password && user.password !== password) {
                return {
                    success: false,
                    error: 'رمز عبور اشتباه است',
                    code: 'WRONG_PASSWORD'
                };
            }
            
            // اگر کاربر رمز نداره و در حال ثبت‌نامه (یعنی رمز جدید داده)
            if (!user.password && password) {
                // آپدیت رمز کاربر
                user.password = password;
                await saveUserToSupabase(user);
            }
            
        } else {
            // کاربر جدید هست - باید ثبت‌نام کنه
            console.log(`📝 New user detected, registering: ${phone}`);
            
            // اگر اطلاعات کامل برای ثبت‌نام نداره
            if (!firstName || !lastName || !password) {
                return {
                    success: false,
                    error: 'برای ثبت‌نام جدید نیاز به نام، نام خانوادگی و رمز عبور دارید',
                    code: 'REGISTRATION_REQUIRED'
                };
            }
            
            // اعتبارسنجی اطلاعات
            if (!phone || phone.length !== 11 || !phone.startsWith('09')) {
                return {
                    success: false,
                    error: 'شماره موبایل معتبر وارد کنید (09xxxxxxxxx)',
                    code: 'INVALID_PHONE'
                };
            }
            
            if (password.length < 6) {
                return {
                    success: false,
                    error: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
                    code: 'WEAK_PASSWORD'
                };
            }
            
            // ایجاد کاربر جدید
            user = {
                phone: phone,
                first_name: firstName,
                last_name: lastName,
                password: password,
                is_admin: false
            };
            
            // ذخیره در Supabase
            const savedUser = await saveUserToSupabase(user);
            if (savedUser) {
                user = savedUser;
            } else {
                // اگر خطا در ذخیره Supabase، در localStorage ذخیره کن
                user.id = Date.now();
                user.created_at = new Date().toISOString();
                saveUserToLocalStorage(user);
            }
            
            console.log(`✅ New user registered: ${user.first_name} ${user.last_name}`);
        }
        
        // ذخیره سشن
        saveSession(user);
        
        return {
            success: true,
            user: user,
            isNew: !user.id // اگر id نداشته باشه یعنی کاربر جدیده
        };
        
    } catch (error) {
        console.error('❌ Error in loginOrRegisterUser:', error);
        
        // حالت fallback خیلی ساده
        const fallbackUser = {
            id: Date.now(),
            phone: phone,
            first_name: firstName || 'کاربر',
            last_name: lastName || '',
            is_admin: phone === '09021707830',
            created_at: new Date().toISOString()
        };
        
        saveSession(fallbackUser);
        
        return {
            success: true,
            user: fallbackUser,
            isNew: true
        };
    }
}

// 2. تابع ورود ساده (برای دکمه ورود)
async function loginUser(phone, password = '') {
    try {
        console.log(`🔐 Simple login for: ${phone}`);
        
        // اگر رمز نداده، بذار خالی باشه
        const actualPassword = password || '';
        
        // استفاده از تابع اصلی
        const result = await loginOrRegisterUser(
            phone, 
            '', // نام
            '', // نام خانوادگی  
            actualPassword
        );
        
        // اگر خطای ثبت‌نام بود، پیام مناسب بده
        if (!result.success && result.code === 'REGISTRATION_REQUIRED') {
            return {
                success: false,
                error: 'کاربری با این شماره وجود ندارد. لطفاً ثبت‌نام کنید.',
                code: 'USER_NOT_FOUND'
            };
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Error in loginUser:', error);
        return {
            success: false,
            error: 'خطا در ورود'
        };
    }
}

// 3. تابع ثبت‌نام کامل
async function registerUser(phone, firstName, lastName, password) {
    try {
        console.log(`📝 Full registration: ${firstName} ${lastName}`);
        
        // استفاده از تابع اصلی با اطلاعات کامل
        const result = await loginOrRegisterUser(
            phone,
            firstName,
            lastName,
            password
        );
        
        return result;
        
    } catch (error) {
        console.error('❌ Error in registerUser:', error);
        return {
            success: false,
            error: 'خطا در ثبت‌نام'
        };
    }
}

// 4. پیدا کردن کاربر با شماره تلفن
async function findUserByPhone(phone) {
    try {
        console.log(`🔍 Searching for user: ${phone}`);
        
        // اول از localStorage بگرد
        const localUser = findUserInLocalStorage(phone);
        if (localUser) {
            console.log(`✅ Found in localStorage: ${localUser.first_name}`);
            return localUser;
        }
        
        // اگر Supabase وصل نیست
        if (!supabase) {
            console.log(`📭 Supabase not available for: ${phone}`);
            return null;
        }
        
        // از Supabase بگیر
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();
        
        if (error) {
            console.warn(`⚠️ Supabase error for ${phone}:`, error.message);
            return null;
        }
        
        if (data) {
            console.log(`✅ Found in Supabase: ${data.first_name || 'کاربر'}`);
            
            // در localStorage هم ذخیره کن برای دسترسی سریع
            saveUserToLocalStorage(data);
            
            return data;
        }
        
        console.log(`📭 User not found: ${phone}`);
        return null;
        
    } catch (error) {
        console.error(`❌ Exception finding user ${phone}:`, error);
        return null;
    }
}

// 5. ذخیره کاربر در Supabase
async function saveUserToSupabase(userData) {
    try {
        console.log(`💾 Saving user to Supabase: ${userData.phone}`);
        
        if (!supabase) {
            console.warn('⚠️ Supabase not available, saving to localStorage');
            return saveUserToLocalStorage(userData);
        }
        
        const userToSave = {
            phone: userData.phone,
            first_name: userData.first_name || userData.firstName || 'کاربر',
            last_name: userData.last_name || userData.lastName || '',
            password: userData.password || null,
            is_admin: userData.is_admin || userData.isAdmin || false
        };
        
        // اگر id داره (کاربر موجود)
        if (userData.id) {
            userToSave.id = userData.id;
        }
        
        const { data, error } = await supabase
            .from('users')
            .upsert([userToSave], {
                onConflict: 'phone'
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error saving user to Supabase:', error);
            
            // ذخیره در localStorage به عنوان fallback
            return saveUserToLocalStorage(userData);
        }
        
        console.log(`✅ User saved to Supabase: ${data.id}`);
        
        // در localStorage هم ذخیره کن
        saveUserToLocalStorage(data);
        
        return data;
        
    } catch (error) {
        console.error('❌ Exception in saveUserToSupabase:', error);
        return saveUserToLocalStorage(userData);
    }
}

// 6. ذخیره سشن
function saveSession(user) {
    try {
        const sessionData = {
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000), // 24 ساعت
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('sidka_user_session', JSON.stringify(sessionData));
        console.log(`✅ Session saved for: ${user.phone}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving session:', error);
        return false;
    }
}

// 7. ذخیره کاربر در localStorage
function saveUserToLocalStorage(userData) {
    try {
        const userKey = `sidka_user_${userData.phone}`;
        const userToSave = {
            id: userData.id || Date.now(),
            phone: userData.phone,
            first_name: userData.first_name || userData.firstName || 'کاربر',
            last_name: userData.last_name || userData.lastName || '',
            password: userData.password || null,
            is_admin: userData.is_admin || userData.isAdmin || false,
            created_at: userData.created_at || new Date().toISOString()
        };
        
        localStorage.setItem(userKey, JSON.stringify(userToSave));
        console.log(`✅ User saved to localStorage: ${userData.phone}`);
        return userToSave;
    } catch (error) {
        console.error('❌ Error in saveUserToLocalStorage:', error);
        throw error;
    }
}

// 8. جستجوی کاربر در localStorage
function findUserInLocalStorage(phone) {
    try {
        const userKey = `sidka_user_${phone}`;
        const userData = localStorage.getItem(userKey);
        
        if (userData) {
            const user = JSON.parse(userData);
            console.log(`📱 Found in localStorage: ${user.first_name}`);
            return user;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error in findUserInLocalStorage:', error);
        return null;
    }
}

// ========== توابع محصولات ==========

async function getAllProducts() {
    try {
        console.log('📦 Fetching products...');
        
        // محصولات ثابت (برای مطمئن بودن)
        const fallbackProducts = [
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
        
        // اگر Supabase وصل نیست
        if (!supabase) {
            return {
                success: true,
                products: fallbackProducts,
                count: fallbackProducts.length
            };
        }
        
        // تلاش برای دریافت از Supabase
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('active', true)
                .order('id');
            
            if (error || !data || data.length === 0) {
                console.warn('⚠️ No products in Supabase, using fallback');
                return {
                    success: true,
                    products: fallbackProducts,
                    count: fallbackProducts.length
                };
            }
            
            console.log(`✅ Found ${data.length} products in Supabase`);
            return {
                success: true,
                products: data,
                count: data.length
            };
            
        } catch (supabaseError) {
            console.warn('⚠️ Supabase error, using fallback:', supabaseError);
            return {
                success: true,
                products: fallbackProducts,
                count: fallbackProducts.length
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting products:', error);
        return {
            success: true,
            products: [
                { id: 1, name: 'ساخت پنل', description: 'ساخت پنل اختصاصی با امکانات کامل', price: 900000, category: 'panels', icon: 'fas fa-plus-circle', active: true },
                { id: 2, name: 'آپدیت پنل', description: 'ارتقاء و به‌روزرسانی پنل موجود', price: 235000, category: 'panels', icon: 'fas fa-sync-alt', active: true },
                { id: 3, name: 'اشتراک سلف تلگرام - یک ماهه', description: 'اشتراک یکماهه سلف تلگرام', price: 40000, category: 'subscriptions', icon: 'fab fa-telegram', active: true }
            ],
            count: 3
        };
    }
}

// ========== توابع سفارشات ==========

async function createNewOrder(orderData) {
    try {
        console.log('🛒 Creating order:', orderData);
        
        // اطمینان از ساختار داده
        const orderToSave = {
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
        
        // 1. ذخیره در localStorage
        try {
            let orders = [];
            const stored = localStorage.getItem('sidka_orders');
            if (stored) {
                orders = JSON.parse(stored);
                if (!Array.isArray(orders)) orders = [];
            }
            
            orders.push(orderToSave);
            localStorage.setItem('sidka_orders', JSON.stringify(orders));
            console.log('✅ Order saved to localStorage:', orderToSave.id);
        } catch (storageError) {
            console.error('❌ localStorage error:', storageError);
        }
        
        // 2. ذخیره در Supabase (اگر موجود است)
        if (supabase) {
            try {
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
                console.log('✅ Order saved to Supabase:', data.id);
            } catch (supabaseError) {
                console.warn('⚠️ Supabase error:', supabaseError);
            }
        }
        
        return {
            success: true,
            order: orderToSave,
            message: 'سفارش با موفقیت ثبت شد'
        };
        
    } catch (error) {
        console.error('❌ Error in createNewOrder:', error);
        return {
            success: false,
            error: 'خطا در ثبت سفارش: ' + error.message
        };
    }
}

async function getUserOrders(userId) {
    try {
        console.log('📋 Getting orders for user:', userId);
        
        const localOrders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const userLocalOrders = localOrders.filter(order => 
            order.userId == userId || order.user_id == userId
        );
        
        console.log('Found in localStorage:', userLocalOrders.length, 'orders');
        
        if (!supabase) {
            return {
                success: true,
                orders: userLocalOrders
            };
        }
        
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                return {
                    success: true,
                    orders: userLocalOrders
                };
            }
            
            if (data && data.length > 0) {
                console.log('Found in Supabase:', data.length, 'orders');
                return {
                    success: true,
                    orders: data
                };
            }
            
            return {
                success: true,
                orders: userLocalOrders
            };
            
        } catch (supabaseError) {
            return {
                success: true,
                orders: userLocalOrders
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting user orders:', error);
        
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const userOrders = orders.filter(order => order.userId == userId);
        
        return {
            success: true,
            orders: userOrders
        };
    }
}

async function getAllOrders() {
    try {
        console.log('📋 Getting all orders for admin...');
        
        const localOrders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        console.log('Found in localStorage:', localOrders.length, 'orders');
        
        let supabaseOrders = [];
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, users(phone, first_name, last_name)')
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    supabaseOrders = data;
                    console.log('Found in Supabase:', supabaseOrders.length, 'orders');
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase error:', supabaseError);
            }
        }
        
        const allOrders = [...supabaseOrders, ...localOrders];
        const uniqueOrders = [];
        const seenIds = new Set();
        
        allOrders.forEach(order => {
            const orderId = order.id;
            if (!seenIds.has(orderId)) {
                seenIds.add(orderId);
                uniqueOrders.push(order);
            }
        });
        
        console.log('Total unique orders:', uniqueOrders.length);
        
        uniqueOrders.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0);
            const dateB = new Date(b.created_at || b.createdAt || 0);
            return dateB - dateA;
        });
        
        return {
            success: true,
            orders: uniqueOrders
        };
        
    } catch (error) {
        console.error('❌ Error getting all orders:', error);
        
        const localOrders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        return {
            success: true,
            orders: localOrders
        };
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        console.log(`📊 Updating order ${orderId} status to: ${status}`);
        
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id == orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = status;
            localStorage.setItem('sidka_orders', JSON.stringify(orders));
            console.log(`✅ Order ${orderId} updated in localStorage`);
        }
        
        if (supabase) {
            try {
                const { error } = await supabase
                    .from('orders')
                    .update({ 
                        status: status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderId);
                
                if (!error) {
                    console.log(`✅ Order ${orderId} updated in Supabase`);
                }
            } catch (supabaseError) {
                console.warn(`⚠️ Supabase error:`, supabaseError);
            }
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        return { success: false, error: 'خطا در بروزرسانی سفارش' };
    }
}

async function getOrderReceipt(orderId) {
    try {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const order = orders.find(o => o.id == orderId);
        
        if (order && order.receipt_info) {
            return {
                success: true,
                receipt: order.receipt_info
            };
        }
        
        if (supabase) {
            const { data, error } = await supabase
                .from('orders')
                .select('receipt_info')
                .eq('id', orderId)
                .single();
            
            if (!error && data && data.receipt_info) {
                return {
                    success: true,
                    receipt: data.receipt_info
                };
            }
        }
        
        return {
            success: false,
            error: 'رسید یافت نشد'
        };
    } catch {
        return {
            success: false,
            error: 'خطا در دریافت رسید'
        };
    }
}

// ========== توابع تیکت‌ها ==========

async function createNewTicket(ticketData) {
    try {
        console.log('🎫 Creating ticket:', ticketData);
        
        // اطلاعات کاربر فعلی
        const currentUser = JSON.parse(localStorage.getItem('sidka_user_session'))?.user;
        if (!currentUser) {
            return {
                success: false,
                error: 'لطفاً ابتدا وارد شوید'
            };
        }
        
        // ساختار داده تیکت جدید
        const ticketToSave = {
            user_phone: currentUser.phone,
            subject: ticketData.subject || 'بدون موضوع',
            message: ticketData.message || 'بدون پیام',
            status: 'جدید'
        };
        
        console.log('📤 Saving ticket:', ticketToSave);
        
        // ذخیره در localStorage
        const localTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const newTicket = {
            id: Date.now(),
            ...ticketToSave,
            created_at: new Date().toISOString()
        };
        localTickets.push(newTicket);
        localStorage.setItem('sidka_tickets', JSON.stringify(localTickets));
        
        // ذخیره در Supabase
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .insert([ticketToSave])
                    .select()
                    .single();
                
                if (error) {
                    console.warn('⚠️ Supabase error, using localStorage:', error);
                } else {
                    console.log('✅ Ticket saved to Supabase:', data.id);
                    return {
                        success: true,
                        ticket: data,
                        message: 'تیکت با موفقیت ارسال شد'
                    };
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase exception:', supabaseError);
            }
        }
        
        return {
            success: true,
            ticket: newTicket,
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

async function getUserTickets(userPhone) {
    try {
        console.log('📨 Getting tickets for user:', userPhone);
        
        // از localStorage بخون
        const localTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const userLocalTickets = localTickets.filter(ticket => 
            ticket.user_phone === userPhone
        );
        
        console.log('Found in localStorage:', userLocalTickets.length, 'tickets');
        
        // اگر Supabase وصل نیست
        if (!supabase) {
            return {
                success: true,
                tickets: userLocalTickets.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                )
            };
        }
        
        // از Supabase بخون
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_phone', userPhone)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('⚠️ Supabase error, using localStorage:', error);
                return {
                    success: true,
                    tickets: userLocalTickets
                };
            }
            
            if (data && data.length > 0) {
                console.log('Found in Supabase:', data.length, 'tickets');
                
                // ترکیب داده‌ها
                const allTickets = [...data, ...userLocalTickets];
                const uniqueTickets = [];
                const seenIds = new Set();
                
                allTickets.forEach(ticket => {
                    const ticketId = ticket.id;
                    if (!seenIds.has(ticketId)) {
                        seenIds.add(ticketId);
                        uniqueTickets.push(ticket);
                    }
                });
                
                return {
                    success: true,
                    tickets: uniqueTickets.sort((a, b) => 
                        new Date(b.created_at) - new Date(a.created_at)
                    )
                };
            }
            
            return {
                success: true,
                tickets: userLocalTickets
            };
            
        } catch (supabaseError) {
            console.warn('⚠️ Supabase exception:', supabaseError);
            return {
                success: true,
                tickets: userLocalTickets
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting user tickets:', error);
        return {
            success: true,
            tickets: []
        };
    }
}

async function getAllTickets() {
    try {
        console.log('📋 Getting all tickets for admin...');
        
        // از localStorage بخون
        const localTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        
        // اگر Supabase وصل نیست
        if (!supabase) {
            return {
                success: true,
                tickets: localTickets.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                )
            };
        }
        
        // از Supabase بخون
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('⚠️ Supabase error, using localStorage:', error);
                return {
                    success: true,
                    tickets: localTickets
                };
            }
            
            if (data && data.length > 0) {
                console.log('Found in Supabase:', data.length, 'tickets');
                
                // ترکیب داده‌ها
                const allTickets = [...data, ...localTickets];
                const uniqueTickets = [];
                const seenIds = new Set();
                
                allTickets.forEach(ticket => {
                    const ticketId = ticket.id;
                    if (!seenIds.has(ticketId)) {
                        seenIds.add(ticketId);
                        uniqueTickets.push(ticket);
                    }
                });
                
                return {
                    success: true,
                    tickets: uniqueTickets.sort((a, b) => 
                        new Date(b.created_at) - new Date(a.created_at)
                    )
                };
            }
            
            return {
                success: true,
                tickets: localTickets
            };
            
        } catch (supabaseError) {
            console.warn('⚠️ Supabase exception:', supabaseError);
            return {
                success: true,
                tickets: localTickets
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting all tickets:', error);
        return {
            success: true,
            tickets: []
        };
    }
}

async function updateTicketStatus(ticketId, status) {
    try {
        console.log(`🔄 Updating ticket ${ticketId} status to: ${status}`);
        
        // آپدیت در localStorage
        const localTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const updatedLocalTickets = localTickets.map(ticket => {
            if (ticket.id == ticketId) {
                return { ...ticket, status: status };
            }
            return ticket;
        });
        localStorage.setItem('sidka_tickets', JSON.stringify(updatedLocalTickets));
        
        // آپدیت در Supabase
        if (supabase) {
            try {
                const { error } = await supabase
                    .from('tickets')
                    .update({ status: status })
                    .eq('id', ticketId);
                
                if (error) {
                    console.warn('⚠️ Supabase error:', error);
                } else {
                    console.log('✅ Ticket status updated in Supabase');
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase exception:', supabaseError);
            }
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error updating ticket status:', error);
        return { success: false };
    }
}

async function addTicketReply(ticketId, replyData) {
    try {
        console.log(`💬 Adding reply to ticket ${ticketId}:`, replyData);
        
        // اطلاعات پاسخ‌دهنده
        const currentUser = JSON.parse(localStorage.getItem('sidka_user_session'))?.user;
        if (!currentUser) {
            return {
                success: false,
                error: 'لطفاً ابتدا وارد شوید'
            };
        }
        
        // چک کن که آیا کاربر ادمینه یا نه
        const isAdmin = currentUser.is_admin || currentUser.phone === '09021707830';
        const replyIsAdmin = replyData.isAdmin || isAdmin;
        
        console.log(`📝 User is admin: ${isAdmin}, Reply will be admin: ${replyIsAdmin}`);
        
        // ساختار داده پاسخ
        const replyToSave = {
            ticket_id: ticketId,
            responder_phone: currentUser.phone,
            is_admin: replyIsAdmin, // اینجا اصلاح شد
            message: replyData.message || '',
            responder_name: replyIsAdmin ? '👑 ادمین' : (currentUser.first_name || 'کاربر')
        };
        
        console.log('📤 Saving reply:', replyToSave);
        
        // 1. ذخیره در localStorage
        const localReplies = JSON.parse(localStorage.getItem('sidka_ticket_replies') || '[]');
        const newReply = {
            id: Date.now(),
            ...replyToSave,
            created_at: new Date().toISOString()
        };
        localReplies.push(newReply);
        localStorage.setItem('sidka_ticket_replies', JSON.stringify(localReplies));
        
        // 2. ذخیره در Supabase
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('ticket_replies')
                    .insert([replyToSave])
                    .select()
                    .single();
                
                if (error) {
                    console.warn('⚠️ Supabase error, using localStorage:', error);
                } else {
                    console.log('✅ Reply saved to Supabase:', data.id);
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase exception:', supabaseError);
            }
        }
        
        // 3. آپدیت وضعیت تیکت
        const newStatus = replyIsAdmin ? 'پاسخ داده شده' : 'در انتظار پاسخ ادمین';
        await updateTicketStatus(ticketId, newStatus);
        
        console.log(`✅ Ticket ${ticketId} status updated to: ${newStatus}`);
        
        return {
            success: true,
            reply: newReply,
            message: 'پاسخ با موفقیت ارسال شد',
            isAdmin: replyIsAdmin
        };
        
    } catch (error) {
        console.error('❌ Error adding ticket reply:', error);
        return {
            success: false,
            error: 'خطا در ارسال پاسخ'
        };
    }
}

async function getTicketReplies(ticketId) {
    try {
        console.log(`📨 Getting replies for ticket ${ticketId}`);
        
        let allReplies = [];
        
        // از localStorage بخون
        const localReplies = JSON.parse(localStorage.getItem('sidka_ticket_replies') || '[]');
        const localTicketReplies = localReplies.filter(reply => reply.ticket_id == ticketId);
        
        // از Supabase بخون (اگر وصل هست)
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('ticket_replies')
                    .select('*')
                    .eq('ticket_id', ticketId)
                    .order('created_at', { ascending: true });
                
                if (!error && data) {
                    allReplies = [...data, ...localTicketReplies];
                } else {
                    allReplies = localTicketReplies;
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase exception:', supabaseError);
                allReplies = localTicketReplies;
            }
        } else {
            allReplies = localTicketReplies;
        }
        
        // حذف duplicates
        const uniqueReplies = [];
        const seenIds = new Set();
        
        allReplies.forEach(reply => {
            const replyId = reply.id;
            if (!seenIds.has(replyId)) {
                seenIds.add(replyId);
                uniqueReplies.push(reply);
            }
        });
        
        // مرتب کردن بر اساس تاریخ
        uniqueReplies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        return {
            success: true,
            replies: uniqueReplies,
            totalReplies: uniqueReplies.length
        };
        
    } catch (error) {
        console.error('❌ Error getting ticket replies:', error);
        return {
            success: true,
            replies: [],
            totalReplies: 0
        };
    }
}
async function getTicketDetails(ticketId) {
    try {
        console.log(`🔍 Getting details for ticket ${ticketId}`);
        
        let ticket = null;
        
        // اول از localStorage بگرد
        const localTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        ticket = localTickets.find(t => t.id == ticketId);
        
        // اگر پیدا نشد، از Supabase بگیر
        if (!ticket && supabase) {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .single();
            
            if (!error && data) {
                ticket = data;
            }
        }
        
        if (!ticket) {
            return {
                success: false,
                error: 'تیکت یافت نشد'
            };
        }
        
        // دریافت پاسخ‌ها - ببینیم کاربر ادمینه یا نه
        const currentUser = JSON.parse(localStorage.getItem('sidka_user_session'))?.user;
        const isAdmin = currentUser && (currentUser.is_admin || currentUser.phone === '09021707830');
        const canViewAdminReplies = isAdmin; // فقط ادمین‌ها می‌تونن پاسخ‌های ادمین رو ببینن
        
        // دریافت پاسخ‌ها با در نظر گرفتن سطح دسترسی
        const repliesResult = await getTicketReplies(ticketId, canViewAdminReplies);
        
        return {
            success: true,
            ticket: ticket,
            replies: repliesResult.replies || [],
            isAdmin: isAdmin,
            userPhone: currentUser?.phone || null,
            currentUser: currentUser // کل کاربر رو برگردون
        };
        
    } catch (error) {
        console.error('❌ Error getting ticket details:', error);
        return {
            success: false,
            error: 'خطا در دریافت اطلاعات تیکت'
        };
    }
}
// ========== توابع دیگر ==========

async function getAllUsers() {
    try {
        if (!supabase) return { success: true, users: [] };
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) return { success: true, users: [] };
        
        return { success: true, users: data || [] };
    } catch {
        return { success: true, users: [] };
    }
}

async function updateUserInfo(userId, firstName, lastName) {
    try {
        const sessionStr = localStorage.getItem('sidka_user_session');
        if (sessionStr) {
            const sessionData = JSON.parse(sessionStr);
            if (sessionData.user && sessionData.user.id == userId) {
                sessionData.user.first_name = firstName;
                sessionData.user.last_name = lastName;
                localStorage.setItem('sidka_user_session', JSON.stringify(sessionData));
            }
        }
        
        if (supabase) {
            await supabase
                .from('users')
                .update({
                    first_name: firstName,
                    last_name: lastName
                })
                .eq('id', userId);
        }
        
        return { success: true };
    } catch {
        return { success: true };
    }
}

async function getDashboardStats() {
    try {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        
        const totalIncome = orders
            .filter(o => o.status === 'تأیید شده')
            .reduce((sum, order) => sum + (order.total || 0), 0);
        
        const newTickets = tickets.filter(t => t.status === 'جدید').length;
        const users = 1 + Math.floor(orders.length / 2);
        
        return {
            success: true,
            stats: {
                users: users,
                orders: orders.length,
                totalIncome: totalIncome,
                newTickets: newTickets
            }
        };
    } catch {
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

// ========== توابع کمکی ==========

function getAllUsersFromLocalStorage() {
    try {
        const keys = Object.keys(localStorage);
        const userKeys = keys.filter(key => key.startsWith('sidka_user_'));
        
        const users = userKeys.map(key => {
            try {
                return JSON.parse(localStorage.getItem(key));
            } catch {
                return null;
            }
        }).filter(user => user);
        
        return users;
    } catch (error) {
        return [];
    }
}

// ==================== اتصال به window ====================
const supabaseFunctions = {
    // توابع کاربران
    loginOrRegisterUser,
    loginUser,
    registerUser,
    
    // توابع محصولات
    getAllProducts,
    
    // توابع سفارشات
    createNewOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    getOrderReceipt,
    
    // توابع تیکت‌ها
    createNewTicket,
    getUserTickets,
    getAllTickets,
    addTicketReply,
    getTicketReplies,
    getTicketDetails,
    updateTicketStatus,
    
    // توابع دیگر
    getAllUsers,
    updateUserInfo,
    getDashboardStats,
    
    // توابع کمکی
    clearAuthData: function() {
        localStorage.removeItem('sidka_user_session');
    }
};

window.supabaseFunctions = supabaseFunctions;
console.log('✅ Supabase service loaded successfully with', Object.keys(supabaseFunctions).length, 'functions');
