-- FoodieHub: Ongole Restaurant Bulk Seed
-- Based on the final foodiehub_connection Django schema.
-- This file ADDS restaurants/menu items and does NOT delete existing users,
-- orders, reservations, or the existing Spice Symphony restaurant.
--
-- IMPORTANT:
-- Restaurant names/locations/cuisine are based on current Ongole listings.
-- Where a current public menu price was available, it is used below.
-- Where a public menu/price was not available in the research pass, the
-- menu is marked as PROJECT SEED DATA in the comments and should be verified
-- before treating it as a current real-world price.
--
-- Compatible tables:
--   restaurant_restaurant
--   restaurant_menuitem
--
-- Run:
--   mysql -u root -p foodiehub < ongole_restaurants_bulk.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;
START TRANSACTION;

-- ============================================================
-- 1. RESTAURANTS
-- ============================================================

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'V Grand Family Restaurant',
       'Biryani, Chinese, South Indian', 4.2, 18000, '₹₹', 'Gopal Nagar, Ongole',
       'Family restaurant in Ongole serving biryani, Chinese and South Indian dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='V Grand Family Restaurant');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Hotel Paradise',
       'Biryani, North Indian, South Indian', 4.2, 29000, '₹₹', 'Venkateswara Nagar, Ongole',
       'Popular Ongole restaurant serving biryani, North Indian and South Indian dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Hotel Paradise');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Prakriti Multicuisine Restaurant',
       'Biryani, Chinese', 4.2, 0, '₹₹', 'Bhagya Nagar, Ongole',
       'Multicuisine restaurant in Ongole offering biryani and Chinese dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Prakriti Multicuisine Restaurant');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Bilal Multi Cuisine Restaurant',
       'Biryani, North Indian, Chinese, Tandoor', 0, 0, '₹₹', 'Vantavari Colony, Ongole',
       'Multicuisine restaurant offering biryani, North Indian, Chinese and tandoor dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Bilal Multi Cuisine Restaurant');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Alif Hyderabad Kachi Dum Biryani',
       'Biryani', 4.2, 0, '₹₹', 'Bhagya Nagar, Ongole',
       'Hyderabad-style kachi dum biryani restaurant in Ongole.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Alif Hyderabad Kachi Dum Biryani');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Bismillah Hyderabad Dum Biryani',
       'Biryani', 0, 0, '₹₹', 'Mangamuru Road, Ongole',
       'Hyderabad-style dum biryani restaurant in Ongole.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Bismillah Hyderabad Dum Biryani');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Vicky Micky Kitchen Family Restaurant',
       'Chinese, Biryani', 4.0, 117, '₹₹', 'Janardhan Nagar, Ongole',
       'Family restaurant serving biryani, curries and Chinese dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Vicky Micky Kitchen Family Restaurant');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Kritunga',
       'Biryani, Andhra, South Indian, North Indian', 0, 0, '₹₹', 'Annavarappadu, Ongole',
       'Andhra-focused restaurant with biryani, South Indian and North Indian dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Kritunga');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'R R Garden Restaurant',
       'Biryani', 4.1, 1900, '₹₹', 'Venkateswara Nagar, Ongole',
       'Ongole restaurant known for biryani, starters and Indian breads.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='R R Garden Restaurant');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Sri Himaja Tiffins and Catering',
       'South Indian', 4.2, 1000, '₹', 'Trunk Road, Ongole',
       'South Indian tiffin and catering restaurant in Ongole.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Sri Himaja Tiffins and Catering');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Lasya Grand Restaurant',
       'Indian, Andhra, Biryani', 0, 0, '₹₹', 'Sri Ram Colony, Sujatha Nagar, Ongole',
       'Grand restaurant serving Indian and Andhra dishes including pulaos and starters.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Lasya Grand Restaurant');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Ismail Biryani',
       'Biryani', 0, 0, '₹₹', 'Ongole',
       'Local biryani restaurant in Ongole.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Ismail Biryani');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Lakshmi Pulka Point',
       'Andhra, Chinese', 0, 0, '₹₹', 'Mangamooru Road, Janardhan Nagar, Ongole',
       'Indian restaurant serving Andhra curries, breads and Chinese-style dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Lakshmi Pulka Point');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'RS Punjabi Family Dabha Gardens',
       'North Indian, Andhra, South Indian', 0, 0, '₹₹', 'Sivaji Nagar, Ongole',
       'Family dhaba serving Punjabi, Andhra and South Indian dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='RS Punjabi Family Dabha Gardens');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Hotel Sarovar',
       'Biryani, South Indian', 0, 0, '₹₹', 'Bhagya Samatha Nagar, Ongole',
       'Hotel restaurant serving biryani and South Indian dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Hotel Sarovar');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Mawa''s Kitchen',
       'North Indian, Biryani, Chinese', 0, 0, '₹₹', 'Ongole',
       'Kitchen-style restaurant offering North Indian, biryani and Chinese dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Mawa''s Kitchen');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Gita''s Kitchen',
       'North Indian, Chinese, Biryani', 0, 0, '₹₹', 'Janardhan Nagar, Ongole',
       'Restaurant offering North Indian, Chinese and biryani dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Gita''s Kitchen');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Hoskote 4 AM Biryani',
       'Biryani, Kebab, Chinese', 0, 0, '₹₹', 'Janardhan Nagar, Ongole',
       'Late-night biryani restaurant offering biryani and kebab options.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Hoskote 4 AM Biryani');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Avula Vari Vindhu Bhojanam',
       'Chinese, Andhra, South Indian', 4.4, 1700, '₹', 'Janardhan Nagar, Ongole',
       'Andhra-focused restaurant offering meals, tiffins, Chinese dishes and beverages.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Avula Vari Vindhu Bhojanam');

