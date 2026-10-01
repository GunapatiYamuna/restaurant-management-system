# FoodieHub Razorpay + Delivery Tracking Setup

## Payment flow

FoodieHub now supports:
- Cash on Delivery
- Razorpay online checkout
- UPI through Razorpay, including supported UPI-app flows and QR when offered by Checkout
- Cards and Netbanking through Razorpay Checkout
- Server-side signature verification
- Server-side payment/order amount verification
- Payment status stored with each order
- Unpaid Razorpay orders remain `pending_payment` and are not allowed to move into restaurant fulfilment
- Delivery tracking exposes payment status along with order status

## Razorpay configuration

Create a Razorpay account and use **Test Mode** first.

Put these values in `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=
```

Never put `RAZORPAY_KEY_SECRET` in frontend JavaScript or HTML.

The frontend receives only the public `RAZORPAY_KEY_ID`.

## Install and migrate

From `backend/`:

```bash
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check
```

The payment migration is `0006_order_payment_fields`.

## UPI and QR

The checkout uses Razorpay's hosted Checkout rather than collecting UPI IDs, card numbers, expiry dates, or CVV inside FoodieHub.

When Razorpay enables the applicable UPI methods for the account/device, Checkout can present supported UPI app flows and a QR option. The customer can complete payment with a supported UPI application such as Google Pay, PhonePe or Paytm where available.

FoodieHub does **not** store card details or UPI PINs.

## Delivery tracking flow

```text
Customer
  -> Checkout + delivery map
  -> Razorpay payment (or COD)
  -> Order placed
  -> Restaurant confirms/prepares
  -> Restaurant marks Ready
  -> Admin assigns partner OR partner accepts a ready order
  -> Partner shares GPS
  -> Customer tracking page refreshes
  -> Picked Up
  -> Out for Delivery
  -> Delivered
```

The tracking API verifies that a normal customer can only view their own order.

## Test checklist

### Payment
1. Use Razorpay Test Mode.
2. Confirm COD still creates a `placed` order with `cod_pending`.
3. Select Pay Online with Razorpay.
4. Confirm Checkout opens.
5. Test a successful test payment.
6. Confirm FoodieHub calls server-side verification.
7. Confirm the order becomes `payment_status=paid` and `status=placed`.
8. Confirm the restaurant can process a paid online order.
9. Confirm a failed/closed payment does not become paid.
10. Confirm an unpaid online order cannot be marked `confirmed`, `preparing`, `ready`, `out_for_delivery`, or `delivered`.

### Tracking
1. Place a paid order with a delivery latitude/longitude.
2. Restaurant moves the order to `ready`.
3. Admin assigns a delivery partner, or an available partner accepts it.
4. Delivery partner enables GPS.
5. Confirm the partner location is stored.
6. Open `tracking.html?id=<order_id>` as the customer.
7. Confirm the customer sees order status, payment status, destination, partner details and latest partner location.
8. Mark `picked_up`, then `delivered`.
9. Confirm the customer tracking page reflects the changes.
10. Confirm another customer cannot access the order's tracking API.

Automated tracking tests are included in `backend/restaurant/tests.py`, and CI is configured to run them against MySQL.
