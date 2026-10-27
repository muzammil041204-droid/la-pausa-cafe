// Starter menu built from the La Pausa Caffè poster. Prices are placeholders —
// the owner can change everything from /admin.

export const seedSettings = {
  id: 1,
  cafe_name: 'La Pausa Caffè',
  tagline: 'Take a pause. Stay a while.',
  offer_text: 'Buy 1 Get 1 on all shakes',
  note_text: 'Bulk orders taken for events · Birthday parties & special events organised',
  phone: '',
  instagram: '',
  address: 'Ooty, Tamil Nadu',
  maps_url:
    'https://www.google.com/maps/place/La+Pausa+Caffe/@11.4159248,76.6830996,17z',
}

export const seedCategories = [
  { id: 'burgers', name: 'Burgers', script: 'Stacked', sort: 1 },
  { id: 'sandwiches', name: 'Sandwiches', script: 'Grilled', sort: 2 },
  { id: 'fries-nuggets', name: 'Fries & Nuggets', script: 'Crispy', sort: 3 },
  { id: 'momos', name: 'Momos', script: 'Steamed', sort: 4 },
  { id: 'maggi-omelette', name: 'Maggi & Omelette', script: 'Comfort', sort: 5 },
  { id: 'hot-drinks', name: 'Hot Drinks', script: 'Freshly brewed', sort: 6 },
  { id: 'shakes-juices', name: 'Shakes & Juices', script: 'Chilled', sort: 7 },
  { id: 'desserts', name: 'Desserts', script: 'Sweet', sort: 8 },
]

const img = (name) => `/menu/${name}.webp`

