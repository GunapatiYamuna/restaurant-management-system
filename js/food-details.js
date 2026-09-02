const foodData = {
    pizza: {
        title: "Pizza",
        items: [
            {
                name: "Chicken Pizza",
                price: 299,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chicken_Pizza_1.jpg"
            },
            {
                name: "Veg Pizza",
                price: 249,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Vegetable_pizza_anyone%3F.jpg"
            }
        ]
    },

    burger: {
        title: "Burger",
        items: [
            {
                name: "Chicken Burger",
                price: 199,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fried_chicken_burger_.jpg"
            },
            {
                name: "Veg Burger",
                price: 149,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Veg._Burger.JPG"
            }
        ]
    },

    biryani: {
        title: "Biryani",
        items: [
            {
                name: "Chicken Biryani",
                price: 280,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chicken_biryani_%288528798038%29.jpg"
            },
            {
                name: "Mutton Biryani",
                price: 350,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mutton_biryani.JPG"
            }
        ]
    },

    chinese: {
        title: "Chinese",
        items: [
            {
                name: "Chicken Noodles",
                price: 220,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chicken_noodles.jpg"
            },
            {
                name: "Veg Manchurian",
                price: 180,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Manchurian.jpg"
            }
        ]
    },

    "south-indian": {
        title: "South Indian",
        items: [
            {
                name: "Masala Dosa",
                price: 80,
                image: "images/south indian.png"
            },
            {
                name: "Idli",
                price: 60,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Idli_%28South_Indian_dish%29.jpg"
            }
        ]
    },

    "north-indian": {
        title: "North Indian",
        items: [
            {
                name: "Butter Chicken",
                price: 280,
                image: "images/northindian.png"
            },
            {
                name: "Paneer Butter Masala",
                price: 240,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Paneer_Butter_Masala_%289243456289%29.jpg"
            }
        ]
    },

    desserts: {
        title: "Desserts",
        items: [
            {
                name: "Chocolate Ice Cream",
                price: 120,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chocolate_Ice_Cream.jpg"
            },
            {
                name: "Vanilla Ice Cream",
                price: 100,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Vanilla_Ice_Cream.jpg"
            }
        ]
    },

    beverages: {
        title: "Beverages",
        items: [
            {
                name: "Cold Coffee",
                price: 140,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cold_coffee_%2820042%29.jpg"
            },
            {
                name: "Fresh Lime Soda",
                price: 90,
                image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fresh_Lime.JPG"
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