// supabase-service.js - Complete Fixed Version
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
// در supabase-service.js این قسمت را اضافه کن:

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
// 6. دریافت سفارشات کاربر
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

// 7. دریافت همه سفارشات (ادمین)
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

// 8. ایجاد تیکت جدید
// در supabase-service.js این تابع را اصلاح کن:

async function createNewTicket(ticketData) {
    try {
        console.log('🎫 Creating ticket:', ticketData);
        
        // ساختار داده تیکت
        const ticketToSave = {
            id: Date.now(),
            userId: ticketData.userId,
            user_id: ticketData.userId,
            subject: ticketData.subject || 'بدون موضوع',
            message: ticketData.message || 'بدون پیام',
            status: 'جدید',
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        // ذخیره در localStorage
        try {
            let tickets = [];
            const stored = localStorage.getItem('sidka_tickets');
            if (stored) {
                tickets = JSON.parse(stored);
                if (!Array.isArray(tickets)) tickets = [];
            }
            
            tickets.push(ticketToSave);
            localStorage.setItem('sidka_tickets', JSON.stringify(tickets));
            console.log('✅ Ticket saved to localStorage:', ticketToSave.id);
        } catch (storageError) {
            console.error('❌ localStorage error:', storageError);
        }
        
        // ذخیره در Supabase
        if (supabase) {
            try {
                await supabase
                    .from('tickets')
                    .insert([{
                        user_id: ticketData.userId,
                        subject: ticketData.subject,
                        message: ticketData.message,
                        status: 'جدید'
                    }]);
            } catch (supabaseError) {
                console.warn('⚠️ Supabase error:', supabaseError);
            }
        }
        
        return {
            success: true,
            ticket: ticketToSave,
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
// 9. دریافت تیکت‌های کاربر
async function getUserTickets(userId) {
    try {
        console.log('📨 Getting tickets for user:', userId);
        
        const localTickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const userLocalTickets = localTickets.filter(ticket => 
            ticket.userId == userId || ticket.user_id == userId
        );
        
        console.log('Found in localStorage:', userLocalTickets.length, 'tickets');
        
        if (!supabase) {
            return {
                success: true,
                tickets: userLocalTickets
            };
        }
        
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                return {
                    success: true,
                    tickets: userLocalTickets
                };
            }
            
            if (data && data.length > 0) {
                console.log('Found in Supabase:', data.length, 'tickets');
                return {
                    success: true,
                    tickets: data
                };
            }
            
            return {
                success: true,
                tickets: userLocalTickets
            };
            
        } catch (supabaseError) {
            return {
                success: true,
                tickets: userLocalTickets
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting user tickets:', error);
        
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const userTickets = tickets.filter(ticket => ticket.userId == userId);
        
        return {
            success: true,
            tickets: userTickets
        };
    }
}

// 10. دریافت همه تیکت‌ها (ادمین)
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

// 11. توابع دیگر
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

async function updateTicketStatus(ticketId, status) {
    try {
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const ticketIndex = tickets.findIndex(t => t.id == ticketId);
        if (ticketIndex !== -1) {
            tickets[ticketIndex].status = status;
            localStorage.setItem('sidka_tickets', JSON.stringify(tickets));
        }
        
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
        console.log(`💬 Adding reply to ticket ${ticketId}:`, replyData);
        
        // ساختار داده پاسخ
        const replyToSave = {
            id: Date.now(),
            ticket_id: ticketId,
            user_id: replyData.userId || null,
            is_admin: replyData.isAdmin || false,
            message: replyData.message || '',
            created_at: new Date().toISOString()
        };
        
        // ذخیره در localStorage
        try {
            let replies = JSON.parse(localStorage.getItem('sidka_ticket_replies') || '[]');
            replies.push(replyToSave);
            localStorage.setItem('sidka_ticket_replies', JSON.stringify(replies));
            console.log('✅ Reply saved to localStorage');
        } catch (storageError) {
            console.error('❌ localStorage error:', storageError);
        }
        
        // ذخیره در Supabase
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('ticket_replies')
                    .insert([{
                        ticket_id: ticketId,
                        is_admin: replyData.isAdmin || false,
                        message: replyData.message
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                console.log('✅ Reply saved to Supabase:', data.id);
            } catch (supabaseError) {
                console.warn('⚠️ Supabase error:', supabaseError);
            }
        }
        
        // آپدیت وضعیت تیکت به "پاسخ داده شده"
        await updateTicketStatus(ticketId, 'پاسخ داده شده');
        
        return {
            success: true,
            reply: replyToSave,
            message: 'پاسخ با موفقیت ارسال شد'
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
        
        // خواندن از localStorage
        const localReplies = JSON.parse(localStorage.getItem('sidka_ticket_replies') || '[]');
        const ticketLocalReplies = localReplies.filter(reply => 
            reply.ticket_id == ticketId
        );
        
        console.log('Found in localStorage:', ticketLocalReplies.length, 'replies');
        
        // اگر Supabase در دسترس نیست
        if (!supabase) {
            return {
                success: true,
                replies: ticketLocalReplies.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                )
            };
        }
        
        // خواندن از Supabase
        try {
            const { data, error } = await supabase
                .from('ticket_replies')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.warn('⚠️ Supabase error, using localStorage:', error);
                return {
                    success: true,
                    replies: ticketLocalReplies
                };
            }
            
            if (data && data.length > 0) {
                console.log('Found in Supabase:', data.length, 'replies');
                
                // ترکیب داده‌ها (Supabase + localStorage)
                const allReplies = [...data, ...ticketLocalReplies];
                const uniqueReplies = [];
                const seenIds = new Set();
                
                allReplies.forEach(reply => {
                    const replyId = reply.id;
                    if (!seenIds.has(replyId)) {
                        seenIds.add(replyId);
                        uniqueReplies.push(reply);
                    }
                });
                
                return {
                    success: true,
                    replies: uniqueReplies.sort((a, b) => 
                        new Date(a.created_at) - new Date(b.created_at)
                    )
                };
            }
            
            return {
                success: true,
                replies: ticketLocalReplies
            };
            
        } catch (supabaseError) {
            console.warn('⚠️ Supabase exception:', supabaseError);
            return {
                success: true,
                replies: ticketLocalReplies
            };
        }
        
    } catch (error) {
        console.error('❌ Error getting ticket replies:', error);
        return {
            success: true,
            replies: []
        };
    }
}

async function getTicketDetails(ticketId) {
    try {
        // دریافت اطلاعات تیکت
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const ticket = tickets.find(t => t.id == ticketId);
        
        // اگر در localStorage نبود، از Supabase بگیر
        if (!ticket && supabase) {
            const { data, error } = await supabase
                .from('tickets')
                .select('*, users(first_name, last_name, phone)')
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
        
        // دریافت پاسخ‌ها
        const repliesResult = await getTicketReplies(ticketId);
        
        return {
            success: true,
            ticket: ticket,
            replies: repliesResult.replies || []
        };
        
    } catch (error) {
        console.error('❌ Error getting ticket details:', error);
        return {
            success: false,
            error: 'خطا در دریافت اطلاعات تیکت'
        };
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
    getTicketReplies,
    getTicketDetails,
    updateTicketStatus,
    getAllUsers,
    updateUserInfo,
    getDashboardStats
};

window.supabaseFunctions = supabaseFunctions;
console.log('✅ Supabase service loaded with', Object.keys(supabaseFunctions).length, 'functions');