// [id, category, script word, name, description, price, old price, veg, image]
const rows = [
  ['veg-burger', 'burgers', 'Classic', 'Veg Burger', 'Crispy veg patty, lettuce, tomato and house mayo in a soft toasted bun.', 99, null, true, img('veg-burger')],
  ['veg-cheese-burger', 'burgers', 'Cheesy', 'Veg Cheese Burger', 'Our veg burger loaded with a melting cheese slice, onions and tangy sauce.', 119, null, true, img('veg-burger-with-cheese')],
  ['paneer-burger', 'burgers', 'Spiced', 'Paneer Burger', 'Golden fried paneer patty with mint mayo, onions and fresh lettuce.', 129, null, true, img('paneer-burger')],
  ['chicken-burger', 'burgers', 'Crispy', 'Chicken Burger', 'Crunchy fried chicken fillet, cheese, slaw and our signature burger sauce.', 149, 179, false, img('chicken-burger')],

  ['veg-sandwich', 'sandwiches', 'Grilled', 'Veg Sandwich', 'Cucumber, tomato, onion and capsicum with green chutney, grilled golden.', 89, null, true, img('veg-sandwich')],
  ['cheese-sandwich', 'sandwiches', 'Melty', 'Cheese Sandwich', 'Loaded with cheese and grilled until it stretches with every bite.', 99, null, true, img('cheese-sandwich')],
  ['paneer-sandwich', 'sandwiches', 'Tikka', 'Paneer Sandwich', 'Spiced paneer tikka filling with onions and mint mayo, toasted crisp.', 119, null, true, img('paneer-sandwich')],
  ['chicken-sandwich', 'sandwiches', 'Club', 'Chicken Sandwich', 'Creamy shredded chicken, lettuce and pepper mayo between toasted bread.', 139, null, false, img('chicken-sandwich')],

  ['french-fries', 'fries-nuggets', 'Salted', 'French Fries', 'Golden, crispy fries tossed in salt and served with ketchup.', 89, null, true, img('french-fries')],
  ['peri-peri-fries', 'fries-nuggets', 'Spicy', 'Peri Peri Fries', 'Crispy fries dusted with hot and tangy peri peri spice.', 109, null, true, img('peri-peri-french-fries')],
  ['veg-nuggets', 'fries-nuggets', 'Golden', 'Veg Nuggets', 'Bite-sized crumbed veg nuggets, crisp outside and soft inside.', 99, null, true, img('veg-nuggets')],
  ['chicken-nuggets', 'fries-nuggets', 'Crunchy', 'Chicken Nuggets', 'Juicy chicken nuggets fried golden, served with a dip.', 139, null, false, img('chicken-nuggets')],

  ['veg-momos', 'momos', 'Steamed', 'Veg Momos', 'Soft dumplings stuffed with cabbage, carrot and spring onion, with red chutney.', 99, null, true, img('veg-momos')],
  ['paneer-momos', 'momos', 'Steamed', 'Paneer Momos', 'Delicate dumplings filled with spiced paneer, served with spicy chutney.', 119, null, true, img('paneer-momos')],
  ['chicken-momos', 'momos', 'Pan fried', 'Chicken Momos', 'Juicy minced chicken dumplings, served hot with fiery red chutney.', 129, null, false, img('chicken-momos')],

  ['plain-maggi', 'maggi-omelette', 'Simple', 'Plain Maggi', 'The classic masala Maggi, cooked just right.', 59, null, true, img('plain-maggi')],
  ['veg-maggi', 'maggi-omelette', 'Loaded', 'Veg Maggi', 'Masala Maggi tossed with peas, carrot, onion and capsicum.', 79, null, true, img('veg-maggi')],
  ['egg-maggi', 'maggi-omelette', 'Topped', 'Egg Maggi', 'Masala Maggi topped with a sunny side up egg.', 89, null, false, img('egg-maggi')],
  ['chicken-maggi', 'maggi-omelette', 'Hearty', 'Chicken Maggi', 'Masala Maggi cooked with spiced chicken pieces and veggies.', 109, null, false, img('chicken-maggi')],
  ['bread-omelette', 'maggi-omelette', 'Street style', 'Bread Omelette', 'Fluffy masala omelette folded with toasted bread.', 69, null, false, img('bread-omelette')],
  ['chicken-bread-omelette', 'maggi-omelette', 'Loaded', 'Chicken Bread Omelette', 'Masala omelette with shredded chicken, folded in toasted bread.', 109, null, false, img('chicken-bread-omelette')],

  ['coffee', 'hot-drinks', 'Strong', 'Coffee', 'Freshly brewed hot coffee, bold and smooth.', 40, null, true, img('black-coffee')],
  ['cappuccino', 'hot-drinks', 'Frothy', 'Cappuccino', 'Espresso with steamed milk and a thick layer of foam.', 99, null, true, img('cappuccino')],
  ['latte', 'hot-drinks', 'Creamy', 'Latte', 'Espresso with plenty of silky steamed milk.', 109, null, true, null],
  ['hot-chocolate', 'hot-drinks', 'Rich', 'Hot Chocolate', 'Thick, rich hot chocolate topped with cream and chocolate shavings.', 119, null, true, img('hot-chocolate')],
  ['tea', 'hot-drinks', 'Kadak', 'Tea', 'Hot milk tea brewed strong, just the way you like it.', 25, null, true, img('tea')],
  ['chocolate-tea', 'hot-drinks', 'Cosy', 'Chocolate Tea', 'Our milk tea blended with smooth chocolate.', 49, null, true, null],
  ['herbal-tea', 'hot-drinks', 'Soothing', 'Herbal Tea', 'A calming cup of herbal infusion — ask for today\'s blend.', 59, null, true, null],

  ['chocolate-shake', 'shakes-juices', 'Buy 1 Get 1', 'Chocolate Shake', 'Thick chocolate milkshake blended with ice cream.', 129, null, true, null],
  ['oreo-shake', 'shakes-juices', 'Buy 1 Get 1', 'Oreo Shake', 'Cookies and cream shake loaded with crushed Oreos.', 139, null, true, null],
  ['strawberry-shake', 'shakes-juices', 'Buy 1 Get 1', 'Strawberry Shake', 'Creamy strawberry milkshake, sweet and fresh.', 129, null, true, null],
  ['fresh-juice', 'shakes-juices', 'Fresh', 'Fresh Fruit Juice', 'Freshly squeezed seasonal fruit juice.', 89, null, true, null],

  ['ice-cream', 'desserts', 'Scoops', 'Ice Cream', 'Two scoops of your favourite flavour.', 69, null, true, null],
  ['falooda', 'desserts', 'Royal', 'Falooda', 'Rose milk, vermicelli, basil seeds, jelly and ice cream in a tall glass.', 129, null, true, null],
]

export const seedItems = rows.map(([id, category_id, script, name, description, price, old_price, is_veg, image_url], i) => ({
  id,
  category_id,
  script,
  name,
  description,
  price,
  old_price,
  is_veg,
  image_url,
  is_available: true,
  is_hidden: false,
  is_featured: id === 'chicken-burger',
  rating: 4.5,
  sort: i + 1,
}))
