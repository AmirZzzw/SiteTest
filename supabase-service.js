// supabase-service.js - نسخه کامل برای Supabase

// تنظیمات Supabase
const SUPABASE_CONFIG = {
    URL: 'https://oudwditrdwugozxizehm.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZHdkaXRyZHd1Z296eGl6ZWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODQzMTcsImV4cCI6MjA4MDQ2MDMxN30.BQxoJD-WnRQQvIaQQSTzKzXLxf2LdGuPkqBCKvDruGE'
};

// ایجاد کلاینت Supabase
let supabase;

try {
    supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true
        }
    });
    console.log('✅ Supabase client created successfully');
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    supabase = null;
}

// ========== توابع اصلی ==========

// 1. ورود/عضویت کاربر
async function loginOrRegisterUser(phone, firstName = '', lastName = '', password = '') {
    try {
        console.log('🔑 Attempting login/register for:', phone);
        
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        // بررسی وجود کاربر
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();
        
        let user;
        
        if (existingUser) {
            // کاربر موجود
            user = existingUser;
            console.log('✅ Existing user found:', user.id);
            
            // اگر رمز وارد شده، چک کن
            if (password && user.password !== password) {
                return {
                    success: false,
                    error: 'رمز عبور اشتباه است'
                };
            }
        } else {
            // ایجاد کاربر جدید
            const newUser = {
                phone: phone,
                first_name: firstName || 'کاربر',
                last_name: lastName || '',
                password: password || null,
                is_admin: phone === '09021707830'
            };
            
            const { data, error } = await supabase
                .from('users')
                .insert([newUser])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error creating user:', error);
                
                // شاید کاربر همزمان ساخته شده
                const { data: retryData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', phone)
                    .single();
                
                user = retryData || newUser;
            } else {
                user = data;
                console.log('✅ New user created:', user.id);
            }
        }
        
        return {
            success: true,
            user: user,
            isNew: !existingUser
        };
        
    } catch (error) {
        console.error('❌ Error in login/register:', error);
        return {
            success: false,
            error: 'خطا در ارتباط با سرور'
        };
    }
}

// 2. ورود با رمز
async function loginUser(phone, password) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();
        
        if (error) throw error;
        
        if (!user) {
            return {
                success: false,
                error: 'کاربری با این شماره یافت نشد'
            };
        }
        
        // چک کردن رمز
        if (user.password && user.password !== password) {
            return {
                success: false,
                error: 'رمز عبور اشتباه است'
            };
        }
        
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

// 3. ثبت‌نام کامل کاربر
async function registerUser(phone, firstName, lastName, password) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        // بررسی تکراری نبودن شماره
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
        
        if (existingUser) {
            return {
                success: false,
                error: 'این شماره موبایل قبلاً ثبت شده است'
            };
        }
        
        const newUser = {
            phone: phone,
            first_name: firstName,
            last_name: lastName,
            password: password,
            is_admin: phone === '09021707830'
        };
        
        const { data, error } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            user: data
        };
        
    } catch (error) {
        console.error('❌ Error in register:', error);
        return {
            success: false,
            error: 'خطا در ثبت‌نام'
        };
    }
}

// 4. دریافت همه محصولات
async function getAllProducts() {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        console.log('📦 Fetching all products...');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('id', { ascending: true });
        
        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        
        console.log(`✅ Found ${data?.length || 0} products`);
        
        return {
            success: true,
            products: data || []
        };
        
    } catch (error) {
        console.error('❌ Error getting products:', error);
        return {
            success: false,
            error: 'خطا در دریافت محصولات'
        };
    }
}

// 5. ایجاد سفارش جدید
async function createNewOrder(orderData) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        console.log('🛒 Creating order for user:', orderData.userId);
        
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
            .select(`
                *,
                users (phone, first_name, last_name)
            `)
            .single();
        
        if (error) throw error;
        
        console.log('✅ Order created:', data.id);
        
        return {
            success: true,
            order: data,
            message: 'سفارش با موفقیت ثبت شد'
        };
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
        return {
            success: false,
            error: 'خطا در ثبت سفارش: ' + error.message
        };
    }
}

// 6. دریافت سفارشات کاربر
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
        console.error('❌ Error getting user orders:', error);
        return {
            success: false,
            error: 'خطا در دریافت سفارشات'
        };
    }
}

// 7. دریافت همه سفارشات (ادمین)
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
        console.error('❌ Error getting all orders:', error);
        return {
            success: false,
            error: 'خطا در دریافت سفارشات'
        };
    }
}

