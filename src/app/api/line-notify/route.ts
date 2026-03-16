import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const lineGroupId = process.env.LINE_GROUP_ID!

function buildFlexMessage(grouped: Record<string, any[]>, totalCount: number) {
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' })

  const categoryBubbles = Object.entries(grouped).map(([category, items]) => {
    const itemContents: any[] = items.map((item, i) => {
      const topic = item.topic ? item.topic : ''
      const contents: any[] = [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `${i + 1}.`,
              size: 'sm',
              color: '#4C6EF5',
              flex: 0,
              weight: 'bold',
            },
            {
              type: 'box',
              layout: 'vertical',
              flex: 1,
              paddingStart: '8px',
              contents: [
                ...(topic ? [{
                  type: 'text',
                  text: topic,
                  size: 'xs',
                  color: '#4C6EF5',
                  weight: 'bold',
                }] : []),
                {
                  type: 'text',
                  text: item.order_detail,
                  size: 'sm',
                  color: '#333333',
                  wrap: true,
                },
                ...(item.remark ? [{
                  type: 'text',
                  text: `💬 ${item.remark}`,
                  size: 'xs',
                  color: '#999999',
                  margin: 'xs',
                  wrap: true,
                }] : []),
              ],
            },
          ],
          margin: i > 0 ? 'lg' : 'none',
        },
      ]
      return contents
    }).flat()

    return {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#4C6EF5',
        paddingAll: '14px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🏷️',
                size: 'md',
                flex: 0,
              },
              {
                type: 'text',
                text: category,
                color: '#FFFFFF',
                size: 'md',
                weight: 'bold',
                flex: 1,
                margin: 'sm',
              },
              {
                type: 'text',
                text: `${items.length}`,
                color: '#FFFFFF',
                size: 'sm',
                align: 'end',
                flex: 0,
                decoration: 'none',
                weight: 'bold',
              },
            ],
            alignItems: 'center',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: itemContents,
        paddingAll: '14px',
        backgroundColor: '#FAFBFF',
      },
    }
  })

  const headerBubble = {
    type: 'bubble',
    size: 'kilo',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📋',
          size: '3xl',
          align: 'center',
        },
        {
          type: 'text',
          text: 'สรุป TO DO',
          size: 'xl',
          weight: 'bold',
          align: 'center',
          color: '#333333',
          margin: 'md',
        },
        {
          type: 'text',
          text: 'ประจำวัน',
          size: 'md',
          align: 'center',
          color: '#666666',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📅',
              size: 'sm',
              flex: 0,
            },
            {
              type: 'text',
              text: today,
              size: 'sm',
              color: '#666666',
              margin: 'sm',
            },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'sm',
          contents: [
            {
              type: 'text',
              text: '📝',
              size: 'sm',
              flex: 0,
            },
            {
              type: 'text',
              text: `ทั้งหมด ${totalCount} รายการ`,
              size: 'sm',
              color: '#666666',
              margin: 'sm',
            },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'sm',
          contents: [
            {
              type: 'text',
              text: '📂',
              size: 'sm',
              flex: 0,
            },
            {
              type: 'text',
              text: `${Object.keys(grouped).length} หมวดหมู่`,
              size: 'sm',
              color: '#666666',
              margin: 'sm',
            },
          ],
        },
      ],
      paddingAll: '20px',
      backgroundColor: '#FFFFFF',
    },
  }

  return {
    type: 'flex',
    altText: `📋 สรุป TO DO ประจำวัน (${totalCount} รายการ)`,
    contents: {
      type: 'carousel',
      contents: [headerBubble, ...categoryBubbles],
    },
  }
}

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

    const flexMessage = buildFlexMessage(grouped, orders.length)

    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        to: lineGroupId,
        messages: [flexMessage],
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
