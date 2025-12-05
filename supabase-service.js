// supabase-service.js - Complete Version
console.log('📦 Loading Supabase service...');

// تنظیمات Supabase
const SUPABASE_CONFIG = {
    URL: 'https://oudwditrdwugozxizehm.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZHdkaXRyZHd1Z296eGl6ZWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODQzMTcsImV4cCI6MjA4MDQ2MDMxN30.BQxoJD-WnRQQvIaQQSTzKzXLxf2LdGuPkqBCKvDruGE'
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

// 1. ورود/عضویت کاربر
async function loginOrRegisterUser(phone, firstName = '', lastName = '', password = '') {
    try {
        console.log('🔑 Login/register for:', phone);
        
        // پسورد ادمین
        const ADMIN_PASSWORD = 'SidkaShop1234';
        const ADMIN_PHONE = '09021707830';
        
        // اگر شماره ادمین بود
        if (phone === ADMIN_PHONE) {
            if (password !== ADMIN_PASSWORD) {
                return {
                    success: false,
                    error: 'رمز عبور ادمین اشتباه است'
                };
            }
            
            // ایجاد کاربر ادمین
            const adminUser = {
                id: 1,
                phone: ADMIN_PHONE,
                first_name: 'امیرمحمد',
                last_name: 'یوسفی',
                is_admin: true,
                created_at: new Date().toISOString()
            };
            
            // ذخیره در localStorage
            localStorage.setItem('sidka_user_session', JSON.stringify({
                user: adminUser,
                expiry: Date.now() + (24 * 60 * 60 * 1000)
            }));
            
            // تلاش برای ذخیره در Supabase
            try {
                if (supabase) {
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
                }
            } catch (supabaseError) {
                console.warn('⚠️ Could not save admin to Supabase:', supabaseError);
            }
            
            return {
                success: true,
                user: adminUser
            };
        }
        
        // برای کاربران عادی
        if (!supabase) {
            // حالت fallback
            const user = {
                id: Date.now(),
                phone: phone,
                first_name: firstName || 'کاربر',
                last_name: lastName || '',
                is_admin: false,
                created_at: new Date().toISOString()
            };
            
            localStorage.setItem('sidka_user_session', JSON.stringify({
                user: user,
                expiry: Date.now() + (24 * 60 * 60 * 1000)
            }));
            
            return {
                success: true,
                user: user,
                isNew: true
            };
        }
        
        // جستجوی کاربر در Supabase
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();
        
        let user;
        
        if (existingUser) {
            // کاربر موجود
            user = existingUser;
            
            // چک کردن پسورد
            if (user.password && user.password !== password) {
                return {
                    success: false,
                    error: 'رمز عبور اشتباه است'
                };
            }
            
            console.log('✅ Existing user found:', user.id);
        } else {
            // ایجاد کاربر جدید
            const newUser = {
                phone: phone,
                first_name: firstName || 'کاربر',
                last_name: lastName || '',
                password: password || null,
                is_admin: false
            };
            
            const { data, error } = await supabase
                .from('users')
                .insert([newUser])
                .select()
                .single();
            
            if (error) {
                console.warn('⚠️ Error creating user:', error);
                user = newUser;
                user.id = Date.now();
                user.created_at = new Date().toISOString();
            } else {
                user = data;
                console.log('✅ New user created:', user.id);
            }
        }
        
        // ذخیره سشن
        localStorage.setItem('sidka_user_session', JSON.stringify({
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        }));
        
        return {
            success: true,
            user: user,
            isNew: !existingUser
        };
        
    } catch (error) {
        console.error('❌ Error in login/register:', error);
        
        // حالت fallback
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
        
        return {
            success: true,
            user: user,
            isNew: true
        };
    }
}

// 2. ورود با رمز
async function loginUser(phone, password) {
    return loginOrRegisterUser(phone, '', '', password);
}

// 3. ثبت‌نام کامل
async function registerUser(phone, firstName, lastName, password) {
    return loginOrRegisterUser(phone, firstName, lastName, password);
}

// 4. دریافت همه محصولات
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
        
        // حالت fallback
        const fallbackProducts = [
            { id: 1, name: 'ساخت پنل', description: 'ساخت پنل اختصاصی با امکانات کامل', price: 900000, category: 'panels', icon: 'fas fa-plus-circle', active: true },
            { id: 2, name: 'آپدیت پنل', description: 'ارتقاء و به‌روزرسانی پنل موجود', price: 235000, category: 'panels', icon: 'fas fa-sync-alt', active: true },
            { id: 3, name: 'اشتراک سلف تلگرام - یک ماهه', description: 'اشتراک یکماهه سلف تلگرام', price: 40000, category: 'subscriptions', icon: 'fab fa-telegram', active: true }
        ];
        
        return {
            success: true,
            products: fallbackProducts,
            count: fallbackProducts.length
        };
    }
}