INSERT INTO restaurant_restaurant
(name, cuisine, rating, reviews, price, location, description, image)
SELECT 'Sai Fast Foods',
       'South Indian, Fast Food', 0, 0, '₹', 'Ongole',
       'Local fast-food restaurant serving South Indian and quick-service dishes.',
       ''
WHERE NOT EXISTS (SELECT 1 FROM restaurant_restaurant WHERE name='Sai Fast Foods');

-- ============================================================
-- 2. MENU ITEMS
-- ============================================================

-- ============================================================
-- CLEAN RESEED: remove only the seeded menu rows for these 20
-- Ongole restaurants before inserting the verified/project menu.
-- This prevents old partial imports from making menus appear duplicated.
-- ============================================================
DELETE FROM restaurant_menuitem
WHERE restaurant_id IN (
    SELECT id FROM restaurant_restaurant WHERE name IN (
        'V Grand Family Restaurant',
        'Hotel Paradise',
        'Prakriti Multicuisine Restaurant',
        'Bilal Multi Cuisine Restaurant',
        'Alif Hyderabad Kachi Dum Biryani',
        'Bismillah Hyderabad Dum Biryani',
        'Vicky Micky Kitchen Family Restaurant',
        'Kritunga',
        'R R Garden Restaurant',
        'Sri Himaja Tiffins and Catering',
        'Lasya Grand Restaurant',
        'Ismail Biryani',
        'Lakshmi Pulka Point',
        'RS Punjabi Family Dabha Gardens',
        'Hotel Sarovar',
        'Mawa''s Kitchen',
        'Gita''s Kitchen',
        'Hoskote 4 AM Biryani',
        'Avula Vari Vindhu Bhojanam',
        'Sai Fast Foods'
    )
);


-- Menu items are inserted by restaurant NAME, so this script does
-- not depend on any particular auto-increment restaurant IDs.

-- V GRAND FAMILY RESTAURANT (publicly listed menu prices)
INSERT INTO restaurant_menuitem (restaurant_id,name,category,description,price,image,available)
SELECT r.id,'Veg Sweet Corn Soup','Soups','Vegetable sweet corn soup.',200,'',1 FROM restaurant_restaurant r
WHERE r.name='V Grand Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Sweet Corn Soup');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Hot & Sour Soup','Soups','Hot and sour vegetable soup.',200,'',1 FROM restaurant_restaurant r WHERE r.name='V Grand Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Hot & Sour Soup');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Dragon Soup','Soups','Spicy vegetable dragon soup.',200,'',1 FROM restaurant_restaurant r WHERE r.name='V Grand Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Dragon Soup');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Manchow Soup','Soups','Hot and spicy vegetable manchow soup.',215,'',1 FROM restaurant_restaurant r WHERE r.name='V Grand Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Manchow Soup');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Noodles','Chinese','Vegetable noodles.',280,'',1 FROM restaurant_restaurant r WHERE r.name='V Grand Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Noodles');