// 8. به‌روزرسانی وضعیت سفارش
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
        console.error('❌ Error updating order:', error);
        return {
            success: false,
            error: 'خطا در بروزرسانی سفارش'
        };
    }
}

// 9. دریافت رسید سفارش
async function getOrderReceipt(orderId) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('receipt_info')
            .eq('id', orderId)
            .single();
        
        if (error) throw error;
        
        if (!data || !data.receipt_info) {
            return {
                success: false,
                error: 'رسید یافت نشد'
            };
        }
        
        return {
            success: true,
            receipt: data.receipt_info
        };
        
    } catch (error) {
        console.error('❌ Error getting receipt:', error);
        return {
            success: false,
            error: 'خطا در دریافت رسید'
        };
    }
}

// 10. ایجاد تیکت جدید
async function createNewTicket(ticketData) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        console.log('🎫 Creating ticket:', ticketData.subject);
        
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
        
        if (error) throw error;
        
        console.log('✅ Ticket created:', data.id);
        
        return {
            success: true,
            ticket: data
        };
        
    } catch (error) {
        console.error('❌ Error creating ticket:', error);
        return {
            success: false,
            error: 'خطا در ایجاد تیکت: ' + error.message
        };
    }
}

// 11. دریافت تیکت‌های کاربر
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
        console.error('❌ Error getting user tickets:', error);
        return {
            success: false,
            error: 'خطا در دریافت تیکت‌ها'
        };
    }
}

// 12. دریافت همه تیکت‌ها (ادمین)
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
        console.error('❌ Error getting all tickets:', error);
        return {
            success: false,
            error: 'خطا در دریافت تیکت‌ها'
        };
    }
}

// 13. پاسخ به تیکت
async function addTicketReply(ticketId, replyData) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const reply = {
            ticket_id: ticketId,
            is_admin: replyData.isAdmin || false,
            message: replyData.message
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
                status: 'در حال بررسی'
            })
            .eq('id', ticketId);
        
        return {
            success: true,
            reply: data
        };
        
    } catch (error) {
        console.error('❌ Error adding ticket reply:', error);
        return {
            success: false,
            error: 'خطا در ارسال پاسخ'
        };
    }
}

// 14. آپدیت وضعیت تیکت
async function updateTicketStatus(ticketId, status) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .update({ 
                status: status
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
        console.error('❌ Error updating ticket status:', error);
        return {
            success: false,
            error: 'خطا در بروزرسانی تیکت'
        };
    }
}

// 15. دریافت همه کاربران (ادمین)
async function getAllUsers() {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return {
            success: true,
            users: data || []
        };
        
    } catch (error) {
        console.error('❌ Error getting all users:', error);
        return {
            success: false,
            error: 'خطا در دریافت کاربران'
        };
    }
}

// 16. آپدیت اطلاعات کاربر
async function updateUserInfo(userId, firstName, lastName) {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        const { data, error } = await supabase
            .from('users')
            .update({
                first_name: firstName,
                last_name: lastName
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
        console.error('❌ Error updating user info:', error);
        return {
            success: false,
            error: 'خطا در بروزرسانی اطلاعات'
        };
    }
}

// 17. آمار داشبورد
async function getDashboardStats() {
    try {
        if (!supabase) {
            throw new Error('اتصال به سرور برقرار نیست');
        }
        
        // تعداد کاربران
        const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        
        // تعداد سفارشات
        const { count: ordersCount, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });
        
        if (ordersError) throw ordersError;
        
        // مجموع درآمد (سفارشات تأیید شده)
        const { data: orders, error: incomeError } = await supabase
            .from('orders')
            .select('total')
            .eq('status', 'تأیید شده');
        
        if (incomeError) throw incomeError;
        
        const totalIncome = orders ? orders.reduce((sum, order) => sum + (order.total || 0), 0) : 0;
        
        // تعداد تیکت‌های جدید
        const { count: newTicketsCount, error: ticketsError } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'جدید');
        
        if (ticketsError) throw ticketsError;
        
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
        console.error('❌ Error getting dashboard stats:', error);
        return {
            success: false,
            error: 'خطا در دریافت آمار'
        };
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
    getUserTickets,
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

console.log('✅ Supabase service loaded with', Object.keys(supabaseFunctions).length, 'functions');

// تست اتصال
async function testConnection() {
    try {
        const result = await getAllProducts();
        console.log('Connection test:', result.success ? '✅ Connected' : '❌ Failed');
    } catch (error) {
        console.error('❌ Connection test failed:', error);
    }
}

// اجرای تست
testConnection();
