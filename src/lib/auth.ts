import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "@/db";
import * as schema from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "dev-super-secure-secret-32-chars-prohor-square-app",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  trustedOrigins: [
    "http://79.143.185.101:3000",
    "http://79.143.185.101:3001",
    "http://79.143.185.101:3002",
    "http://79.143.185.101:3003",
    "http://79.143.185.101:3004",
    "http://79.143.185.101:3005",
    "http://79.143.185.101:3006",
    "http://79.143.185.101:3007",
    "http://79.143.185.101:3008",
    "http://79.143.185.101:3009",
    "http://79.143.185.101:3010",
    "http://79.143.185.101",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3006",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3006",
    "https://square.prohor.dev",
  ],
  advanced: {
    useSecureCookies: false,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // The auth database lives far away and a single session lookup can take
    // several seconds, which made every protected page look frozen after a
    // click. Caching the signed session payload in a cookie removes that round
    // trip on ordinary page loads. Trade-off: a role change (or a sign-out on
    // another device) can take up to `maxAge` to be observed.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const from = process.env.EMAIL_FROM || "Prohor Auth <auth@prohor.dev>";
        try {
          await resend.emails.send({
            from,
            to: email,
            subject: "আপনার স্কয়ার লগইন ম্যাজিক লিংক",
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; rounded: 16px;">
                <h2 style="color: #111; margin-bottom: 16px;">স্কয়ারে সাইন ইন করুন</h2>
                <p style="color: #555; font-size: 15px; line-height: 1.5;">নিচের বাটনে ক্লিক করে সরাসরি আপনার অ্যাকাউন্টে লগইন করুন:</p>
                <div style="margin: 24px 0;">
                  <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">লগইন করুন</a>
                </div>
                <p style="color: #888; font-size: 13px;">আপনি যদি এই লিংকের জন্য অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।</p>
              </div>
            `,
          });
        } catch (error) {
          console.error("Failed to send magic link email:", error);
        }
      },
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "student",
      },
      hscBatch: {
        type: "string",
        required: false,
      },
      college: {
        type: "string",
        required: false,
      },
    },
  },
});
