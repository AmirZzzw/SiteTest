// supabase-service.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { SUPABASE_CONFIG } from './supabase-config.js'

const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY)

// ==================== توابع کاربران ====================
export async function loginOrRegisterUser(phone, firstName = '', lastName = '') {
    try {
        // اول چک کن آیا کاربر وجود داره
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single()
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            console.log('خطا در دریافت کاربر:', fetchError)
            // اگر کاربر وجود نداره، ایجادش کن
        }
        
        let user;
        
        if (existingUser) {
            // کاربر موجود
            user = existingUser
        } else {
            // کاربر جدید
            const newUser = {
                id: Date.now(),
                phone: phone,
                first_name: firstName,
                last_name: lastName,
                is_admin: phone === '09021707830'
            }
            
            const { data, error } = await supabase
                .from('users')
                .insert([newUser])
                .select()
                .single()
            
            if (error) {
                console.log('خطا در ثبت کاربر جدید:', error)
                // شاید کاربر همزمان ساخته شده، دوباره چک کن
                const { data: retryData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', phone)
                    .single()
                
                user = retryData
            } else {
                user = data
            }
        }
        
        return {
            success: true,
            user: user,
            isNew: !existingUser
        }
    } catch (error) {
        console.error('خطا در ورود/ثبت‌نام:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

export async function updateUserInfo(userId, firstName, lastName) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                first_name: firstName,
                last_name: lastName
            })
            .eq('id', userId)
            .select()
            .single()
        
        if (error) throw error
        return { success: true, user: data }
    } catch (error) {
        console.error('خطا در بروزرسانی کاربر:', error)
        return { success: false, error: error.message }
    }
}

export async function getUserByPhone(phone) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single()
        
        if (error) throw error
        return { success: true, user: data }
    } catch (error) {
        console.error('خطا در دریافت کاربر:', error)
        return { success: false, error: error.message }
    }
}

// ==================== توابع محصولات ====================
export async function getAllProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id')
        
        if (error) throw error
        return { success: true, products: data }
    } catch (error) {
        console.error('خطا در دریافت محصولات:', error)
        return { success: false, error: error.message }
    }
}

// ==================== توابع سفارشات ====================
export async function createNewOrder(orderData) {
    try {
        const order = {
            id: orderData.id,
            user_id: orderData.userId,
            total: orderData.total,
            status: 'در انتظار تأیید رسید',
            customer_info: orderData.customerInfo,
            receipt_info: orderData.receipt,
            items: orderData.items
        }
        
        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select()
            .single()
        
        if (error) throw error
        return { success: true, order: data }
    } catch (error) {
        console.error('خطا در ثبت سفارش:', error)
        return { success: false, error: error.message }
    }
}

export async function getUserOrders(userId) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return { success: true, orders: data }
    } catch (error) {
        console.error('خطا در دریافت سفارشات کاربر:', error)
        return { success: false, error: error.message }
    }
}

export async function getAllOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users (phone, first_name, last_name)
            `)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return { success: true, orders: data }
    } catch (error) {
        console.error('خطا در دریافت همه سفارشات:', error)
        return { success: false, error: error.message }
    }
}

export async function updateOrderStatus(orderId, status) {
    try {
        const updateData = {
            status: status
        }
        
        // اگر وضعیت رسید هم باید آپدیت شه
        if (status === 'تأیید شده' || status === 'رد شده') {
            updateData.receipt_info = { status: status }
        }
        
        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single()
        
        if (error) throw error
        return { success: true, order: data }
    } catch (error) {
        console.error('خطا در بروزرسانی سفارش:', error)
        return { success: false, error: error.message }
    }
}

// ==================== توابع تیکت‌ها ====================
export async function createNewTicket(ticketData) {
    try {
        const ticket = {
            id: ticketData.id,
            user_id: ticketData.userId,
            subject: ticketData.subject,
            message: ticketData.message,
            status: 'جدید',
            replies: []
        }
        
        const { data, error } = await supabase
            .from('tickets')
            .insert([ticket])
            .select()
            .single()
        
        if (error) throw error
        return { success: true, ticket: data }
    } catch (error) {
        console.error('خطا در ایجاد تیکت:', error)
        return { success: false, error: error.message }
    }
}

export async function getUserTickets(userId) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return { success: true, tickets: data }
    } catch (error) {
        console.error('خطا در دریافت تیکت‌های کاربر:', error)
        return { success: false, error: error.message }
    }
}

export async function getAllTickets() {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                users (phone, first_name, last_name)
            `)
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return { success: true, tickets: data }
    } catch (error) {
        console.error('خطا در دریافت همه تیکت‌ها:', error)
        return { success: false, error: error.message }
    }
}

export async function addTicketReply(ticketId, replyData) {
    try {
        // دریافت تیکت فعلی
        const { data: ticket, error: fetchError } = await supabase
            .from('tickets')
            .select('replies, status')
            .eq('id', ticketId)
            .single()
        
        if (fetchError) throw fetchError
        
        // اضافه کردن پاسخ جدید
        const replies = ticket.replies || []
        replies.push({
            id: Date.now(),
            isAdmin: replyData.isAdmin,
            message: replyData.message,
            date: new Date().toISOString()
        })
        
        // تعیین وضعیت جدید
        let newStatus = ticket.status
        if (replyData.isAdmin && ticket.status === 'جدید') {
            newStatus = 'در حال بررسی'
        }
        
        // بروزرسانی تیکت
        const { data, error } = await supabase
            .from('tickets')
            .update({
                replies: replies,
                status: newStatus
            })
            .eq('id', ticketId)
            .select()
            .single()
        
        if (error) throw error
        return { success: true, ticket: data }
    } catch (error) {
        console.error('خطا در پاسخ به تیکت:', error)
        return { success: false, error: error.message }
    }
}

export async function updateTicketStatus(ticketId, status) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .update({ status: status })
            .eq('id', ticketId)
            .select()
            .single()
        
        if (error) throw error
        return { success: true, ticket: data }
    } catch (error) {
        console.error('خطا در بروزرسانی وضعیت تیکت:', error)
        return { success: false, error: error.message }
    }
}

// ==================== توابع آمار ====================
export async function getDashboardStats() {
    try {
        // تعداد کاربران
        const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
        
        if (usersError) throw usersError
        
        // تعداد سفارشات
        const { count: ordersCount, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
        
        if (ordersError) throw ordersError
        
        // مجموع درآمد (از سفارشات تأیید شده)
        const { data: orders, error: incomeError } = await supabase
            .from('orders')
            .select('total')
            .eq('status', 'تأیید شده')
        
        if (incomeError) throw incomeError
        
        const totalIncome = orders ? orders.reduce((sum, order) => sum + (order.total || 0), 0) : 0
        
        // تعداد تیکت‌های جدید
        const { count: newTicketsCount, error: ticketsError } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'جدید')
        
        if (ticketsError) throw ticketsError
        
        return {
            success: true,
            stats: {
                users: usersCount || 0,
                orders: ordersCount || 0,
                totalIncome: totalIncome || 0,
                newTickets: newTicketsCount || 0
            }
        }
    } catch (error) {
        console.error('خطا در دریافت آمار:', error)
        return {
            success: false,
            error: error.message,
            stats: {
                users: 0,
                orders: 0,
                totalIncome: 0,
                newTickets: 0
            }
        }
    }
}

// صادر کردن supabase client (برای مواقع ضروری)
export { supabase }
