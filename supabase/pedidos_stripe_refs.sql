-- Stripe references so the admin can deep-link from /admin/pedidos/[id]
-- to the matching record in the Stripe dashboard.
--
-- session_id        → checkout.session.id   (cs_test_... / cs_live_...)
-- payment_intent_id → payment_intent.id     (pi_test_... / pi_live_...)
--
-- We store both because in some flows the customer might not complete the
-- session (only PI exists) or vice versa.

alter table public.pedidos
  add column if not exists stripe_session_id        text,
  add column if not exists stripe_payment_intent_id text;

create index if not exists pedidos_stripe_session_idx
  on public.pedidos (stripe_session_id);
