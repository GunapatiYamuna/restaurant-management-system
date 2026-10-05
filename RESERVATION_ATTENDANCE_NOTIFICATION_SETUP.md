# Free Reservation Attendance Notifications

The reservation attendance confirmation is completely free and works inside the FoodieHub website.

## Flow

1. Customer books a table.
2. The reservation remains Pending with attendance response Pending.
3. When the reservation is within one hour of its start time, the customer's **My Reservations** page shows an attendance reminder.
4. **Coming** changes the reservation to **Confirmed**.
5. **Not Coming** changes the reservation to **Cancelled**.
6. The restaurant portal shows the customer's attendance response.

## No paid service required

Twilio, SMS credits, a public SMS callback URL, and a payment account are not required.

The customer must be logged in to FoodieHub and have the **My Reservations** page open. That page checks the free Django notification endpoint every minute.

## College-project testing

For an easy demo, create a reservation for a time within the next hour, open **My Reservations**, and choose **Coming** or **Not Coming**.

The attendance response links are signed by Django and expire after 48 hours. They are tied to the specific reservation and customer account.