-- HOTEL PARADISE (publicly listed menu prices)
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Mushroom Biryani','Biryani','Slow-cooked rice with mushrooms and spices.',350,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Paradise' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Mushroom Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Mutton Biryani','Biryani','Aromatic rice with mutton and spices.',490,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Paradise' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Mutton Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Fish Biryani','Biryani','Aromatic biryani with fish.',415,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Paradise' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Fish Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Prawns Biryani','Biryani','Prawn biryani served with raita and onion.',440,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Paradise' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Prawns Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Biryani','Biryani','Aromatic rice layered with paneer and spices.',360,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Paradise' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Tikka','Tandoori','Tender grilled chicken with spices.',420,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Paradise' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Tikka');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Tandoori Chicken','Tandoori','Tandoori chicken preparation.',420,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Paradise' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Tandoori Chicken');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Butter Masala','Main Course','Paneer in rich tomato-butter gravy.',325,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Paradise' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Butter Masala');

-- PRAKRITI MULTICUISINE RESTAURANT
-- Project seed menu: verify current prices before production use.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Biryani','Biryani','Vegetable biryani.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Prakriti Multicuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Biryani','Biryani','Chicken dum biryani.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Prakriti Multicuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Chilli','Chinese','Chilli paneer starter.',240,'',1 FROM restaurant_restaurant r WHERE r.name='Prakriti Multicuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Chilli');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Gobi Manchurian','Chinese','Crispy cauliflower in Manchurian sauce.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Prakriti Multicuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Gobi Manchurian');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Noodles','Chinese','Chicken noodles.',240,'',1 FROM restaurant_restaurant r WHERE r.name='Prakriti Multicuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Noodles');

-- BILAL MULTI CUISINE RESTAURANT
-- Public listing supports these menu categories/items; prices are project seed values.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Butter Chicken','North Indian','Chicken cooked in creamy butter gravy.',448,'',1 FROM restaurant_restaurant r WHERE r.name='Bilal Multi Cuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Butter Chicken');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Tikka Masala','North Indian','Chicken tikka in spiced gravy.',448,'',1 FROM restaurant_restaurant r WHERE r.name='Bilal Multi Cuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Tikka Masala');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Cheese Burger','Burgers','Chicken burger with cheese.',219,'',1 FROM restaurant_restaurant r WHERE r.name='Bilal Multi Cuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Cheese Burger');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Special Chicken Biryani Family Pack','Biryani','Family-size chicken biryani.',910,'',1 FROM restaurant_restaurant r WHERE r.name='Bilal Multi Cuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Special Chicken Biryani Family Pack');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Tikka','Tandoor','Tandoor paneer starter.',320,'',1 FROM restaurant_restaurant r WHERE r.name='Bilal Multi Cuisine Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Tikka');

-- ALIF HYDERABAD KACHI DUM BIRYANI
-- Public menu names verified; prices are project seed values except where publicly listed.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Dum Biryani','Biryani','Hyderabad-style chicken kachi dum biryani.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Alif Hyderabad Kachi Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Dum Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Fry Biryani','Biryani','Chicken fry biryani.',320,'',1 FROM restaurant_restaurant r WHERE r.name='Alif Hyderabad Kachi Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Fry Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Dum Biryani Family Pack','Biryani','Family pack chicken dum biryani.',620,'',1 FROM restaurant_restaurant r WHERE r.name='Alif Hyderabad Kachi Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Dum Biryani Family Pack');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Dum Biryani 2 Piece','Biryani','Chicken dum biryani with two pieces.',350,'',1 FROM restaurant_restaurant r WHERE r.name='Alif Hyderabad Kachi Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Dum Biryani 2 Piece');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Gongura Chicken Biryani','Biryani','Chicken biryani with gongura flavour.',340,'',1 FROM restaurant_restaurant r WHERE r.name='Alif Hyderabad Kachi Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Gongura Chicken Biryani');

