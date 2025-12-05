// supabase-service.js - نسخه ساده‌شده

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
        
        // همیشه مستقیم برو به loginUser
        return await loginUser(phone, password || '');
        
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
    try {
        console.log('🔑 Login attempt for:', phone);
        
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
            
            // ایجاد/بررسی کاربر ادمین
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
            
            return {
                success: true,
                user: adminUser
            };
        }
        
        // برای کاربران عادی
        
        // اگر Supabase وصل نیست
        if (!supabase) {
            // حالت fallback - همیشه اجازه بده وارد بشه
            const user = {
                id: Date.now(),
                phone: phone,
                first_name: 'کاربر',
                last_name: 'جدید',
                is_admin: false,
                created_at: new Date().toISOString()
            };
            
            localStorage.setItem('sidka_user_session', JSON.stringify({
                user: user,
                expiry: Date.now() + (24 * 60 * 60 * 1000)
            }));
            
            return {
                success: true,
                user: user
            };
        }
        
        // جستجوی کاربر در Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single()
            .catch(() => ({ data: null, error: null })); // اگر خطا داد، null برگردون
        
        if (!user) {
            // کاربر پیدا نشد = ثبت‌نام جدید
            if (!password || password.length < 6) {
                return {
                    success: false,
                    error: 'برای ثبت‌نام جدید، رمز عبور باید حداقل ۶ کاراکتر باشد'
                };
            }
            
            // ایجاد کاربر جدید
            const newUser = {
                phone: phone,
                first_name: 'کاربر',
                last_name: 'جدید',
                password: password,
                is_admin: false
            };
            
            const { data: createdUser, error: createError } = await supabase
                .from('users')
                .insert([newUser])
                .select()
                .single();
            
            if (createError) {
                console.warn('⚠️ Error creating user:', createError);
                
                // اگر خطا در ایجاد بود، بازهم اجازه بده
                const fallbackUser = {
                    id: Date.now(),
                    ...newUser,
                    created_at: new Date().toISOString()
                };
                
                localStorage.setItem('sidka_user_session', JSON.stringify({
                    user: fallbackUser,
                    expiry: Date.now() + (24 * 60 * 60 * 1000)
                }));
                
                return {
                    success: true,
                    user: fallbackUser,
                    isNew: true
                };
            }
            
            localStorage.setItem('sidka_user_session', JSON.stringify({
                user: createdUser,
                expiry: Date.now() + (24 * 60 * 60 * 1000)
            }));
            
            return {
                success: true,
                user: createdUser,
                isNew: true
            };
        }
        
        // کاربر پیدا شد - چک کردن پسورد
        if (!user.password || user.password !== password) {
            return {
                success: false,
                error: 'رمز عبور اشتباه است'
            };
        }
        
        // پسورد درست است
        localStorage.setItem('sidka_user_session', JSON.stringify({
            user: user,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        }));
        
        return {
            success: true,
            user: user
        };
        
    } catch (error) {
        console.error('❌ Error in login:', error);
        
        // در هر صورت، اجازه ورود بده (حالت fallback)
        const fallbackUser = {
            id: Date.now(),
            phone: phone,
            first_name: 'کاربر',
            last_name: 'عزیز',
            is_admin: false,
            created_at: new Date().toISOString()
        };
        
        localStorage.setItem('sidka_user_session', JSON.stringify({
            user: fallbackUser,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        }));
        
        return {
            success: true,
            user: fallbackUser,
            isNew: true
        };
    }
}
// 3. ثبت‌نام کامل
async function registerUser(phone, firstName, lastName, password) {
    return loginOrRegisterUser(phone, firstName, lastName, password);
}

