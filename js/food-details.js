const foodData = {

    pizza: {
        title: "Pizza",
        icon: "🍕",
        description: "Freshly baked pizzas available from restaurants in Ongole.",
        items: [
            {
                name: "Margherita Pizza",
                restaurant: "Food Stories",
                image: "images/pizzza.png",
                description: "Classic pizza with tomato sauce, cheese and herbs.",
                price: 249,
                rating: 4.2
            },
            {
                name: "Farmhouse Pizza",
                restaurant: "Pizza Hut",
                image: "images/pizzza.png",
                description: "Loaded with fresh vegetables and delicious toppings.",
                price: 329,
                rating: 4.3
            }
        ]
    },


    burger: {
        title: "Burgers",
        icon: "🍔",
        description: "Juicy burgers available in Ongole.",
        items: [
            {
                name: "Classic Chicken Burger",
                restaurant: "KFC",
                image: "images/burger.png",
                description: "Juicy chicken patty with fresh vegetables and sauce.",
                price: 199,
                rating: 4.1
            },
            {
                name: "Veg Burger",
                restaurant: "Food Stories",
                image: "images/burger.png",
                description: "Crispy vegetable patty with fresh lettuce and sauces.",
                price: 149,
                rating: 4.0
            }
        ]
    },


    biryani: {
        title: "Biryani",
        icon: "🍛",
        description: "Aromatic biryani and rice dishes from Ongole restaurants.",
        items: [
            {
                name: "Chicken Biryani",
                restaurant: "V Grand Family Restaurant",
                image: "images/biriyani.png",
                description: "Fragrant basmati rice cooked with tender chicken and spices.",
                price: 299,
                rating: 4.3
            },
            {
                name: "Mutton Biryani",
                restaurant: "Ismail Restaurant",
                image: "images/biriyani.png",
                description: "Rich and flavorful mutton biryani prepared with traditional spices.",
                price: 399,
                rating: 4.2
            }
        ]
    },


    chinese: {
        title: "Chinese",
        icon: "🥢",
        description: "Popular Chinese dishes available in Ongole.",
        items: [
            {
                name: "Chicken Fried Rice",
                restaurant: "V Grand Family Restaurant",
                image: "images/chinese.png",
                description: "Flavorful fried rice with chicken and fresh vegetables.",
                price: 229,
                rating: 4.1
            },
            {
                name: "Veg Noodles",
                restaurant: "Prakriti Multicuisine Restaurant",
                image: "images/chinese.png",
                description: "Stir-fried noodles with fresh vegetables and sauces.",
                price: 179,
                rating: 4.0
            }
        ]
    },


    "south-indian": {
        title: "South Indian",
        icon: "🥘",
        description: "Traditional South Indian dishes available in Ongole.",
        items: [
            {
                name: "Masala Dosa",
                restaurant: "Subhadra Tiffin Center",
                image: "images/south indian.png",
                description: "Crispy dosa served with potato masala, chutney and sambar.",
                price: 99,
                rating: 4.4
            },
            {
                name: "Idli Vada",
                restaurant: "Gandhi Tiffin Center",
                image: "images/south indian.png",
                description: "Soft idlis and crispy vada served with chutney and sambar.",
                price: 89,
                rating: 4.3
            }
        ]
    },


    "north-indian": {
        title: "North Indian",
        icon: "🫓",
        description: "North Indian curries, naan and special dishes.",
        items: [
            {
                name: "Paneer Butter Masala",
                restaurant: "Prakriti Multicuisine Restaurant",
                image: "images/northindian.png",
                description: "Creamy tomato-based curry with soft paneer.",
                price: 249,
                rating: 4.2
            },
            {
                name: "Butter Naan",
                restaurant: "V Grand Family Restaurant",
                image: "images/northindian.png",
                description: "Soft naan topped with butter and served hot.",
                price: 79,
                rating: 4.1
            }
        ]
    },


    desserts: {
        title: "Desserts",
        icon: "🍰",
        description: "Sweet treats and desserts available in Ongole.",
        items: [
            {
                name: "Chocolate Cake",
                restaurant: "NIC Ice Creams",
                image: "images/desserts.png",
                description: "Rich chocolate dessert perfect after a meal.",
                price: 149,
                rating: 4.4
            },
            {
                name: "Ice Cream Sundae",
                restaurant: "NIC Ice Creams",
                image: "images/desserts.png",
                description: "Creamy ice cream served with delicious toppings.",
                price: 129,
                rating: 4.5
            }
        ]
    },


    beverages: {
        title: "Beverages",
        icon: "🥤",
        description: "Refreshing drinks, juices and shakes in Ongole.",
        items: [
            {
                name: "Mango Shake",
                restaurant: "Swara Cafe",
                image: "images/beverages.png",
                description: "Refreshing mango shake made with fresh mangoes.",
                price: 129,
                rating: 4.2
            },
            {
                name: "Fresh Lime Juice",
                restaurant: "Swara Cafe",
                image: "images/beverages.png",
                description: "Fresh and refreshing lime juice.",
                price: 79,
                rating: 4.1
            }
        ]
    }

};


// GET CATEGORY FROM URL

const params = new URLSearchParams(window.location.search);

const category = params.get("category") || "pizza";

const data = foodData[category];


// UPDATE PAGE

if (data) {

    document.getElementById("categoryTitle").textContent =
        data.title;

    document.getElementById("categoryIcon").textContent =
        data.icon;

    document.getElementById("categoryDescription").textContent =
        data.description;


    const container =
        document.getElementById("foodItems");


    data.items.forEach(item => {

        container.innerHTML += `

            <div class="col-md-6 col-lg-4">

                <div class="food-card">

                    <img src="${item.image}"
                         alt="${item.name}">

                    <div class="food-content">

                        <h3>
                            ${item.name}
                        </h3>

                        <div class="restaurant-name">
                            <i class="bi bi-shop"></i>
                            ${item.restaurant}
                        </div>

                        <p class="food-description">
                            ${item.description}
                        </p>

                        <div class="rating">
                            ⭐ ${item.rating}
                        </div>

                        <div class="food-price">
                            ₹${item.price}
                        </div>

                        <a href="menu.html"
                           class="order-btn">
                            View Menu
                            <i class="bi bi-arrow-right"></i>
                        </a>

                    </div>

                </div>

            </div>

        `;

    });

}