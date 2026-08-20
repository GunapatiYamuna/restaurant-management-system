from django.shortcuts import render


RESTAURANTS = [
    {
        "id": 1,
        "name": "Spice Garden",
        "cuisine": "Indian",
        "rating": 4.8,
        "reviews": 124,
        "price": "₹₹",
        "location": "Vijayawada",
        "description": "Authentic Indian cuisine prepared with fresh ingredients and traditional spices.",
        "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
    },
    {
        "id": 2,
        "name": "The Food Court",
        "cuisine": "Multi-Cuisine",
        "rating": 4.6,
        "reviews": 98,
        "price": "₹₹",
        "location": "Guntur",
        "description": "A modern restaurant offering delicious dishes from different cuisines.",
        "image": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=900",
    },
    {
        "id": 3,
        "name": "Royal Treat",
        "cuisine": "North Indian",
        "rating": 4.7,
        "reviews": 156,
        "price": "₹₹₹",
        "location": "Hyderabad",
        "description": "Premium dining experience with rich flavours and elegant interiors.",
        "image": "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=900",
    },
    {
        "id": 4,
        "name": "Tasty Bites",
        "cuisine": "Chinese",
        "rating": 4.5,
        "reviews": 87,
        "price": "₹₹",
        "location": "Vijayawada",
        "description": "Delicious Chinese dishes, noodles, fried rice and more.",
        "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900",
    },
    {
        "id": 5,
        "name": "Urban Cafe",
        "cuisine": "Cafe",
        "rating": 4.4,
        "reviews": 76,
        "price": "₹",
        "location": "Guntur",
        "description": "A cozy cafe serving snacks, coffee, desserts and quick bites.",
        "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900",
    },
    {
        "id": 6,
        "name": "Green Leaf",
        "cuisine": "Vegetarian",
        "rating": 4.6,
        "reviews": 112,
        "price": "₹₹",
        "location": "Hyderabad",
        "description": "Fresh vegetarian food prepared with healthy and natural ingredients.",
        "image": "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=900",
    },
]


def restaurant_list(request):
    return render(
        request,
        "restaurant/restaurants.html",
        {"restaurants": RESTAURANTS}
    )


def restaurant_details(request, restaurant_id):
    restaurant = next(
        (r for r in RESTAURANTS if r["id"] == restaurant_id),
        None
    )

    if restaurant is None:
        return render(
            request,
            "restaurant/restaurant-details.html",
            {"restaurant": None}
        )

    return render(
        request,
        "restaurant/restaurant-details.html",
        {"restaurant": restaurant}
    )


def reservation(request, restaurant_id):
    restaurant = next(
        (r for r in RESTAURANTS if r["id"] == restaurant_id),
        None
    )

    if restaurant is None:
        return render(
            request,
            "restaurant/restaurant-details.html",
            {"restaurant": None}
        )

    if request.method == "POST":
        reservation_data = {
            "name": request.POST.get("name"),
            "email": request.POST.get("email"),
            "phone": request.POST.get("phone"),
            "date": request.POST.get("date"),
            "time": request.POST.get("time"),
            "guests": request.POST.get("guests"),
            "restaurant": restaurant,
        }

        return render(
            request,
            "restaurant/confirmation.html",
            {"reservation": reservation_data}
        )

    return render(
        request,
        "restaurant/reservation.html",
        {"restaurant": restaurant}
    )