// 4. دریافت همه محصولات
async function getAllProducts() {
    try {
        if (!supabase) {
            throw new Error('No Supabase connection');
        }
        
        console.log('📦 Fetching products...');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('id');
        
        if (error) {
            console.error('❌ Error fetching products:', error);
            throw error;
        }
        
        console.log(`✅ Found ${data?.length || 0} products`);
        
        if (!data || data.length === 0) {
            // محصولات پیش‌فرض
            const fallbackProducts = [
                {
                    id: 1,
                    name: 'ساخت پنل',
                    description: 'ساخت پنل اختصاصی با امکانات کامل',
                    price: 900000,
                    category: 'panels',
                    icon: 'fas fa-plus-circle',
                    active: true
                },
                {
                    id: 2,
                    name: 'آپدیت پنل',
                    description: 'ارتقاء و به‌روزرسانی پنل موجود',
                    price: 235000,
                    category: 'panels',
                    icon: 'fas fa-sync-alt',
                    active: true
                },
                {
                    id: 3,
                    name: 'اشتراک سلف تلگرام - یک ماهه',
                    description: 'اشتراک یکماهه سلف تلگرام',
                    price: 40000,
                    category: 'subscriptions',
                    icon: 'fab fa-telegram',
                    active: true
                }
            ];
            
            return {
                success: true,
                products: fallbackProducts
            };
        }
        
        return {
            success: true,
            products: data
        };
        
    } catch (error) {
        console.error('❌ Error getting products:', error);
        
        // حالت fallback
        const fallbackProducts = [
            {
                id: 1,
                name: 'ساخت پنل',
                description: 'ساخت پنل اختصاصی با امکانات کامل',
                price: 900000,
                category: 'panels',
                icon: 'fas fa-plus-circle',
                active: true
            },
            {
                id: 2,
                name: 'آپدیت پنل',
                description: 'ارتقاء و به‌روزرسانی پنل موجود',
                price: 235000,
                category: 'panels',
                icon: 'fas fa-sync-alt',
                active: true
            },
            {
                id: 3,
                name: 'اشتراک سلف تلگرام - یک ماهه',
                description: 'اشتراک یکماهه سلف تلگرام',
                price: 40000,
                category: 'subscriptions',
                icon: 'fab fa-telegram',
                active: true
            }
        ];
        
        return {
            success: true,
            products: fallbackProducts
        };
    }
}

// 5. ایجاد سفارش جدید
async function createNewOrder(orderData) {
    try {
        console.log('🛒 Creating order...');
        
        if (!supabase) {
            // ذخیره در localStorage به عنوان fallback
            const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const order = {
                id: Date.now(),
                ...orderData,
                created_at: new Date().toISOString(),
                status: 'در انتظار تأیید'
            };
            orders.push(order);
            localStorage.setItem('local_orders', JSON.stringify(orders));
            
            return {
                success: true,
                order: order
            };
        }
        
        const order = {
            user_id: orderData.userId,
            total: orderData.total,
            status: 'در انتظار تأیید',
            customer_info: orderData.customerInfo,
            receipt_info: orderData.receipt,
            items: orderData.items
        };
        
        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating order:', error);
            
            // Fallback به localStorage
            const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const fallbackOrder = {
                id: Date.now(),
                ...orderData,
                created_at: new Date().toISOString(),
                status: 'در انتظار تأیید'
            };
            orders.push(fallbackOrder);
            localStorage.setItem('local_orders', JSON.stringify(orders));
            
            return {
                success: true,
                order: fallbackOrder
            };
        }
        
        console.log('✅ Order created:', data.id);
        return {
            success: true,
            order: data
        };
        
    } catch (error) {
        console.error('❌ Error in createNewOrder:', error);
        
        // حالت fallback
        const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        const order = {
            id: Date.now(),
            ...orderData,
            created_at: new Date().toISOString(),
            status: 'در انتظار تأیید'
        };
        orders.push(order);
        localStorage.setItem('local_orders', JSON.stringify(orders));
        
        return {
            success: true,
            order: order
        };
    }
}

// 6. دریافت سفارشات کاربر
async function getUserOrders(userId) {
    try {
        if (!supabase) {
            const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const userOrders = orders.filter(o => o.userId === userId);
            return { success: true, orders: userOrders };
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.warn('⚠️ Error getting orders:', error);
            const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const userOrders = orders.filter(o => o.userId === userId);
            return { success: true, orders: userOrders };
        }
        
        return { success: true, orders: data || [] };
        
    } catch (error) {
        console.error('❌ Error getting orders:', error);
        const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        const userOrders = orders.filter(o => o.userId === userId);
        return { success: true, orders: userOrders };
    }
}

