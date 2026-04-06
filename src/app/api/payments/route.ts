import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CONTRACTOR") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { invoiceId, amount, method } = await request.json();

    if (!invoiceId || !amount) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        project: { contractorId: session.user.id },
        status: "APPROVED",
      },
    });

    if (!invoice) return Response.json({ error: "Invoice not found or not approved" }, { status: 404 });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: "usd",
      payment_method_types: method === "ach" ? ["us_bank_account"] : ["card"],
      metadata: {
        invoiceId,
        contractorId: session.user.id,
        subcontractorId: invoice.subcontractorId,
      },
    });

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        subcontractorId: invoice.subcontractorId,
        contractorId: session.user.id,
        amount,
        status: "PENDING",
        method: method || "card",
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return Response.json({
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch {
    return Response.json({ error: "Payment initiation failed" }, { status: 500 });
  }
}
