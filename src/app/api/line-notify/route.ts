import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const lineGroupId = process.env.LINE_GROUP_ID!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: orders, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('status', 'todo')
      .order('category')
      .order('date', { ascending: true })

    if (error) throw error
    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'No todo items' })
    }

    const grouped: Record<string, typeof orders> = {}
    orders.forEach(o => {
      if (!grouped[o.category]) grouped[o.category] = []
      grouped[o.category].push(o)
    })

    let message = `📋 สรุป Todo ประจำวัน\n`
    message += `📅 ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' })}\n`
    message += `━━━━━━━━━━━━━━━\n`

    for (const [category, items] of Object.entries(grouped)) {
      message += `\n🏷️ ${category} (${items.length} รายการ)\n`
      items.forEach((item, i) => {
        const topic = (item as any).topic ? `[${(item as any).topic}] ` : ''
        message += `  ${i + 1}. ${topic}${item.order_detail}\n`
        if (item.remark) message += `     💬 ${item.remark}\n`
      })
    }

    message += `\n━━━━━━━━━━━━━━━\n`
    message += `รวมทั้งหมด ${orders.length} รายการ`

    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        to: lineGroupId,
        messages: [{ type: 'text', text: message }],
      }),
    })

    if (!lineRes.ok) {
      const err = await lineRes.text()
      throw new Error(`LINE API error: ${err}`)
    }

    return NextResponse.json({ message: 'Sent', count: orders.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