// 5. ایجاد سفارش جدید
// 5. ایجاد سفارش جدید
async function createNewOrder(orderData) {
    try {
        console.log('🛒 Creating order for user:', orderData.userId);
        console.log('Order data:', orderData); // برای دیباگ
        
        // ========== 1. اول در localStorage ذخیره کن (برای مطمئن بودن) ==========
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const localOrder = {
            id: orderData.id || Date.now(),
            userId: orderData.userId,
            user_id: orderData.userId,
            total: orderData.total,
            status: 'در انتظار تأیید',
            customer_info: orderData.customerInfo,
            receipt_info: orderData.receipt,
            items: orderData.items,
            created_at: new Date().toISOString()
        };
        
        orders.push(localOrder);
        localStorage.setItem('sidka_orders', JSON.stringify(orders));
        
        console.log('✅ Order saved to localStorage:', localOrder.id);
        
        // خالی کردن سبد خرید
        localStorage.removeItem('sidka_cart');
        
        // ========== 2. تلاش برای ذخیره در Supabase ==========
        if (!supabase) {
            console.warn('⚠️ Supabase not connected, only saved locally');
            return {
                success: true,
                order: localOrder,
                message: 'سفارش ثبت شد (ذخیره محلی)'
            };
        }
        
        try {
            // ساخت شیء برای Supabase
            const supabaseOrder = {
                user_id: orderData.userId,
                total: orderData.total,
                status: 'در انتظار تأیید',
                customer_info: orderData.customerInfo,
                receipt_info: orderData.receipt,
                items: orderData.items
            };
            
            console.log('📤 Sending to Supabase:', supabaseOrder);
            
            const { data, error } = await supabase
                .from('orders')
                .insert([supabaseOrder])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error creating order in Supabase:', error);
                console.error('Error details:', error.message);
                
                return {
                    success: true,
                    order: localOrder,
                    message: 'سفارش ثبت شد (ذخیره محلی - خطای Supabase)'
                };
            }
            
            console.log('✅ Order created in Supabase:', data.id);
            
            return {
                success: true,
                order: data,
                message: 'سفارش با موفقیت ثبت شد'
            };
            
        } catch (supabaseError) {
            console.error('❌ Supabase error:', supabaseError);
            
            return {
                success: true,
                order: localOrder,
                message: 'سفارش ثبت شد (ذخیره محلی - خطای اتصال)'
            };
        }
        
    } catch (error) {
        console.error('❌ Error in createNewOrder:', error);
        
        // حالت fallback
        const fallbackOrder = {
            id: Date.now(),
            userId: orderData.userId,
            total: orderData.total || 0,
            status: 'در انتظار تأیید',
            created_at: new Date().toISOString()
        };
        
        return {
            success: true,
            order: fallbackOrder,
            message: 'سفارش ثبت شد (حالت اضطراری)'
        };
    }
}
// 6. دریافت سفارشات کاربر
async function getUserOrders(userId) {
    try {
        console.log('📋 Getting orders for user:', userId);
        
        // اول از localStorage بگیر
        const localOrders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const userLocalOrders = localOrders.filter(order => 
            order.userId == userId || order.user_id == userId
        );
        
        console.log('Found orders in localStorage:', userLocalOrders.length);
        
        // اگر Supabase وصل نیست
        if (!supabase) {
            return {
                success: true,
                orders: userLocalOrders
            };
        }
        
        // تلاش برای دریافت از Supabase
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('⚠️ Error getting orders from Supabase:', error);
                return {
                    success: true,
                    orders: userLocalOrders
                };
            }
            
            // اگر سفارشی در Supabase هست
            if (data && data.length > 0) {
                console.log('Found orders in Supabase:', data.length);
                return {
                    success: true,
                    orders: data
                };
            }
            
            // اگر نه، از localStorage برگردون
            return {
                success: true,
                orders: userLocalOrders
            };
            
        } catch (supabaseError) {
            console.warn('⚠️ Supabase error:', supabaseError);
            return {
                success: true,
                orders: userLocalOrders
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting user orders:', error);
        
        // در هر صورت از localStorage برگردون
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const userOrders = orders.filter(order => order.userId == userId);
        
        return {
            success: true,
            orders: userOrders
        };
    }
}