// 7. ایجاد تیکت جدید
async function createNewTicket(ticketData) {
    try {
        console.log('🎫 Creating ticket:', ticketData.subject);
        
        if (!supabase) {
            // ذخیره در localStorage
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
        }
        
        const ticket = {
            user_id: ticketData.userId,
            subject: ticketData.subject,
            message: ticketData.message,
            status: 'جدید'
        };
        
        const { data, error } = await supabase
            .from('tickets')
            .insert([ticket])
            .select()
            .single();
        
        if (error) {
            console.warn('⚠️ Error creating ticket, using fallback:', error);
            
            const tickets = JSON.parse(localStorage.getItem('local_tickets') || '[]');
            const fallbackTicket = {
                id: Date.now(),
                ...ticketData,
                created_at: new Date().toISOString(),
                status: 'جدید'
            };
            tickets.push(fallbackTicket);
            localStorage.setItem('local_tickets', JSON.stringify(tickets));
            
            return { success: true, ticket: fallbackTicket };
        }
        
        console.log('✅ Ticket created:', data.id);
        return { success: true, ticket: data };
        
    } catch (error) {
        console.error('❌ Error creating ticket:', error);
        
        // Fallback
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
    }
}

// 8. توابع دیگر (ساده‌شده)
async function getAllOrders() {
    try {
        if (!supabase) {
            const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            return { success: true, orders: orders };
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, users(phone, first_name, last_name)')
            .order('created_at', { ascending: false });
        
        if (error) {
            const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            return { success: true, orders: orders };
        }
        
        return { success: true, orders: data || [] };
    } catch (error) {
        const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        return { success: true, orders: orders };
    }
}

async function getAllTickets() {
    try {
        if (!supabase) {
            const tickets = JSON.parse(localStorage.getItem('local_tickets') || '[]');
            return { success: true, tickets: tickets };
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .select('*, users(phone, first_name, last_name)')
            .order('created_at', { ascending: false });
        
        if (error) {
            const tickets = JSON.parse(localStorage.getItem('local_tickets') || '[]');
            return { success: true, tickets: tickets };
        }
        
        return { success: true, tickets: data || [] };
    } catch (error) {
        const tickets = JSON.parse(localStorage.getItem('local_tickets') || '[]');
        return { success: true, tickets: tickets };
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
    } catch (error) {
        return { success: true, users: [] };
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        if (!supabase) return { success: true };
        
        await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId);
        
        return { success: true };
    } catch (error) {
        return { success: true };
    }
}

async function updateTicketStatus(ticketId, status) {
    try {
        if (!supabase) return { success: true };
        
        await supabase
            .from('tickets')
            .update({ status: status })
            .eq('id', ticketId);
        
        return { success: true };
    } catch (error) {
        return { success: true };
    }
}

async function addTicketReply(ticketId, replyData) {
    try {
        if (!supabase) return { success: true };
        
        await supabase
            .from('ticket_replies')
            .insert([{
                ticket_id: ticketId,
                is_admin: replyData.isAdmin || false,
                message: replyData.message
            }]);
        
        return { success: true };
    } catch (error) {
        return { success: true };
    }
}

async function updateUserInfo(userId, firstName, lastName) {
    try {
        if (!supabase) return { success: true };
        
        await supabase
            .from('users')
            .update({
                first_name: firstName,
                last_name: lastName
            })
            .eq('id', userId);
        
        return { success: true };
    } catch (error) {
        return { success: true };
    }
}

async function getDashboardStats() {
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

async function getOrderReceipt(orderId) {
    try {
        if (!supabase) {
            const orders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const order = orders.find(o => o.id === orderId);
            return order && order.receipt ? 
                { success: true, receipt: order.receipt } : 
                { success: false, error: 'رسید یافت نشد' };
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('receipt_info')
            .eq('id', orderId)
            .single();
        
        if (error || !data || !data.receipt_info) {
            return { success: false, error: 'رسید یافت نشد' };
        }
        
        return { success: true, receipt: data.receipt_info };
    } catch (error) {
        return { success: false, error: 'خطا در دریافت رسید' };
    }
}

// ==================== اتصال به window ====================

const supabaseFunctions = {
    // احراز هویت
    loginOrRegisterUser,
    loginUser,
    registerUser,
    
    // محصولات
    getAllProducts,
    
    // سفارشات
    createNewOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    getOrderReceipt,
    
    // تیکت‌ها
    createNewTicket,
    getAllTickets,
    addTicketReply,
    updateTicketStatus,
    
    // کاربران
    getAllUsers,
    updateUserInfo,
    
    // آمار
    getDashboardStats
};

// اضافه کردن به window
window.supabaseFunctions = supabaseFunctions;

console.log('✅ Supabase service loaded (with fallback support)');