-- BISMILLAH HYDERABAD DUM BIRYANI
-- Project seed menu: verify current prices before production use.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Dum Biryani','Biryani','Hyderabad-style chicken dum biryani.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Bismillah Hyderabad Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Dum Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Fry Biryani','Biryani','Chicken fry biryani.',320,'',1 FROM restaurant_restaurant r WHERE r.name='Bismillah Hyderabad Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Fry Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Mutton Biryani','Biryani','Mutton dum biryani.',420,'',1 FROM restaurant_restaurant r WHERE r.name='Bismillah Hyderabad Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Mutton Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Egg Biryani','Biryani','Egg biryani.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Bismillah Hyderabad Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Egg Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken 65','Starters','Crispy chicken starter.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Bismillah Hyderabad Dum Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken 65');

-- VICKY MICKY KITCHEN FAMILY RESTAURANT (publicly listed prices)
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Dum Biryani','Biryani','Chicken dum biryani.',130,'',1 FROM restaurant_restaurant r WHERE r.name='Vicky Micky Kitchen Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Dum Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Fry Biryani','Biryani','Chicken fry biryani.',180,'',1 FROM restaurant_restaurant r WHERE r.name='Vicky Micky Kitchen Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Fry Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Bagara Rice','Rice','Bagara rice.',155,'',1 FROM restaurant_restaurant r WHERE r.name='Vicky Micky Kitchen Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Bagara Rice');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Fish Biryani','Biryani','Fish biryani.',390,'',1 FROM restaurant_restaurant r WHERE r.name='Vicky Micky Kitchen Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Fish Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Prawns Biryani','Biryani','Prawns biryani.',325,'',1 FROM restaurant_restaurant r WHERE r.name='Vicky Micky Kitchen Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Prawns Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Andhra Chicken','Curries','Andhra-style chicken curry.',365,'',1 FROM restaurant_restaurant r WHERE r.name='Vicky Micky Kitchen Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Andhra Chicken');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Curry','Curries','Chicken curry.',325,'',1 FROM restaurant_restaurant r WHERE r.name='Vicky Micky Kitchen Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Curry');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer 65','Veg Starters','Crispy paneer starter.',310,'',1 FROM restaurant_restaurant r WHERE r.name='Vicky Micky Kitchen Family Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer 65');

-- KRITUNGA
-- Project seed menu based on the publicly listed menu categories.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Andhra Meals','South Indian','Traditional Andhra-style meal.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Kritunga' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Andhra Meals');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Biryani','Biryani','Andhra-style chicken biryani.',320,'',1 FROM restaurant_restaurant r WHERE r.name='Kritunga' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Mutton Biryani','Biryani','Mutton biryani.',420,'',1 FROM restaurant_restaurant r WHERE r.name='Kritunga' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Mutton Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Curry','Curries','Paneer curry.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Kritunga' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Curry');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Fry','Starters','Andhra chicken fry.',320,'',1 FROM restaurant_restaurant r WHERE r.name='Kritunga' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Fry');

-- R R GARDEN RESTAURANT (publicly listed prices)
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Kaju Biryani','Biryani','Kaju biryani.',345,'',1 FROM restaurant_restaurant r WHERE r.name='R R Garden Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Kaju Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Special Veg Biryani','Biryani','Special vegetable biryani.',345,'',1 FROM restaurant_restaurant r WHERE r.name='R R Garden Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Special Veg Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Kaju Paneer Biryani','Biryani','Kaju and paneer biryani.',365,'',1 FROM restaurant_restaurant r WHERE r.name='R R Garden Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Kaju Paneer Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Rr Special Biryani','Biryani','Restaurant special biryani.',425,'',1 FROM restaurant_restaurant r WHERE r.name='R R Garden Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Rr Special Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Gobi 65','Veg Starters','Crispy gobi starter.',245,'',1 FROM restaurant_restaurant r WHERE r.name='R R Garden Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Gobi 65');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer 65','Veg Starters','Crispy paneer starter.',325,'',1 FROM restaurant_restaurant r WHERE r.name='R R Garden Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer 65');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Pulka','Roti','Soft pulka.',30,'',1 FROM restaurant_restaurant r WHERE r.name='R R Garden Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Pulka');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Rumali Roti','Roti','Soft rumali roti.',70,'',1 FROM restaurant_restaurant r WHERE r.name='R R Garden Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Rumali Roti');

