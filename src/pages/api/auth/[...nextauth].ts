// ** NextAuth Imports
import NextAuth from "next-auth"
import Email from 'next-auth/providers/email'
import { MongoDBAdapter } from "@auth/mongodb-adapter"

// ** NodeMailer Imports
import { createTransport } from "nodemailer"

// ** Lib Imports
import clientPromise from "@/lib/mongodb/client"
import smtpRelayConfig from "@/lib/smtpRelay/config"

// ** Type Imports
import type { NextAuthOptions, Theme } from "next-auth"

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
function htmlInvite(params: { url: string; host: string; theme: Theme }) {
  const { url, host, theme } = params

  const escapedHost = host.replace(/\./g, "&#8203;.")
  const brandColor = theme.brandColor || "#346df1"
  const buttonText = theme.buttonText || "#fff"

  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText,
  }

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        You have been invited to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Accept Invite</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        <strong>Note:</strong> If you were not expecting this invitation, you can ignore this email.
      </td>
    </tr>
    <tr>
      <td
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        <strong>Button not working?</strong> Copy and paste this link into your browser: ${url}
      </td>
    </tr>
  </table>
</body>
`
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function textInvite({ url, host }: { url: string; host: string }) {
  return `Accept invite to to ${host}\n${url}\n\n`
}

export const authOptions: NextAuthOptions = {
  providers: [
    Email({
      id: 'email',
      name: 'Email',
      server: smtpRelayConfig,
      from: process.env.EMAIL_FROM,
    }),
    Email({
      id: 'emailInvite',
      name: 'Email Invite',
      server: smtpRelayConfig,
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async (params) => {
        const { identifier, url, provider, theme } = params
        const { host } = new URL(url)
        const transport = createTransport(provider.server)
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `You have been invited to ${host}`,
          text: textInvite({ url, host }),
          html: htmlInvite({ url, host, theme }),
        })
        const failed = result.rejected.concat(result.pending).filter(Boolean)
        if (failed.length) {
          throw new Error(`Email Invite (${failed.join(", ")}) could not be sent`)
        }
      }
    }),
  ],
  // TODO: Research MongoDBAdapter Typescript error
  // @ts-expect-error
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  callbacks: {
    session: async ({ session, token }) => {
      session.user.id = token.sub
      return session
    }
  },
}

export default NextAuth(authOptions)
