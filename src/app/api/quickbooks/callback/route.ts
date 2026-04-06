import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");
  const state = searchParams.get("state"); // userId

  if (!code || !realmId || !state) {
    return Response.redirect(new URL("/quickbooks?error=missing_params", request.url));
  }

  try {
    const credentials = Buffer.from(
      `${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch(
      process.env.QUICKBOOKS_ENVIRONMENT === "sandbox"
        ? "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
        : "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI ?? "",
        }),
      }
    );

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      return Response.redirect(new URL("/quickbooks?error=token_exchange", request.url));
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.quickBooksConnection.upsert({
      where: { userId: state },
      create: {
        userId: state,
        realmId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
      update: {
        realmId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
    });

    return Response.redirect(new URL("/quickbooks?connected=1", request.url));
  } catch {
    return Response.redirect(new URL("/quickbooks?error=server_error", request.url));
  }
}