-- SRI HIMAJA TIFFINS AND CATERING (publicly listed Upma Dosa price)
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Upma Dosa','Tiffins','Dosa with upma filling.',85,'',1 FROM restaurant_restaurant r WHERE r.name='Sri Himaja Tiffins and Catering' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Upma Dosa');
-- Project seed menu for remaining tiffin items.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Idly','Tiffins','Soft steamed idly.',60,'',1 FROM restaurant_restaurant r WHERE r.name='Sri Himaja Tiffins and Catering' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Idly');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Masala Dosa','Tiffins','Crispy dosa with potato masala.',90,'',1 FROM restaurant_restaurant r WHERE r.name='Sri Himaja Tiffins and Catering' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Masala Dosa');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Vada','Tiffins','Crispy South Indian vada.',60,'',1 FROM restaurant_restaurant r WHERE r.name='Sri Himaja Tiffins and Catering' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Vada');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Poori','Tiffins','Poori with potato curry.',80,'',1 FROM restaurant_restaurant r WHERE r.name='Sri Himaja Tiffins and Catering' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Poori');

-- LASYA GRAND RESTAURANT (publicly listed prices)
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Pulao','Pulaos','Rice and paneer pulao.',360,'',1 FROM restaurant_restaurant r WHERE r.name='Lasya Grand Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Pulao');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Mushroom Pulao','Pulaos','Mushroom pulao.',350,'',1 FROM restaurant_restaurant r WHERE r.name='Lasya Grand Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Mushroom Pulao');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Kaju Pulao','Pulaos','Cashew pulao.',380,'',1 FROM restaurant_restaurant r WHERE r.name='Lasya Grand Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Kaju Pulao');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Pulao','Pulaos','Chicken pulao.',400,'',1 FROM restaurant_restaurant r WHERE r.name='Lasya Grand Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Pulao');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Prawns Pulao','Pulaos','Prawns pulao.',460,'',1 FROM restaurant_restaurant r WHERE r.name='Lasya Grand Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Prawns Pulao');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken 65','Starters','Chicken 65 starter.',345,'',1 FROM restaurant_restaurant r WHERE r.name='Lasya Grand Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken 65');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Masala Kulcha','Indian Breads','Masala stuffed kulcha.',110,'',1 FROM restaurant_restaurant r WHERE r.name='Lasya Grand Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Masala Kulcha');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Pulka','Indian Breads','Soft pulka.',33,'',1 FROM restaurant_restaurant r WHERE r.name='Lasya Grand Restaurant' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Pulka');

-- ISMAIL BIRYANI
-- Project seed menu: verify current prices before production use.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Biryani','Biryani','Chicken biryani.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Ismail Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Mutton Biryani','Biryani','Mutton biryani.',420,'',1 FROM restaurant_restaurant r WHERE r.name='Ismail Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Mutton Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Egg Biryani','Biryani','Egg biryani.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Ismail Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Egg Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken 65','Starters','Chicken 65.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Ismail Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken 65');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Fry','Starters','Chicken fry.',300,'',1 FROM restaurant_restaurant r WHERE r.name='Ismail Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Fry');

-- LAKSHMI PULKA POINT (publicly listed menu names/prices for selected dishes)
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Curry','Curries','Chicken curry.',192,'',1 FROM restaurant_restaurant r WHERE r.name='Lakshmi Pulka Point' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Curry');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Andhra Chicken','Curries','Andhra-style chicken preparation.',224,'',1 FROM restaurant_restaurant r WHERE r.name='Lakshmi Pulka Point' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Andhra Chicken');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Maharani Chicken','Curries','Maharani chicken preparation.',240,'',1 FROM restaurant_restaurant r WHERE r.name='Lakshmi Pulka Point' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Maharani Chicken');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Punjabi Chicken','Curries','Punjabi-style chicken preparation.',240,'',1 FROM restaurant_restaurant r WHERE r.name='Lakshmi Pulka Point' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Punjabi Chicken');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Pulka','Roti','Soft pulka.',35,'',1 FROM restaurant_restaurant r WHERE r.name='Lakshmi Pulka Point' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Pulka');

