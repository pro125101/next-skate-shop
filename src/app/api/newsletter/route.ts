import { db } from "@/db"
import { newsletterSubscriptions } from "@/db/schema"
import { env } from "@/env.mjs"
import { currentUser } from "@clerk/nextjs"
import { eq } from "drizzle-orm"
import { Resend } from "resend"

import { checkEmailSchema } from "@/lib/validations/auth"
import NewsletterWelcomeEmail from "@/components/emails/newsletter-welcome-email"

const resend = new Resend(env.RESEND_API_KEY)

export async function POST(req: Request) {
  const input = checkEmailSchema.parse(await req.json())

  try {
    const user = await currentUser()

    const existingEmail = await db.query.newsletterSubscriptions.findFirst({
      where: eq(newsletterSubscriptions.email, input.email),
    })

    if (existingEmail) {
      throw new Error("You are already subscribed to the newsletter.")
    }

    // Using the resend provider to send the email
    // We can also use nodemailer, sendgrid, postmark, aws ses, mailersend, or plunk
    await resend.emails.send({
      from: env.EMAIL_FROM_ADDRESS,
      to: input.email,
      subject: "Welcome to the newsletter!",
      react: NewsletterWelcomeEmail({
        firstName: user?.firstName ?? undefined,
        fromEmail: env.EMAIL_FROM_ADDRESS,
      }),
    })

    // Save the email and user id to the database
    await db.insert(newsletterSubscriptions).values({
      email: input.email,
      userId: user?.id,
    })

    return new Response("You have successfully joined our newsletter.", {
      status: 200,
    })
  } catch (error) {
    error instanceof Error ? console.error(error.message) : console.error(error)

    return new Response("Something went wrong, please try again.", {
      status: 400,
    })
  }
}
