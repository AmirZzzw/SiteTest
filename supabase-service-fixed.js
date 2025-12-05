// supabase-service-fixed.js - کاملاً رفع شده
console.log('🔧 Loading FIXED Supabase service...');

// تنظیمات Supabase
const SUPABASE_CONFIG_FIXED = {
    URL: 'https://oudwditrdwugozxizehm.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZHdkaXRyZHd1Z296eGl6ZWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODQzMTcsImV4cCI6MjA4MDQ2MDMxN30.BQxoJD-WnRQQvIaQQSTzKzXLxf2LdGuPkqBCKvDruGE'
};

// کلاینت Supabase
let supabaseFixed;

try {
    if (window.supabase) {
        supabaseFixed = window.supabase.createClient(
            SUPABASE_CONFIG_FIXED.URL, 
            SUPABASE_CONFIG_FIXED.ANON_KEY
        );
        console.log('✅ Fixed Supabase client created');
    } else {
        console.warn('⚠️ Supabase library not found, using localStorage only');
        supabaseFixed = null;
    }
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    supabaseFixed = null;
}

// ========== مدیریت داده‌های محلی ==========

// ذخیره سفارش در localStorage
function saveOrderToLocal(order) {
    try {
        let orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        
        // حذف سفارش تکراری
        orders = orders.filter(o => o.id !== order.id);
        
        // اضافه کردن سفارش جدید
        orders.push(order);
        
        localStorage.setItem('sidka_orders', JSON.stringify(orders));
        console.log(`✅ Order #${order.id} saved to localStorage`);
        return true;
    } catch (error) {
        console.error('❌ Error saving order to localStorage:', error);
        return false;
    }
}

// ذخیره تیکت در localStorage
function saveTicketToLocal(ticket) {
    try {
        let tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        
        tickets = tickets.filter(t => t.id !== ticket.id);
        tickets.push(ticket);
        
        localStorage.setItem('sidka_tickets', JSON.stringify(tickets));
        console.log(`✅ Ticket #${ticket.id} saved to localStorage`);
        return true;
    } catch (error) {
        console.error('❌ Error saving ticket to localStorage:', error);
        return false;
    }
}

// ========== توابع اصلی (رفع شده) ==========

async function getAllOrdersFixed() {
    try {
        console.log('📋 Getting all orders (FIXED)...');
        
        // 1. از localStorage بگیر
        let localOrders = [];
        try {
            const stored = localStorage.getItem('sidka_orders');
            if (stored) {
                localOrders = JSON.parse(stored);
                if (!Array.isArray(localOrders)) localOrders = [];
            }
        } catch (e) {
            console.warn('⚠️ Error reading localStorage:', e);
        }
        
        console.log(`📊 Found ${localOrders.length} orders in localStorage`);
        
        // 2. از Supabase بگیر (اگر موجود است)
        let supabaseOrders = [];
        if (supabaseFixed) {
            try {
                const { data, error } = await supabaseFixed
                    .from('orders')
                    .select('*, users(first_name, last_name, phone)')
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    supabaseOrders = data;
                    console.log(`📊 Found ${supabaseOrders.length} orders in Supabase`);
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase error:', supabaseError);
            }
        }
        
        // 3. ادغام و حذف تکراری‌ها
        const allOrders = [...supabaseOrders, ...localOrders];
        const uniqueOrders = [];
        const seenIds = new Set();
        
        allOrders.forEach(order => {
            const orderId = order.id;
            if (!seenIds.has(orderId)) {
                seenIds.add(orderId);
                
                // اطمینان از ساختار داده
                const cleanedOrder = {
                    id: orderId,
                    user_id: order.user_id || order.userId,
                    total: order.total || 0,
                    status: order.status || 'در انتظار تأیید',
                    customer_info: order.customer_info || {},
                    receipt_info: order.receipt_info || {},
                    items: order.items || [],
                    created_at: order.created_at || order.createdAt || new Date().toISOString(),
                    users: order.users || {}
                };
                
                uniqueOrders.push(cleanedOrder);
            }
        });
        
        // مرتب‌سازی بر اساس تاریخ
        uniqueOrders.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
        
        console.log(`📊 Total unique orders: ${uniqueOrders.length}`);
        
        return {
            success: true,
            orders: uniqueOrders,
            count: uniqueOrders.length
        };
        
    } catch (error) {
        console.error('❌ Error in getAllOrdersFixed:', error);
        return {
            success: false,
            error: error.message,
            orders: []
        };
    }
}

