import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const lineGroupId = process.env.LINE_GROUP_ID!

export async function POST(request: Request) {
  try {
    const { category, topic, order_detail, remark, date } = await request.json()

    const flexMessage = {
      type: 'flex',
      altText: `📌 TO DO ใหม่: ${order_detail}`,
      contents: {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'horizontal',
          backgroundColor: '#4C6EF5',
          paddingAll: '14px',
          contents: [
            { type: 'text', text: '📌', size: 'md', flex: 0 },
            { type: 'text', text: 'TO DO ใหม่', color: '#FFFFFF', size: 'md', weight: 'bold', flex: 1, margin: 'sm' },
          ],
          alignItems: 'center',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '14px',
          backgroundColor: '#FAFBFF',
          spacing: 'md',
          contents: [
            ...(topic ? [{
              type: 'text' as const,
              text: topic,
              size: 'sm' as const,
              color: '#4C6EF5',
              weight: 'bold' as const,
            }] : []),
            {
              type: 'text',
              text: order_detail,
              size: 'md',
              color: '#333333',
              wrap: true,
              weight: 'bold',
            },
            { type: 'separator' },
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '🏷️', size: 'xs', flex: 0 },
                    { type: 'text', text: category || '-', size: 'xs', color: '#666666', margin: 'sm' },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '📅', size: 'xs', flex: 0 },
                    { type: 'text', text: date || '-', size: 'xs', color: '#666666', margin: 'sm' },
                  ],
                },
                ...(remark ? [{
                  type: 'box' as const,
                  layout: 'horizontal' as const,
                  contents: [
                    { type: 'text' as const, text: '💬', size: 'xs' as const, flex: 0 },
                    { type: 'text' as const, text: remark, size: 'xs' as const, color: '#666666', margin: 'sm' as const, wrap: true },
                  ],
                }] : []),
              ],
            },
          ],
        },
      },
    }

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

    return NextResponse.json({ message: 'Sent' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
