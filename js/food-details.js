const foodData = {
    pizza: {
        title: "Pizza",
        items: [
            {
                name: "Chicken Pizza",
                restaurant: "Pizza Hut",
                price: 299,
                image: "images/pizzza.png"
            },
            {
                name: "Veg Pizza",
                restaurant: "Food Stories",
                price: 249,
                image: "images/pizzza.png"
            }
        ]
    },

    burger: {
        title: "Burger",
        items: [
            {
                name: "Chicken Burger",
                restaurant: "KFC",
                price: 199,
                image: "images/burger.png"
            },
            {
                name: "Veg Burger",
                restaurant: "Food Stories",
                price: 149,
                image: "images/burger.png"
            }
        ]
    },

    biryani: {
        title: "Biryani",
        items: [
            {
                name: "Chicken Biryani",
                restaurant: "V Grand Family Restaurant",
                price: 280,
                image: "images/biriyani.png"
            },
            {
                name: "Mutton Biryani",
                restaurant: "Ismail Restaurant",
                price: 350,
                image: "images/biriyani.png"
            }
        ]
    },

    chinese: {
        title: "Chinese",
        items: [
            {
                name: "Chicken Noodles",
                restaurant: "V Grand Family Restaurant",
                price: 220,
                image: "images/chinese.png"
            },
            {
                name: "Veg Manchurian",
                restaurant: "Prakriti Multicuisine Restaurant",
                price: 180,
                image: "images/chinese.png"
            }
        ]
    },

    "south-indian": {
        title: "South Indian",
        items: [
            {
                name: "Masala Dosa",
                restaurant: "Subhadra Tiffin Center",
                price: 80,
                image: "images/south indian.png"
            },
            {
                name: "Idli",
                restaurant: "Gandhi Tiffin Center",
                price: 60,
                image: "images/south indian.png"
            }
        ]
    },

    "north-indian": {
        title: "North Indian",
        items: [
            {
                name: "Butter Chicken",
                restaurant: "Prakriti Multicuisine Restaurant",
                price: 280,
                image: "images/northindian.png"
            },
            {
                name: "Paneer Butter Masala",
                restaurant: "V Grand Family Restaurant",
                price: 240,
                image: "images/northindian.png"
            }
        ]
    },

    desserts: {
        title: "Desserts",
        items: [
            {
                name: "Chocolate Ice Cream",
                restaurant: "NIC Ice Creams",
                price: 120,
                image: "images/desserts.png"
            },
            {
                name: "Vanilla Ice Cream",
                restaurant: "NIC Ice Creams",
                price: 100,
                image: "images/desserts.png"
            }
        ]
    },

    beverages: {
        title: "Beverages",
        items: [
            {
                name: "Cold Coffee",
                restaurant: "Swara Cafe",
                price: 140,
                image: "images/beverages.png"
            },
            {
                name: "Fresh Lime Soda",
                restaurant: "Swara Cafe",
                price: 90,
                image: "images/beverages.png"
            }
        ]
    }
};


const params = new URLSearchParams(window.location.search);
const category = params.get("category");

const categoryData = foodData[category];

const title = document.getElementById("categoryTitle");
const container = document.getElementById("foodItems");

if (categoryData) {

    title.textContent = categoryData.title;

    categoryData.items.forEach(item => {

        container.innerHTML += `
            <div class="food-card">

                <img src="${item.image}" alt="${item.name}">

                <div class="food-content">

                    <h2>${item.name}</h2>

                    <p class="restaurant">
                        ${item.restaurant}, Ongole
                    </p>

                    <p class="price">
                        ₹${item.price}
                    </p>

                    <button onclick="addToCart('${item.name}', ${item.price})">
                        Add to Cart
                    </button>

                </div>

            </div>
        `;
    });

} else {

    title.textContent = "Category Not Found";

    container.innerHTML = `
        <p>Sorry, this food category could not be found.</p>
    `;
}


function addToCart(name, price) {
    alert(`${name} added to cart!`);
}