-- RS PUNJABI FAMILY DABHA GARDENS
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Boneless Andhra Chicken Curry','Curries','Andhra-style boneless chicken curry.',340,'',1 FROM restaurant_restaurant r WHERE r.name='RS Punjabi Family Dabha Gardens' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Boneless Andhra Chicken Curry');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Kadai Chicken','Curries','Kadai chicken.',310,'',1 FROM restaurant_restaurant r WHERE r.name='RS Punjabi Family Dabha Gardens' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Kadai Chicken');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Egg Biryani','Biryani','Egg biryani.',220,'',1 FROM restaurant_restaurant r WHERE r.name='RS Punjabi Family Dabha Gardens' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Egg Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Kaju Curry','Curries','Cashew curry.',260,'',1 FROM restaurant_restaurant r WHERE r.name='RS Punjabi Family Dabha Gardens' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Kaju Curry');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Dal Fry','Curries','Yellow dal fry.',100,'',1 FROM restaurant_restaurant r WHERE r.name='RS Punjabi Family Dabha Gardens' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Dal Fry');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Lollipop Biryani','Biryani','Chicken lollipop biryani.',340,'',1 FROM restaurant_restaurant r WHERE r.name='RS Punjabi Family Dabha Gardens' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Lollipop Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Biryani','Biryani','Vegetable biryani.',220,'',1 FROM restaurant_restaurant r WHERE r.name='RS Punjabi Family Dabha Gardens' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Biryani');

-- HOTEL SAROVAR
-- Project seed menu: verify current prices before production use.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Biryani','Biryani','Chicken biryani.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Sarovar' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Biryani','Biryani','Vegetable biryani.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Sarovar' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Masala Dosa','South Indian','Masala dosa.',90,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Sarovar' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Masala Dosa');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Idly','South Indian','Steamed idly.',60,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Sarovar' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Idly');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Curry','Curries','Paneer curry.',240,'',1 FROM restaurant_restaurant r WHERE r.name='Hotel Sarovar' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Curry');

-- MAWA'S KITCHEN
-- Project seed menu: verify current prices before production use.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Biryani','Biryani','Chicken biryani.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Mawa''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Butter Masala','North Indian','Paneer in tomato butter gravy.',260,'',1 FROM restaurant_restaurant r WHERE r.name='Mawa''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Butter Masala');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Noodles','Chinese','Chicken noodles.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Mawa''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Noodles');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Manchurian','Chinese','Vegetable Manchurian.',200,'',1 FROM restaurant_restaurant r WHERE r.name='Mawa''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Manchurian');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Garlic Naan','Breads','Garlic naan.',90,'',1 FROM restaurant_restaurant r WHERE r.name='Mawa''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Garlic Naan');

-- GITA'S KITCHEN
-- Project seed menu: verify current prices before production use.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Biryani','Biryani','Chicken biryani.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Gita''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Biryani','Biryani','Vegetable biryani.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Gita''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chilli Paneer','Chinese','Chilli paneer.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Gita''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chilli Paneer');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Manchurian','Chinese','Chicken Manchurian.',260,'',1 FROM restaurant_restaurant r WHERE r.name='Gita''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Manchurian');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Paneer Curry','North Indian','Paneer curry.',240,'',1 FROM restaurant_restaurant r WHERE r.name='Gita''s Kitchen' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Paneer Curry');

-- HOSKOTE 4 AM BIRYANI
-- Public listing confirms mutton dum biryani/family-pack style offerings.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Mutton Dum Biryani 1000ml','Biryani','Mutton dum biryani 1000ml.',525,'',1 FROM restaurant_restaurant r WHERE r.name='Hoskote 4 AM Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Mutton Dum Biryani 1000ml');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Dum Biryani','Biryani','Chicken dum biryani.',300,'',1 FROM restaurant_restaurant r WHERE r.name='Hoskote 4 AM Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Dum Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Fry Biryani','Biryani','Chicken fry biryani.',330,'',1 FROM restaurant_restaurant r WHERE r.name='Hoskote 4 AM Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Fry Biryani');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Kebab','Kebab','Chicken kebab.',280,'',1 FROM restaurant_restaurant r WHERE r.name='Hoskote 4 AM Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Kebab');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Egg Biryani','Biryani','Egg biryani.',220,'',1 FROM restaurant_restaurant r WHERE r.name='Hoskote 4 AM Biryani' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Egg Biryani');

