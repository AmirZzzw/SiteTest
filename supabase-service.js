// supabase-service-fixed.js
// Fixed version with better error handling

// تنظیمات مستقیم (به جای import)
const SUPABASE_CONFIG = {
    URL: 'https://oudwditrdwugozxizehm.supabase.co',
    ANON_KEY: 'sb_publishable_K-eXHsnknpw5im47hnI-Tw_kwtT_V5S'
};

// ایجاد کلاینت با error handling بهتر
let supabase;
try {
    // بارگذاری Supabase از CDN اگر موجود نیست
    if (!window.supabase) {
        console.error('Supabase library not loaded!');
        throw new Error('Supabase library missing');
    }
    
    supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        },
        global: {
            headers: {
                'apikey': SUPABASE_CONFIG.ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`
            }
        }
    });
    
    console.log('Supabase client created successfully');
} catch (error) {
    console.error('Failed to create Supabase client:', error);
    supabase = null;
}

// ==================== توابع اصلی ====================

// 1. ورود/عضویت
async function loginOrRegisterUser(phone, firstName = '', lastName = '', password = '') {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        console.log('Attempting login/register for:', phone);
        
        // ابتدا چک کن کاربر وجود داره
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();
        
        let user;
        
        if (existingUser) {
            // کاربر موجود
            user = existingUser;
            console.log('Existing user found:', user.id);
        } else {
            // کاربر جدید
            const newUser = {
                phone: phone,
                first_name: firstName || 'کاربر',
                last_name: lastName || '',
                is_admin: phone === '09021707830',
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('users')
                .insert([newUser])
                .select()
                .single();
            
            if (error) {
                console.error('Error creating user:', error);
                // شاید همزمان کاربر ساخته شده
                const { data: retryData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', phone)
                    .single();
                
                user = retryData;
            } else {
                user = data;
                console.log('New user created:', user.id);
            }
        }
        
        return {
            success: true,
            user: user,
            isNew: !existingUser
        };
        
    } catch (error) {
        console.error('Error in login/register:', error);
        return {
            success: false,
            error: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.'
        };
    }
}

// 2. ثبت‌نام کامل
async function registerUser(phone, firstName, lastName, password) {
    return loginOrRegisterUser(phone, firstName, lastName, password);
}

// 3. دریافت محصولات
async function getAllProducts() {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        console.log('Fetching products...');
        
        // تلاش برای دریافت از Supabase
        const { data, error, count } = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('active', true)
            .order('id');
        
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        console.log(`Found ${data?.length || 0} products`);
        
        return {
            success: true,
            products: data || [],
            count: count || 0
        };
        
    } catch (error) {
        console.error('Error getting products:', error);
        
        // Fallback: محصولات پیش‌فرض
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
            }
        ];
        
        return {
            success: true,
            products: fallbackProducts,
            count: fallbackProducts.length,
            isFallback: true
        };
    }
}

// 4. ایجاد سفارش
async function createNewOrder(orderData) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const order = {
            user_id: orderData.userId,
            total: orderData.total,
            status: 'در انتظار تأیید رسید',
            customer_info: orderData.customerInfo,
            receipt_info: orderData.receipt,
            items: orderData.items,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            order: data,
            message: 'سفارش با موفقیت ثبت شد'
        };
        
    } catch (error) {
        console.error('Error creating order:', error);
        return {
            success: false,
            error: 'خطا در ثبت سفارش. لطفاً با پشتیبانی تماس بگیرید.'
        };
    }
}

// 5. دریافت سفارشات کاربر
async function getUserOrders(userId) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
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
        
    } catch (error) {
        console.error('Error getting user orders:', error);
        return {
            success: true,
            orders: [],
            message: 'خطا در دریافت سفارشات'
        };
    }
}

// 6. دریافت همه سفارشات (ادمین)
async function getAllOrders() {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users (phone, first_name, last_name)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return {
            success: true,
            orders: data || []
        };
        
    } catch (error) {
        console.error('Error getting all orders:', error);
        return {
            success: true,
            orders: []
        };
    }
}

// 7. به‌روزرسانی وضعیت سفارش
async function updateOrderStatus(orderId, status) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('orders')
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            order: data
        };
        
    } catch (error) {
        console.error('Error updating order:', error);
        return {
            success: false,
            error: 'خطا در بروزرسانی سفارش'
        };
    }
}

// 8. ایجاد تیکت
async function createNewTicket(ticketData) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const ticket = {
            user_id: ticketData.userId,
            subject: ticketData.subject,
            message: ticketData.message,
            status: 'جدید',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('tickets')
            .insert([ticket])
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            ticket: data
        };
        
    } catch (error) {
        console.error('Error creating ticket:', error);
        return {
            success: false,
            error: 'خطا در ایجاد تیکت'
        };
    }
}

// 9. دریافت تیکت‌های کاربر
async function getUserTickets(userId) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return {
            success: true,
            tickets: data || []
        };
        
    } catch (error) {
        console.error('Error getting user tickets:', error);
        return {
            success: true,
            tickets: []
        };
    }
}

// 10. دریافت همه تیکت‌ها (ادمین)
async function getAllTickets() {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                users (phone, first_name, last_name)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return {
            success: true,
            tickets: data || []
        };
        
    } catch (error) {
        console.error('Error getting all tickets:', error);
        return {
            success: true,
            tickets: []
        };
    }
}

// 11. پاسخ به تیکت
async function addTicketReply(ticketId, replyData) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const reply = {
            ticket_id: ticketId,
            is_admin: replyData.isAdmin || false,
            message: replyData.message,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('ticket_replies')
            .insert([reply])
            .select()
            .single();
        
        if (error) throw error;
        
        // آپدیت وضعیت تیکت
        await supabase
            .from('tickets')
            .update({ 
                status: 'در حال بررسی',
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        
        return {
            success: true,
            reply: data
        };
        
    } catch (error) {
        console.error('Error adding ticket reply:', error);
        return {
            success: false,
            error: 'خطا در ارسال پاسخ'
        };
    }
}

// 12. آپدیت وضعیت تیکت
async function updateTicketStatus(ticketId, status) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            ticket: data
        };
        
    } catch (error) {
        console.error('Error updating ticket status:', error);
        return {
            success: false,
            error: 'خطا در بروزرسانی تیکت'
        };
    }
}

// 13. آمار داشبورد
async function getDashboardStats() {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        // تعداد کاربران
        const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        // تعداد سفارشات
        const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });
        
        // مجموع درآمد
        const { data: orders } = await supabase
            .from('orders')
            .select('total')
            .eq('status', 'تأیید شده');
        
        const totalIncome = orders ? orders.reduce((sum, order) => sum + (order.total || 0), 0) : 0;
        
        // تعداد تیکت‌های جدید
        const { count: newTicketsCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'جدید');
        
        return {
            success: true,
            stats: {
                users: usersCount || 0,
                orders: ordersCount || 0,
                totalIncome: totalIncome || 0,
                newTickets: newTicketsCount || 0
            }
        };
        
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return {
            success: true,
            stats: {
                users: 0,
                orders: 0,
                totalIncome: 0,
                newTickets: 0
            }
        };
    }
}

// 14. آپدیت اطلاعات کاربر
async function updateUserInfo(userId, firstName, lastName) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
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
        
        if (error) throw error;
        
        return {
            success: true,
            user: data
        };
        
    } catch (error) {
        console.error('Error updating user info:', error);
        return {
            success: false,
            error: 'خطا در بروزرسانی اطلاعات'
        };
    }
}

// 15. دریافت رسید
async function getOrderReceipt(orderId) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('receipt_url, receipt_filename, receipt_info')
            .eq('id', orderId)
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            receipt: data
        };
        
    } catch (error) {
        console.error('Error getting receipt:', error);
        return {
            success: false,
            error: 'رسید یافت نشد'
        };
    }
}

// ==================== اتصال به window ====================

// ایجاد آبجکت توابع
const supabaseFunctions = {
    loginOrRegisterUser,
    registerUser,
    getAllProducts,
    createNewOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    createNewTicket,
    getUserTickets,
    getAllTickets,
    addTicketReply,
    updateTicketStatus,
    getDashboardStats,
    updateUserInfo,
    getOrderReceipt,
    
    // تابع تست اتصال
    testConnection: async function() {
        try {
            if (!supabase) {
                return { success: false, error: 'Supabase client not initialized' };
            }
            
            const { data, error } = await supabase
                .from('users')
                .select('count', { count: 'exact', head: true });
            
            if (error) throw error;
            
            return {
                success: true,
                connected: true,
                message: 'Connected to Supabase successfully'
            };
            
        } catch (error) {
            console.error('Connection test failed:', error);
            return {
                success: false,
                connected: false,
                error: error.message
            };
        }
    }
};

// اضافه کردن به window
window.supabaseFunctions = supabaseFunctions;

console.log('✅ Supabase service loaded with', Object.keys(supabaseFunctions).length, 'functions');
