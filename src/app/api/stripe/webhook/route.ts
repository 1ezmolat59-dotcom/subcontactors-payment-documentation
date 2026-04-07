import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return Response.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { invoiceId, subcontractorId, contractorId } = pi.metadata;

    if (invoiceId) {
      await prisma.$transaction([
        prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: "COMPLETED", processedAt: new Date() },
        }),
        prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID", paidAt: new Date() },
        }),
      ]);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: pi.id },
      data: { status: "FAILED" },
    });
  }

  return Response.json({ received: true });
}
