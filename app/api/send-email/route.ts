import { NextResponse } from "next/server"
import { SendMailClient } from "zeptomail"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, pickID } = body

    const url = "https://api.zeptomail.in/v1.1/email/template"
    const token = process.env.ZEPTOMAIL_TOKEN! // 🔥 use env

    const client = new SendMailClient({ url, token })

    await client.sendMailWithTemplate({
      template_key: "2518b.5f1360f6e8e70412.k1.14d4fa60-0dc0-11f1-8966-62df313bf14d.19c77247d06",
      from: {
        address: "noreply@pickopick.com",
        name: "PickoPick",
      },
      to: [
        {
          email_address: {
            address: email,
            name: name,
          },
        },
      ],
      merge_info: {
        name,
        pickID,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mail error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}