async function getAllTicketsFixed() {
    try {
        console.log('📨 Getting all tickets (FIXED)...');
        
        // 1. از localStorage بگیر
        let localTickets = [];
        try {
            const stored = localStorage.getItem('sidka_tickets');
            if (stored) {
                localTickets = JSON.parse(stored);
                if (!Array.isArray(localTickets)) localTickets = [];
            }
        } catch (e) {
            console.warn('⚠️ Error reading localStorage:', e);
        }
        
        console.log(`📨 Found ${localTickets.length} tickets in localStorage`);
        
        // 2. از Supabase بگیر
        let supabaseTickets = [];
        if (supabaseFixed) {
            try {
                const { data, error } = await supabaseFixed
                    .from('tickets')
                    .select('*, users(first_name, last_name, phone)')
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    supabaseTickets = data;
                    console.log(`📨 Found ${supabaseTickets.length} tickets in Supabase`);
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase error:', supabaseError);
            }
        }
        
        // 3. ادغام
        const allTickets = [...supabaseTickets, ...localTickets];
        const uniqueTickets = [];
        const seenIds = new Set();
        
        allTickets.forEach(ticket => {
            const ticketId = ticket.id;
            if (!seenIds.has(ticketId)) {
                seenIds.add(ticketId);
                
                const cleanedTicket = {
                    id: ticketId,
                    user_id: ticket.user_id || ticket.userId,
                    subject: ticket.subject || 'بدون موضوع',
                    message: ticket.message || 'بدون پیام',
                    status: ticket.status || 'جدید',
                    created_at: ticket.created_at || ticket.createdAt || new Date().toISOString(),
                    users: ticket.users || {}
                };
                
                uniqueTickets.push(cleanedTicket);
            }
        });
        
        // مرتب‌سازی
        uniqueTickets.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
        
        console.log(`📨 Total unique tickets: ${uniqueTickets.length}`);
        
        return {
            success: true,
            tickets: uniqueTickets,
            count: uniqueTickets.length
        };
        
    } catch (error) {
        console.error('❌ Error in getAllTicketsFixed:', error);
        return {
            success: false,
            error: error.message,
            tickets: []
        };
    }
}

async function updateOrderStatusFixed(orderId, status) {
    try {
        console.log(`📊 Updating order ${orderId} to ${status}`);
        
        // 1. به‌روزرسانی در localStorage
        let orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        let updated = false;
        
        orders = orders.map(order => {
            if (order.id == orderId || order.user_id == orderId) {
                order.status = status;
                order.updated_at = new Date().toISOString();
                updated = true;
            }
            return order;
        });
        
        if (updated) {
            localStorage.setItem('sidka_orders', JSON.stringify(orders));
            console.log(`✅ Order ${orderId} updated in localStorage`);
        }
        
        // 2. به‌روزرسانی در Supabase
        if (supabaseFixed) {
            try {
                const { error } = await supabaseFixed
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
                console.warn('⚠️ Supabase error:', supabaseError);
            }
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        return { success: false, error: error.message };
    }
}

// ========== اتصال توابع به window ==========

const supabaseFunctionsFixed = {
    // توابع سفارشات
    getAllOrders: getAllOrdersFixed,
    updateOrderStatus: updateOrderStatusFixed,
    getAllTickets: getAllTicketsFixed,
    
    // سایر توابع (مثل قبلی)
    loginOrRegisterUser: window.supabaseFunctions?.loginOrRegisterUser || async function(phone, firstName, lastName, password) {
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
        return { success: true, user: user };
    },
    
    getAllProducts: window.supabaseFunctions?.getAllProducts || async function() {
        return {
            success: true,
            products: [
                { id: 1, name: 'ساخت پنل', description: 'ساخت پنل اختصاصی با امکانات کامل', price: 900000, category: 'panels', icon: 'fas fa-plus-circle' },
                { id: 2, name: 'آپدیت پنل', description: 'ارتقاء و به‌روزرسانی پنل موجود', price: 235000, category: 'panels', icon: 'fas fa-sync-alt' },
                { id: 3, name: 'اشتراک سلف تلگرام - یک ماهه', description: 'اشتراک یکماهه سلف تلگرام', price: 40000, category: 'subscriptions', icon: 'fab fa-telegram' }
            ]
        };
    },
    
    createNewOrder: async function(orderData) {
        const order = {
            id: Date.now(),
            userId: orderData.userId,
            user_id: orderData.userId,
            total: orderData.total,
            status: 'در انتظار تأیید',
            customer_info: orderData.customerInfo,
            receipt_info: orderData.receipt,
            items: orderData.items,
            created_at: new Date().toISOString()
        };
        
        saveOrderToLocal(order);
        return { success: true, order: order };
    },
    
    createNewTicket: async function(ticketData) {
        const ticket = {
            id: Date.now(),
            userId: ticketData.userId,
            user_id: ticketData.userId,
            subject: ticketData.subject,
            message: ticketData.message,
            status: 'جدید',
            created_at: new Date().toISOString()
        };
        
        saveTicketToLocal(ticket);
        return { success: true, ticket: ticket };
    },
    
    // سایر توابع ضروری
    getUserOrders: window.supabaseFunctions?.getUserOrders || async function(userId) {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const userOrders = orders.filter(o => o.userId == userId || o.user_id == userId);
        return { success: true, orders: userOrders };
    },
    
    getUserTickets: window.supabaseFunctions?.getUserTickets || async function(userId) {
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        const userTickets = tickets.filter(t => t.userId == userId || t.user_id == userId);
        return { success: true, tickets: userTickets };
    },
    
    getDashboardStats: async function() {
        const orders = JSON.parse(localStorage.getItem('sidka_orders') || '[]');
        const tickets = JSON.parse(localStorage.getItem('sidka_tickets') || '[]');
        
        const totalIncome = orders
            .filter(o => o.status === 'تأیید شده')
            .reduce((sum, order) => sum + (order.total || 0), 0);
        
        return {
            success: true,
            stats: {
                users: Math.max(1, orders.length),
                orders: orders.length,
                totalIncome: totalIncome,
                newTickets: tickets.filter(t => t.status === 'جدید').length
            }
        };
    }
};

// جایگزینی توابع قبلی
window.supabaseFunctions = supabaseFunctionsFixed;
console.log('✅ FIXED Supabase service loaded successfully!');