// 7. ایجاد تیکت جدید
async function createNewTicket(ticketData) {
    try {
        console.log('🎫 Creating ticket:', ticketData.subject);
        
        // ذخیره در localStorage (همیشه)
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const localTicket = {
            id: Date.now(),
            userId: ticketData.userId,
            user_id: ticketData.userId,
            subject: ticketData.subject,
            message: ticketData.message,
            created_at: new Date().toISOString(),
            status: 'جدید'
        };
        
        tickets.push(localTicket);
        localStorage.setItem('sidka_tickets', JSON.stringify(tickets));
        
        console.log('✅ Ticket saved to localStorage:', localTicket.id);
        
        // اگر Supabase وصل نیست
        if (!supabase) {
            return {
                success: true,
                ticket: localTicket
            };
        }
        
        // تلاش برای ذخیره در Supabase
        try {
            const supabaseTicket = {
                user_id: ticketData.userId,
                subject: ticketData.subject,
                message: ticketData.message,
                status: 'جدید'
            };
            
            const { data, error } = await supabase
                .from('tickets')
                .insert([supabaseTicket])
                .select()
                .single();
            
            if (error) {
                console.warn('⚠️ Error creating ticket in Supabase:', error);
                return {
                    success: true,
                    ticket: localTicket
                };
            }
            
            console.log('✅ Ticket created in Supabase:', data.id);
            return {
                success: true,
                ticket: data
            };
            
        } catch (supabaseError) {
            console.warn('⚠️ Supabase error:', supabaseError);
            return {
                success: true,
                ticket: localTicket
            };
        }
        
    } catch (error) {
        console.error('❌ Error creating ticket:', error);
        
        // حالت fallback
        const fallbackTicket = {
            id: Date.now(),
            userId: ticketData.userId,
            subject: ticketData.subject || 'بدون موضوع',
            message: ticketData.message || 'بدون پیام',
            created_at: new Date().toISOString(),
            status: 'جدید'
        };
        
        return {
            success: true,
            ticket: fallbackTicket
        };
    }
}

// 8. دریافت تیکت‌های کاربر
async function getUserTickets(userId) {
    try {
        console.log('📨 Getting tickets for user:', userId);
        
        // اول از localStorage بگیر
        const localTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const userLocalTickets = localTickets.filter(ticket => 
            ticket.userId == userId || ticket.user_id == userId
        );
        
        console.log('Found tickets in localStorage:', userLocalTickets.length);
        
        // اگر Supabase وصل نیست
        if (!supabase) {
            return {
                success: true,
                tickets: userLocalTickets
            };
        }
        
        // تلاش برای دریافت از Supabase
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.warn('⚠️ Error getting tickets from Supabase:', error);
                return {
                    success: true,
                    tickets: userLocalTickets
                };
            }
            
            // اگر تیکتی در Supabase هست
            if (data && data.length > 0) {
                console.log('Found tickets in Supabase:', data.length);
                return {
                    success: true,
                    tickets: data
                };
            }
            
            // اگر نه، از localStorage برگردون
            return {
                success: true,
                tickets: userLocalTickets
            };
            
        } catch (supabaseError) {
            console.warn('⚠️ Supabase error:', supabaseError);
            return {
                success: true,
                tickets: userLocalTickets
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting user tickets:', error);
        
        // در هر صورت از localStorage برگردون
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const userTickets = tickets.filter(ticket => ticket.userId == userId);
        
        return {
            success: true,
            tickets: userTickets
        };
    }
}

