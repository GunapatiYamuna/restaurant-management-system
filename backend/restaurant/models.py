from django.contrib.auth.models import User
from django.db import models

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=15, blank=True)
    city = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    google_sub = models.CharField(max_length=255, blank=True, unique=True, null=True)

    def __str__(self):
        return self.user.email or self.user.username

class Restaurant(models.Model):
    owner = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="owned_restaurant")
    name = models.CharField(max_length=150)
    cuisine = models.CharField(max_length=100)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    reviews = models.PositiveIntegerField(default=0)
    price = models.CharField(max_length=10, default="₹₹")
    location = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True)

    def __str__(self):
        return self.name

class MenuItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="menu_items")
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.CharField(max_length=500, blank=True)
    # Small uploaded menu images are stored in MySQL so they survive Railway redeploys.
    image_data = models.BinaryField(null=True, blank=True)
    image_content_type = models.CharField(max_length=100, blank=True)
    available = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Reservation(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reservations")
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="reservations")
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    date = models.DateField()
    time = models.TimeField()
    guests = models.PositiveIntegerField(default=1)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=30, default="pending")
    attendance_response = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("coming", "Coming"),
            ("not_coming", "Not Coming"),
        ],
        default="pending",
    )
    attendance_notified_at = models.DateTimeField(null=True, blank=True)
    attendance_responded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ReservationPayment(models.Model):
    METHOD_UPI = "UPI"
    REFUND_COUPON = "coupon"
    REFUND_UPI = "upi"

    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name="payment")
    food_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    coupon_discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    upfront_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, default=METHOD_UPI)
    upfront_status = models.CharField(max_length=30, default="paid")
    upfront_transaction_id = models.CharField(max_length=100, blank=True)
    remaining_status = models.CharField(max_length=30, default="pending")
    remaining_transaction_id = models.CharField(max_length=100, blank=True)
    refund_status = models.CharField(max_length=30, default="not_requested")
    refund_type = models.CharField(max_length=20, blank=True)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    refund_reference = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    remaining_paid_at = models.DateTimeField(null=True, blank=True)
    refund_processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reservation payment #{self.reservation_id}"


class ReservationCoupon(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reservation_coupons")
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name="refund_coupon")
    code = models.CharField(max_length=40, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    redeemed_order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="redeemed_coupons",
    )
    reserved_order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reserved_coupons",
    )
    redeemed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code


class PushSubscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.TextField()
    endpoint_hash = models.CharField(max_length=64, unique=True, editable=False)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Push subscription for {self.user_id}"


class ReservationItem(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=150)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.name} x {self.quantity}"


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    payment_method = models.CharField(max_length=80, default="Cash on Delivery")
    payment_status = models.CharField(max_length=30, default="cod_pending")
    razorpay_order_id = models.CharField(max_length=80, blank=True)
    razorpay_payment_id = models.CharField(max_length=80, blank=True)
    razorpay_signature = models.CharField(max_length=128, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=30, default="placed")
    delivery_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    delivery_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=150)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

class InventoryItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="inventory")
    name = models.CharField(max_length=150)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=30, default="units")
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)


class DeliveryPartner(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="delivery_partner")
    phone = models.CharField(max_length=15, blank=True)
    vehicle_type = models.CharField(max_length=50, default="Bike")
    vehicle_number = models.CharField(max_length=30, blank=True)
    is_available = models.BooleanField(default=True)
    current_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    current_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    last_location_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.user.first_name or self.user.username


class DeliveryAssignment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="delivery_assignment")
    partner = models.ForeignKey(DeliveryPartner, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments")
    status = models.CharField(max_length=30, default="assigned")
    assigned_at = models.DateTimeField(auto_now_add=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Order #{self.order_id} delivery"


class ContactMessage(models.Model):
    STATUS_UNREAD = "unread"
    STATUS_READ = "read"

    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, default=STATUS_UNREAD)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} — {self.name}"
