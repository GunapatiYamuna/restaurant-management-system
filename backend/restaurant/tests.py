from decimal import Decimal
from django.contrib.auth.models import User
from django.test import TestCase

from restaurant.models import DeliveryAssignment, DeliveryPartner, Order
from django.urls import reverse


class DeliveryTrackingTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer@example.com",
            email="customer@example.com",
            password="TestPass!123",
            first_name="Customer",
        )
        self.partner_user = User.objects.create_user(
            username="partner@example.com",
            email="partner@example.com",
            password="TestPass!123",
            first_name="Partner",
        )
        self.partner = DeliveryPartner.objects.create(
            user=self.partner_user,
            phone="9999999999",
            vehicle_type="Bike",
            vehicle_number="AP00AA0000",
            is_available=True,
        )
        self.order = Order.objects.create(
            user=self.customer,
            name="Customer",
            phone="9999999999",
            address="Test Street",
            city="Ongole",
            pincode="523001",
            payment_method="Cash on Delivery",
            payment_status="cod_pending",
            total=Decimal("447.00"),
            status="ready",
            delivery_lat=Decimal("15.5057000"),
            delivery_lng=Decimal("80.0499000"),
        )
        self.assignment = DeliveryAssignment.objects.create(
            order=self.order,
            partner=self.partner,
            status="accepted",
        )

    def test_customer_can_track_assigned_partner(self):
        self.client.force_login(self.customer)
        response = self.client.get(reverse("order-tracking", kwargs={"order_id": self.order.id}))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["order"]["id"], self.order.id)
        self.assertEqual(payload["order"]["payment_status"], "cod_pending")
        self.assertEqual(payload["partner"]["id"], self.partner.id)

    def test_delivery_partner_location_reaches_customer_tracking(self):
        self.client.force_login(self.partner_user)
        response = self.client.post(
            reverse("delivery-location", kwargs={"order_id": self.order.id}),
            data={"lat": "15.5061000", "lng": "80.0510000"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        self.client.force_login(self.customer)
        response = self.client.get(reverse("order-tracking", kwargs={"order_id": self.order.id}))
        payload = response.json()
        self.assertEqual(payload["partner"]["current_lat"], 15.5061)
        self.assertEqual(payload["partner"]["current_lng"], 80.051)

    def test_delivery_status_updates_order(self):
        self.client.force_login(self.partner_user)
        response = self.client.post(
            reverse("delivery-status", kwargs={"order_id": self.order.id}),
            data={"status": "picked_up"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "out_for_delivery")

        response = self.client.post(
            reverse("delivery-status", kwargs={"order_id": self.order.id}),
            data={"status": "delivered"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.partner.refresh_from_db()
        self.assertEqual(self.order.status, "delivered")
        self.assertTrue(self.partner.is_available)



    def test_delivery_dashboard_separates_delivered_history(self):
        self.client.force_login(self.partner_user)

        response = self.client.get(
            reverse("delivery-dashboard")
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(
            [item["id"] for item in payload["active_orders"]],
            [self.order.id],
        )
        self.assertEqual(payload["delivered_orders"], [])

        response = self.client.post(
            reverse(
                "delivery-status",
                kwargs={"order_id": self.order.id},
            ),
            data={"status": "delivered"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        response = self.client.get(
            reverse("delivery-dashboard")
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(payload["active_orders"], [])
        self.assertEqual(
            [item["id"] for item in payload["delivered_orders"]],
            [self.order.id],
        )
        self.assertEqual(
            payload["delivered_orders"][0]["assignment_status"],
            "delivered",
        )
        self.assertIsNotNone(
            payload["delivered_orders"][0]["delivered_at"]
        )

    def test_ready_order_appears_in_available_orders(self):
        available_order = Order.objects.create(
            user=self.customer,
            name="Second Customer",
            phone="9888888888",
            address="Second Street",
            city="Ongole",
            pincode="523001",
            payment_method="Cash on Delivery",
            payment_status="cod_pending",
            total=Decimal("300.00"),
            status="ready",
        )

        self.client.force_login(self.partner_user)
        response = self.client.get(
            reverse("delivery-dashboard")
        )
        self.assertEqual(response.status_code, 200)

        available_ids = [
            item["id"] for item in response.json()["available_orders"]
        ]
        self.assertIn(available_order.id, available_ids)




    def test_out_for_delivery_unassigned_order_appears_in_available_orders(self):
        unassigned_order = Order.objects.create(
            user=self.customer,
            name="Out For Delivery Customer",
            phone="9777777777",
            address="Out For Delivery Street",
            city="Ongole",
            pincode="523001",
            payment_method="Cash on Delivery",
            payment_status="cod_pending",
            total=Decimal("325.00"),
            status="out_for_delivery",
        )

        self.client.force_login(self.partner_user)
        response = self.client.get(
            reverse("delivery-dashboard")
        )
        self.assertEqual(response.status_code, 200)

        available = response.json()["available_orders"]
        available_ids = [item["id"] for item in available]

        self.assertIn(unassigned_order.id, available_ids)
        shown = next(item for item in available if item["id"] == unassigned_order.id)
        self.assertEqual(shown["status"], "out_for_delivery")



    def test_delivery_dashboard_exposes_partner_live_location(self):
        self.partner.current_lat = Decimal("15.5061000")
        self.partner.current_lng = Decimal("80.0510000")
        from django.utils import timezone
        self.partner.last_location_at = timezone.now()
        self.partner.save(update_fields=["current_lat", "current_lng", "last_location_at"])

        self.client.force_login(self.partner_user)
        response = self.client.get(
            reverse("delivery-dashboard")
        )
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(
            payload["active_orders"][0]["partner_current_lat"],
            15.5061,
        )
        self.assertEqual(
            payload["active_orders"][0]["partner_current_lng"],
            80.051,
        )

    def test_payment_config_does_not_expose_secret(self):
        response = self.client.get(reverse("payment-config"))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertNotIn("key_secret", payload)
        self.assertNotIn("RAZORPAY_KEY_SECRET", payload)