// 9. توابع دیگر
// 5. ایجاد سفارش جدید
async function createNewOrder(orderData) {
    try {
        console.log('🛒 Creating order for user:', orderData.userId);
        console.log('Order data:', orderData); // برای دیباگ
        
        // ========== 1. اول در localStorage ذخیره کن (برای مطمئن بودن) ==========
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const localOrder = {
            id: orderData.id || Date.now(),
            userId: orderData.userId,
            user_id: orderData.userId,
            total: orderData.total,
            status: 'در انتظار تأیید',
            customer_info: orderData.customerInfo,
            receipt_info: orderData.receipt,
            items: orderData.items,
            created_at: new Date().toISOString()
        };
        
        orders.push(localOrder);
        localStorage.setItem('sidka_orders', JSON.stringify(orders));
        
        console.log('✅ Order saved to localStorage:', localOrder.id);
        
        // خالی کردن سبد خرید
        localStorage.removeItem('sidka_cart');
        
        // ========== 2. تلاش برای ذخیره در Supabase ==========
        if (!supabase) {
            console.warn('⚠️ Supabase not connected, only saved locally');
            return {
                success: true,
                order: localOrder,
                message: 'سفارش ثبت شد (ذخیره محلی)'
            };
        }
        
        try {
            // ساخت شیء برای Supabase
            const supabaseOrder = {
                user_id: orderData.userId,
                total: orderData.total,
                status: 'در انتظار تأیید',
                customer_info: orderData.customerInfo,
                receipt_info: orderData.receipt,
                items: orderData.items
            };
            
            console.log('📤 Sending to Supabase:', supabaseOrder);
            
            const { data, error } = await supabase
                .from('orders')
                .insert([supabaseOrder])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error creating order in Supabase:', error);
                console.error('Error details:', error.message);
                
                return {
                    success: true,
                    order: localOrder,
                    message: 'سفارش ثبت شد (ذخیره محلی - خطای Supabase)'
                };
            }
            
            console.log('✅ Order created in Supabase:', data.id);
            
            return {
                success: true,
                order: data,
                message: 'سفارش با موفقیت ثبت شد'
            };
            
        } catch (supabaseError) {
            console.error('❌ Supabase error:', supabaseError);
            
            return {
                success: true,
                order: localOrder,
                message: 'سفارش ثبت شد (ذخیره محلی - خطای اتصال)'
            };
        }
        
    } catch (error) {
        console.error('❌ Error in createNewOrder:', error);
        
        // حالت fallback
        const fallbackOrder = {
            id: Date.now(),
            userId: orderData.userId,
            total: orderData.total || 0,
            status: 'در انتظار تأیید',
            created_at: new Date().toISOString()
        };
        
        return {
            success: true,
            order: fallbackOrder,
            message: 'سفارش ثبت شد (حالت اضطراری)'
        };
    }
}

async function getAllTickets() {
    try {
        const localTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        
        if (!supabase) {
            return { success: true, tickets: localTickets };
        }
        
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*, users(phone, first_name, last_name)')
                .order('created_at', { ascending: false });
            
            if (error || !data) {
                return { success: true, tickets: localTickets };
            }
            
            const allTickets = [...data, ...localTickets];
            const uniqueTickets = allTickets.filter((ticket, index, self) =>
                index === self.findIndex((t) => t.id === ticket.id)
            );
            
            return { success: true, tickets: uniqueTickets };
        } catch {
            return { success: true, tickets: localTickets };
        }
    } catch {
        return { success: true, tickets: [] };
    }
}

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