-- AVULA VARI VINDHU BHOJANAM (publicly listed menu prices)
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Dry Fruit Milk Shake','Milk Shakes','Dry fruit milk shake.',180,'',1 FROM restaurant_restaurant r WHERE r.name='Avula Vari Vindhu Bhojanam' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Dry Fruit Milk Shake');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Oreo Milk Shake','Milk Shakes','Oreo milk shake.',160,'',1 FROM restaurant_restaurant r WHERE r.name='Avula Vari Vindhu Bhojanam' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Oreo Milk Shake');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Mashroom Masala Dosa','Tiffins','Mushroom masala dosa.',129,'',1 FROM restaurant_restaurant r WHERE r.name='Avula Vari Vindhu Bhojanam' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Mashroom Masala Dosa');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Parota','Tiffins','Parota.',79,'',1 FROM restaurant_restaurant r WHERE r.name='Avula Vari Vindhu Bhojanam' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Parota');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chapathi','Tiffins','Chapathi.',79,'',1 FROM restaurant_restaurant r WHERE r.name='Avula Vari Vindhu Bhojanam' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chapathi');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Curd Rice','Rice','Curd rice.',80,'',1 FROM restaurant_restaurant r WHERE r.name='Avula Vari Vindhu Bhojanam' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Curd Rice');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Plain Roti','Roties','Plain roti.',39,'',1 FROM restaurant_restaurant r WHERE r.name='Avula Vari Vindhu Bhojanam' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Plain Roti');

-- SAI FAST FOODS
-- Project seed menu: verify current prices before production use.
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Fried Rice','Fast Food','Vegetable fried rice.',160,'',1 FROM restaurant_restaurant r WHERE r.name='Sai Fast Foods' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Fried Rice');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Fried Rice','Fast Food','Chicken fried rice.',200,'',1 FROM restaurant_restaurant r WHERE r.name='Sai Fast Foods' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Fried Rice');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Veg Noodles','Fast Food','Vegetable noodles.',150,'',1 FROM restaurant_restaurant r WHERE r.name='Sai Fast Foods' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Veg Noodles');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Chicken Noodles','Fast Food','Chicken noodles.',190,'',1 FROM restaurant_restaurant r WHERE r.name='Sai Fast Foods' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Chicken Noodles');
INSERT INTO restaurant_menuitem (id,restaurant_id,name,category,description,price,image,available) SELECT NULL,r.id,'Gobi Manchurian','Starters','Gobi Manchurian.',150,'',1 FROM restaurant_restaurant r WHERE r.name='Sai Fast Foods' AND NOT EXISTS (SELECT 1 FROM restaurant_menuitem m WHERE m.restaurant_id=r.id AND m.name='Gobi Manchurian');

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT id, name, cuisine, rating, reviews, location
FROM restaurant_restaurant
WHERE name IN (
'V Grand Family Restaurant','Hotel Paradise','Prakriti Multicuisine Restaurant',
'Bilal Multi Cuisine Restaurant','Alif Hyderabad Kachi Dum Biryani',
'Bismillah Hyderabad Dum Biryani','Vicky Micky Kitchen Family Restaurant',
'Kritunga','R R Garden Restaurant','Sri Himaja Tiffins and Catering',
'Lasya Grand Restaurant','Ismail Biryani','Lakshmi Pulka Point',
'RS Punjabi Family Dabha Gardens','Hotel Sarovar','Mawa''s Kitchen',
'Gita''s Kitchen','Hoskote 4 AM Biryani','Avula Vari Vindhu Bhojanam',
'Sai Fast Foods'
)
ORDER BY id;

SELECT r.name AS restaurant, COUNT(m.id) AS menu_items
FROM restaurant_restaurant r
LEFT JOIN restaurant_menuitem m ON m.restaurant_id=r.id
WHERE r.name IN (
'V Grand Family Restaurant','Hotel Paradise','Prakriti Multicuisine Restaurant',
'Bilal Multi Cuisine Restaurant','Alif Hyderabad Kachi Dum Biryani',
'Bismillah Hyderabad Dum Biryani','Vicky Micky Kitchen Family Restaurant',
'Kritunga','R R Garden Restaurant','Sri Himaja Tiffins and Catering',
'Lasya Grand Restaurant','Ismail Biryani','Lakshmi Pulka Point',
'RS Punjabi Family Dabha Gardens','Hotel Sarovar','Mawa''s Kitchen',
'Gita''s Kitchen','Hoskote 4 AM Biryani','Avula Vari Vindhu Bhojanam',
'Sai Fast Foods'
)
GROUP BY r.id, r.name
ORDER BY r.id;