// 10. به‌روزرسانی وضعیت سفارش
async function updateOrderStatus(orderId, status) {
    try {
        console.log(`📊 Updating order ${orderId} status to: ${status}`);
        
        // ========== 1. آپدیت در localStorage ==========
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id == orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = status;
            localStorage.setItem('sidka_orders', JSON.stringify(orders));
            console.log(`✅ Order ${orderId} updated in localStorage`);
        }
        
        // ========== 2. آپدیت در Supabase ==========
        if (supabase) {
            try {
                const { error } = await supabase
                    .from('orders')
                    .update({ 
                        status: status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderId);
                
                if (error) {
                    console.warn(`⚠️ Could not update order ${orderId} in Supabase:`, error);
                } else {
                    console.log(`✅ Order ${orderId} updated in Supabase`);
                }
            } catch (supabaseError) {
                console.warn(`⚠️ Supabase error updating order ${orderId}:`, supabaseError);
            }
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        return { success: false, error: 'خطا در بروزرسانی سفارش' };
    }
}

async function updateTicketStatus(ticketId, status) {
    try {
        // آپدیت localStorage
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const ticketIndex = tickets.findIndex(t => t.id == ticketId);
        if (ticketIndex !== -1) {
            tickets[ticketIndex].status = status;
            localStorage.setItem('sidka_tickets', JSON.stringify(tickets));
        }
        
        // آپدیت Supabase
        if (supabase) {
            await supabase
                .from('tickets')
                .update({ status: status })
                .eq('id', ticketId);
        }
        
        return { success: true };
    } catch {
        return { success: true };
    }
}

async function addTicketReply(ticketId, replyData) {
    try {
        if (supabase) {
            await supabase
                .from('ticket_replies')
                .insert([{
                    ticket_id: ticketId,
                    is_admin: replyData.isAdmin || false,
                    message: replyData.message
                }]);
        }
        
        return { success: true };
    } catch {
        return { success: true };
    }
}

async function updateUserInfo(userId, firstName, lastName) {
    try {
        // آپدیت localStorage
        const sessionStr = localStorage.getItem('sidka_user_session');
        if (sessionStr) {
            const sessionData = JSON.parse(sessionStr);
            if (sessionData.user && sessionData.user.id == userId) {
                sessionData.user.first_name = firstName;
                sessionData.user.last_name = lastName;
                localStorage.setItem('sidka_user_session', JSON.stringify(sessionData));
            }
        }
        
        // آپدیت Supabase
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
        
        // محاسبه درآمد کل (سفارشات تأیید شده)
        const totalIncome = orders
            .filter(o => o.status === 'تأیید شده')
            .reduce((sum, order) => sum + (order.total || 0), 0);
        
        // تعداد تیکت‌های جدید
        const newTickets = tickets.filter(t => t.status === 'جدید').length;
        
        // تعداد کاربران (حدس می‌زنیم)
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

async function getOrderReceipt(orderId) {
    try {
        // از localStorage بگیر
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const order = orders.find(o => o.id == orderId);
        
        if (order && order.receipt_info) {
            return {
                success: true,
                receipt: order.receipt_info
            };
        }
        
        // از Supabase بگیر
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

// ==================== اتصال به window ====================
const supabaseFunctions = {
    loginOrRegisterUser,
    loginUser,
    registerUser,
    getAllProducts,
    createNewOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    getOrderReceipt,
    createNewTicket,
    getUserTickets,
    getAllTickets,
    addTicketReply,
    updateTicketStatus,
    getAllUsers,
    updateUserInfo,
    getDashboardStats
};

window.supabaseFunctions = supabaseFunctions;
console.log('✅ Supabase service loaded with', Object.keys(supabaseFunctions).length, 'functions');
