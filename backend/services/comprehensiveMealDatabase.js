/**
 * Comprehensive Meal Database for All 195 Countries
 * - 5 combos × 4 budget classes × 4 meal types = 80 combos per country
 * - Total: 195 countries × 80 combos = 15,600 unique meal combinations
 */

// Country to Open Food Facts mapping
const COUNTRY_TO_OFF_CODE = {
  "Afghanistan": "en:af",
  "Albania": "en:al", 
  "Algeria": "en:dz",
  "Andorra": "en:ad",
  "Angola": "en:ao",
  "Antigua and Barbuda": "en:ag",
  "Argentina": "en:ar",
  "Armenia": "en:am",
  "Australia": "en:au",
  "Austria": "en:at",
  "Azerbaijan": "en:az",
  "Bahamas": "en:bs",
  "Bahrain": "en:bh",
  "Bangladesh": "en:bd",
  "Barbados": "en:bb",
  "Belarus": "en:by",
  "Belgium": "en:be",
  "Belize": "en:bz",
  "Benin": "en:bj",
  "Bhutan": "en:bt",
  "Bolivia": "en:bo",
  "Bosnia and Herzegovina": "en:ba",
  "Botswana": "en:bw",
  "Brazil": "en:br",
  "Brunei": "en:bn",
  "Bulgaria": "en:bg",
  "Burkina Faso": "en:bf",
  "Burundi": "en:bi",
  "Cabo Verde": "en:cv",
  "Cambodia": "en:kh",
  "Cameroon": "en:cm",
  "Canada": "en:ca",
  "Central African Republic": "en:cf",
  "Chad": "en:td",
  "Chile": "en:cl",
  "China": "en:cn",
  "Colombia": "en:co",
  "Comoros": "en:km",
  "Congo, Democratic Republic of the": "en:cd",
  "Congo, Republic of the": "en:cg",
  "Costa Rica": "en:cr",
  "Cote d'Ivoire": "en:ci",
  "Croatia": "en:hr",
  "Cuba": "en:cu",
  "Cyprus": "en:cy",
  "Czechia": "en:cz",
  "Denmark": "en:dk",
  "Djibouti": "en:dj",
  "Dominica": "en:dm",
  "Dominican Republic": "en:do",
  "Ecuador": "en:ec",
  "Egypt": "en:eg",
  "El Salvador": "en:sv",
  "Equatorial Guinea": "en:gq",
  "Eritrea": "en:er",
  "Estonia": "en:ee",
  "Eswatini": "en:sz",
  "Ethiopia": "en:et",
  "Fiji": "en:fj",
  "Finland": "en:fi",
  "France": "en:fr",
  "Gabon": "en:ga",
  "Gambia": "en:gm",
  "Georgia": "en:ge",
  "Germany": "en:de",
  "Ghana": "en:gh",
  "Greece": "en:gr",
  "Grenada": "en:gd",
  "Guatemala": "en:gt",
  "Guinea": "en:gn",
  "Guinea-Bissau": "en:gw",
  "Guyana": "en:gy",
  "Haiti": "en:ht",
  "Honduras": "en:hn",
  "Hungary": "en:hu",
  "Iceland": "en:is",
  "India": "en:in",
  "Indonesia": "en:id",
  "Iran": "en:ir",
  "Iraq": "en:iq",
  "Ireland": "en:ie",
  "Israel": "en:il",
  "Italy": "en:it",
  "Jamaica": "en:jm",
  "Japan": "en:jp",
  "Jordan": "en:jo",
  "Kazakhstan": "en:kz",
  "Kenya": "en:ke",
  "Kiribati": "en:ki",
  "Kosovo": "en:xk",
  "Kuwait": "en:kw",
  "Kyrgyzstan": "en:kg",
  "Laos": "en:la",
  "Latvia": "en:lv",
  "Lebanon": "en:lb",
  "Lesotho": "en:ls",
  "Liberia": "en:lr",
  "Libya": "en:ly",
  "Liechtenstein": "en:li",
  "Lithuania": "en:lt",
  "Luxembourg": "en:lu",
  "Madagascar": "en:mg",
  "Malawi": "en:mw",
  "Malaysia": "en:my",
  "Maldives": "en:mv",
  "Mali": "en:ml",
  "Malta": "en:mt",
  "Marshall Islands": "en:mh",
  "Mauritania": "en:mr",
  "Mauritius": "en:mu",
  "Mexico": "en:mx",
  "Micronesia": "en:fm",
  "Moldova": "en:md",
  "Monaco": "en:mc",
  "Mongolia": "en:mn",
  "Montenegro": "en:me",
  "Morocco": "en:ma",
  "Mozambique": "en:mz",
  "Myanmar": "en:mm",
  "Namibia": "en:na",
  "Nauru": "en:nr",
  "Nepal": "en:np",
  "Netherlands": "en:nl",
  "New Zealand": "en:nz",
  "Nicaragua": "en:ni",
  "Niger": "en:ne",
  "Nigeria": "en:ng",
  "North Korea": "en:kp",
  "North Macedonia": "en:mk",
  "Norway": "en:no",
  "Oman": "en:om",
  "Pakistan": "en:pk",
  "Palau": "en:pw",
  "Palestine State": "en:ps",
  "Panama": "en:pa",
  "Papua New Guinea": "en:pg",
  "Paraguay": "en:py",
  "Peru": "en:pe",
  "Philippines": "en:ph",
  "Poland": "en:pl",
  "Portugal": "en:pt",
  "Qatar": "en:qa",
  "Romania": "en:ro",
  "Russia": "en:ru",
  "Rwanda": "en:rw",
  "Saint Kitts and Nevis": "en:kn",
  "Saint Lucia": "en:lc",
  "Saint Vincent and the Grenadines": "en:vc",
  "Samoa": "en:ws",
  "San Marino": "en:sm",
  "Sao Tome and Principe": "en:st",
  "Saudi Arabia": "en:sa",
  "Senegal": "en:sn",
  "Serbia": "en:rs",
  "Seychelles": "en:sc",
  "Sierra Leone": "en:sl",
  "Singapore": "en:sg",
  "Slovakia": "en:sk",
  "Slovenia": "en:si",
  "Solomon Islands": "en:sb",
  "Somalia": "en:so",
  "South Africa": "en:za",
  "South Korea": "en:kr",
  "South Sudan": "en:ss",
  "Spain": "en:es",
  "Sri Lanka": "en:lk",
  "Sudan": "en:sd",
  "Suriname": "en:sr",
  "Sweden": "en:se",
  "Switzerland": "en:ch",
  "Syria": "en:sy",
  "Taiwan": "en:tw",
  "Tajikistan": "en:tj",
  "Tanzania": "en:tz",
  "Thailand": "en:th",
  "Timor-Leste": "en:tl",
  "Togo": "en:tg",
  "Tonga": "en:to",
  "Trinidad and Tobago": "en:tt",
  "Tunisia": "en:tn",
  "Turkey": "en:tr",
  "Turkmenistan": "en:tm",
  "Tuvalu": "en:tv",
  "Uganda": "en:ug",
  "Ukraine": "en:ua",
  "United Arab Emirates": "en:ae",
  "United Kingdom": "en:gb",
  "United States of America": "en:us",
  "Uruguay": "en:uy",
  "Uzbekistan": "en:uz",
  "Vanuatu": "en:vu",
  "Vatican City": "en:va",
  "Venezuela": "en:ve",
  "Vietnam": "en:vn",
  "Yemen": "en:ye",
  "Zambia": "en:zm",
  "Zimbabwe": "en:zw"
};

// Regional meal templates for different regions
const REGIONAL_MEAL_TEMPLATES = {
  // South Asian cuisine (Bangladesh, India, Pakistan, Sri Lanka, Nepal, Bhutan)
  southAsian: {
    breakfast: [
      "Panta Ilish + Onion", "Ruti + Sobji", "Ruti + Dim (Egg)", "Muri + Milk + Banana",
      "Shobji + Rice", "Idli + Sambar", "Paratha + Curry", "Upma + Vegetables",
      "Dalia + Milk", "Luchi + Alu Dum", "Poha + Peanuts", "Appam + Stew",
      "Dosa + Chutney", "Chole Bhature", "Methi Thepla", "Sabudana Khichdi",
      "Semolina Upma", "Besan Chilla", "Egg Bhurji + Toast", "Moong Dal Cheela",
      "Neer Dosa + Chutney", "Rava Idli", "Masala Oats", "Quinoa Upma"
    ],
    lunch: [
      "Rice + Dal + Vegetable Curry", "Rice + Fish Curry + Salad", "Khichuri + Mixed Vegetables",
      "Rice + Chicken Curry + Dal", "Vegetable Pulao + Raita", "Biryani + Raita",
      "Roti + Mixed Vegetable Sabzi", "Rice + Macher Jhol", "Dal + Roti + Sabzi",
      "Chana Pulao + Salad", "Rajma + Rice", "Kadhi + Rice", "Sambhar + Rice",
      "Palak Paneer + Roti", "Aloo Gobi + Roti", "Baingan Bharta + Roti", "Malai Kofta + Rice",
      "Chicken Tikka + Roti", "Mutton Curry + Rice", "Fish Fry + Rice", "Egg Curry + Rice"
    ],
    dinner: [
      "Rice + Dal + Begun Bharta", "Roti + Mixed Vegetable Sabzi", "Rice + Fish + Green Salad",
      "Khichuri + Papad + Curd", "Roti + Alu Dom + Gobi", "Macher Kalia + Rice",
      "Chicken Rezala + Roti", "Dal Tadka + Rice", "Vegetable Jalfrezi + Roti",
      "Egg Curry + Rice", "Paneer Butter Masala + Roti", "Mixed Dal + Rice + Ghee",
      "Bhindi Masala + Roti", "Lauki Sabzi + Roti", "Sarson ka Saag + Makki Roti",
      "Mutton Biryani + Raita", "Chicken Dum Biryani", "Hyderabadi Biryani", "Vegetable Biryani"
    ],
    snacks: [
      "Jhalmuri (Spiced Puffed Rice)", "Fuchka (6 pieces)", "Chana + Muri", "Seasonal Fruits",
      "Muri + Chanachur", "Samosa", "Pakora", "Vada Pav", "Dahi Vada", "Bhel Puri",
      "Sev Puri", "Pani Puri", "Aloo Chaat", "Paneer Tikka", "Chicken Tikka",
      "Kachori", "Dhokla", "Momos", "Spring Roll", "Cutlet", "Pattice"
    ]
  },
  
  // Asian cuisine (East Asia, Southeast Asia)
  asian: {
    breakfast: [
      "Rice Congee + Vegetables", "Steamed Dumplings + Tea", "Noodle Soup", 
      "Rice Porridge + Pickles", "Miso Soup + Rice", "Dim Sum", 
      "Roti + Curry", "Congee + Fried Egg", "Banh Mi", "Pho",
      "Congee + Century Egg", "Kimchi + Rice", "Miso Soup + Tofu", "Bao Buns",
      "Thai Congee", "Vietnamese Pho", "Japanese Tamago + Rice", "Chinese Baozi",
      "Korean Kimchi Jjigae", "Filipino Sinangag", "Indonesian Nasi Goreng", "Malaysian Nasi Lemak"
    ],
    lunch: [
      "Rice + Curry + Vegetables", "Noodle Stir Fry", "Sushi Bowl", 
      "Pad Thai + Spring Roll", "Bibimbap + Kimchi", "Pho + Herbs",
      "Fried Rice + Egg", "Laksa + Tofu", "Kimchi + Rice", "Satay + Rice",
      "Thai Green Curry + Rice", "Japanese Ramen", "Korean Bibimbap", "Vietnamese Banh Xeo",
      "Chinese Kung Pao Chicken", "Thai Tom Yum Soup", "Filipino Adobo", "Indonesian Rendang",
      "Malaysian Char Kway Teow", "Singapore Hainanese Chicken Rice", "Japanese Tempura + Rice"
    ],
    dinner: [
      "Grilled Fish + Rice + Vegetables", "Chicken Curry + Naan", "Beef Stir Fry + Rice",
      "Hot Pot + Dipping Sauces", "Sushi Platter", "Thai Green Curry + Rice",
      "Korean BBQ + Sides", "Vietnamese Pho", "Japanese Teriyaki", "Chinese Hot Pot",
      "Thai Massaman Curry", "Korean Samgyeopsal", "Japanese Sukiyaki", "Vietnamese Bun Cha",
      "Chinese Peking Duck", "Thai Pad See Ew", "Korean Bulgogi", "Filipino Lechon",
      "Indonesian Satay", "Malaysian Nasi Dagang", "Japanese Shabu Shabu", "Thai Larb"
    ],
    snacks: [
      "Spring Rolls", "Samosas", "Dumplings", "Rice Cakes", "Edamame",
      "Fried Bananas", "Coconut Balls", "Tea Eggs", "Seaweed Snacks", "Mochi",
      "Takoyaki", "Taiyaki", "Pork Buns", "Bubble Tea", "Fried Tofu",
      "Vietnamese Summer Rolls", "Thai Mango Sticky Rice", "Japanese Dango", "Korean Hotteok"
    ]
  },
  
  // European cuisine  
  european: {
    breakfast: [
      "Croissant + Coffee", "Toast + Jam + Butter", "Oatmeal + Berries",
      "Yogurt + Granola", "Full English Breakfast", "Continental Breakfast",
      "Pain au Chocolat", "Smoked Salmon + Bagel", "Scrambled Eggs + Toast", "Muesli + Milk",
      "German Pretzel + Cheese", "Italian Cornetto", "Spanish Churros + Chocolate", "Greek Yogurt + Honey",
      "Swedish Muesli", "Russian Syrniki", "Polish Pierogi", "Hungarian Lángos",
      "Finnish Porridge", "Dutch Hagelslag", "Belgian Waffles", "Austrian Kaiserschmarrn"
    ],
    lunch: [
      "Sandwich + Salad", "Pasta + Tomato Sauce", "Soup + Bread",
      "Quiche + Green Salad", "Panini + Chips", "Wraps + Fruit",
      "Bruschetta + Soup", "Caesar Salad", "Risotto + Vegetables", "Tapas Plate",
      "French Croque Monsieur", "Italian Panini", "Spanish Paella", "Greek Moussaka",
      "German Schnitzel + Potatoes", "Swedish Meatballs", "Polish Bigos", "Hungarian Goulash",
      "British Fish + Chips", "Portuguese Bacalhau", "Dutch Bitterballen", "Austrian Wiener Schnitzel"
    ],
    dinner: [
      "Roast Chicken + Potatoes", "Beef Stew + Bread", "Grilled Salmon + Asparagus",
      "Pasta Carbonara + Salad", "Pizza + Wine", "Steak + Fries",
      "Lamb Chops + Mint Sauce", "Fish + Chips", "Ratatouille + Rice", "Goulash + Dumplings",
      "French Coq au Vin", "Italian Osso Buco", "Spanish Paella", "Greek Souvlaki",
      "German Sauerbraten", "Swedish Köttbullar", "Polish Pierogi", "Hungarian Paprikash",
      "British Sunday Roast", "Portuguese Cataplana", "Dutch Stamppot", "Austrian Tafelspitz"
    ],
    snacks: [
      "Cheese + Crackers", "Olives + Bread", "Fruit + Nuts", "Yogurt + Honey",
      "Dark Chocolate", "Pretzels", "Biscotti", "Tapenade + Toast", "Bruschetta", "Caprese",
      "French Macarons", "Italian Gelato", "Spanish Churros", "Greek Baklava",
      "German Black Forest Cake", "Swedish Cinnamon Buns", "Polish Paczki", "Hungarian Kürtőskalács",
      "British Scones", "Portuguese Pastéis de Nata", "Dutch Stroopwafel", "Austrian Sachertorte"
    ]
  },
  
  // African cuisine
  african: {
    breakfast: [
      "Fufu + Soup", "Injera + Stew", "Porridge + Milk", "Fried Plantains + Eggs",
      "Millet Porridge + Honey", "Banku + Okra", "Sadza + Relish", "Ugali + Greens",
      "Akara + Pap", "Moin Moin + Ogi", "Efo Riro + Amala", "Waakye + Shito",
      "Fried Yam + Eggs", "Kokoro + Tea", "Chakalaka + Pap", "Bokkom + Porridge"
    ],
    lunch: [
      "Jollof Rice + Chicken", "Tagine + Bread", "Bobotie + Rice", "Sukuma Wiki + Ugali",
      "Efo Riro + Rice", "Pounded Yam + Egusi", "Bunny Chow", "Thieboudienne + Vegetables",
      "Egusi Soup + Fufu", "Okra Soup + Banku", "Groundnut Soup + Rice", "Palaver Sauce + Fufu",
      "Doro Wat + Injera", "Shakshuka + Bread", "Pounded Yam + Ogbono", "Gbegiri + Amala",
      "Waakye + Stew", "Chakalaka + Maize", "Samp + Beans", "Mopane Worms + Sadza"
    ],
    dinner: [
      "Grilled Meat + Fufu", "Fish Stew + Rice", "Beef Suya + Rice", "Chicken Muamba",
      "Doro Wat + Injera", "Biryani + Raita", "Curry + Roti", "Stew + Dumplings",
      "Pounded Yam + Efo Riro", "Banku + Tilapia", "Ugali + Sukuma Wiki", "Sadza + Nyama",
      "Thieboudienne + Fish", "Jollof Rice + Beef", "Coconut Rice + Stew", "Fufu + Light Soup",
      "Injera + Tibs", "Bobotie + Yellow Rice", "Bunny Chow + Curry", "Chakalaka + Grilled Meat"
    ],
    snacks: [
      "Plantain Chips", "Roasted Nuts", "Fried Yams", "Mandazi", "Puff Puff",
      "Biltong", "Samosas", "Kebabs", "Fruit Salad", "Coconut Candy",
      "Akara", "Kokoro", "Chin Chin", "Puff Puff", "Meat Pies",
      "Suya", "Bunny Chow", "Fried Plantains", "Roasted Maize", "Groundnut Soup"
    ]
  },
  
  // Middle Eastern cuisine
  middleEastern: {
    breakfast: [
      "Falafel + Hummus + Pita", "Shakshuka + Bread", "Labneh + Olives + Za'atar",
      "Foul Medammes + Pita", "Manakish + Cheese", "Dates + Yogurt",
      "Baladi Eggs + Foul", "Shakshuka + Pita", "Manakish + Za'atar", "Labneh + Cucumber",
      "Ful Medames + Tahini", "Halloumi + Tomatoes", "Eggs + Lamb Fat", "Burek + Sambousek",
      "Kunafa + Tea", "Ka'ak + Cheese", "Mansaf + Yogurt", "Shakshouka + Bread"
    ],
    lunch: [
      "Shawarma + Rice", "Kebab + Salad", "Hummus + Falafel + Pita",
      "Mansaf + Yogurt", "Kibbeh + Tahini", "Fatteh + Bread",
      "Mandi + Rice", "Kabsa + Salad", "Machboos + Daqoos", "Harees + Yogurt",
      "Shish Tawouk + Rice", "Fattoush + Pita", "Tabbouleh + Hummus", "Baba Ghanoush + Pita",
      "Mujadara + Yogurt", "Warak Enab + Rice", "Shawarma + Fattoush", "Kofta + Rice"
    ],
    dinner: [
      "Grilled Lamb + Rice", "Chicken Shawarma + Fattoush", "Mixed Grill + Mezze",
      "Stuffed Grape Leaves + Rice", "Mandi + Raita", "Quzi + Nuts",
      "Mansaf + Jameed", "Kabsa + Dakoos", "Machboos + Salata", "Harees + Ghee",
      "Shish Kebab + Rice", "Lamb Mandi + Raita", "Chicken Machboos", "Beef Kabsa",
      "Mixed Grill + Hummus", "Lamb Ouzi + Rice", "Chicken Shawarma + Salad", "Kofta + Tahini"
    ],
    snacks: [
      "Baklava", "Knafeh", "Dates + Nuts", "Halva", "Turkish Delight",
      "Sesame Cookies", "Pistachios", "Dried Figs", "Olives + Cheese", "Labneh + Za'atar",
      "Kataifi", "Basbousa", "Qatayef", "Ma'amoul", "Halawet el Jibn",
      "Rice Pudding", "Muhallabia", "Kunafa", "Awwama", "Zalabia"
    ]
  },
  
  // Latin American cuisine
  latinAmerican: {
    breakfast: [
      "Arepa + Cheese + Coffee", "Tamales + Atole", "Pão de Queijo + Coffee",
      "Huevos Rancheros + Beans", "Tostones + Eggs", "Empanadas + Mate",
      "Gal Pinto + Eggs", "Arepas + Perico", "Tamales + Atol", "Pupusas + Curtido",
      "Pan con Tomate + Cafe", "Huevos a la Mexicana", "Tortilla + Beans", "Cachapa + Cheese",
      "Molletes + Coffee", "Tostadas + Huevos", "Bollos + Cheese", "Pastelitos + Cafe"
    ],
    lunch: [
      "Arroz con Pollo + Salad", "Feijoada + Rice", "Tacos + Salsa",
      "Ceviche + Sweet Potato", "Pupusas + Curtido", "Bandera Paisa",
      "Casado + Salad", "Lomo Saltado + Rice", "Moqueca + Farofa", "Asado + Chimichurri",
      "Tacos al Pastor + Rice", "Enchiladas + Beans", "Pupusas + Slaw", "Ceviche + Chifles",
      "Bandeja Paisa + Arepa", "Feijoada + Farofa", "Arroz con Mariscos + Salad", "Lomo a lo Pobre"
    ],
    dinner: [
      "Asado + Chimichurri", "Moqueca + Rice", "Carnitas + Tortillas",
      "Parrillada + Sides", "Lomo Saltado + Rice", "Pabellón Criollo",
      "Churrasco + Farofa", "Milanesa + Fries", "Tacos de Carne Asada", "Enchiladas Verdes",
      "Parrillada Mixta + Chimichurri", "Moqueca Baiana + Arroz", "Lomo a la Pobre + Papas",
      "Carnitas de Puerco + Salsa", "Bife de Chorizo + Fritas", "Pollo a la Brasa + Papas",
      "Churrasco Gaúcho + Farofa", "Milanesa Napolitana + Puré", "Tacos Dorados + Guacamole"
    ],
    snacks: [
      "Empanadas", "Tamales", "Arepas", "Pupusas", "Guanabana",
      "Churros", "Alfajores", "Dulce de Leche", "Plantain Chips", "Acai Bowl",
      "Tortilla Chips + Guacamole", "Pão de Queijo", "Coxinha", "Pastel de Bacalhau",
      "Tres Leches Cake", "Flan", "Dulce de Leche", "Churros + Chocolate", "Açaí + Granola"
    ]
  },
  
  // North American cuisine
  northAmerican: {
    breakfast: [
      "Pancakes + Maple Syrup", "Waffles + Berries", "Oatmeal + Nuts",
      "Bagel + Cream Cheese", "French Toast + Fruit", "Scrambled Eggs + Bacon",
      "Eggs Benedict + Hash Browns", "Breakfast Burrito + Salsa", "Cereal + Milk + Fruit",
      "Yogurt Parfait + Granola", "Avocado Toast + Egg", "Omelette + Toast + Potatoes",
      "Breakfast Sandwich + Coffee", "Granola + Yogurt + Berries", "Smoothie Bowl + Toppings",
      "French Toast Sticks + Syrup", "Pancakes + Blueberries", "Waffles + Strawberries + Cream"
    ],
    lunch: [
      "Burger + Fries", "Sandwich + Chips", "Salad + Grilled Chicken",
      "Taco + Rice + Beans", "Soup + Sandwich", "Pizza + Salad",
      "Caesar Salad + Croutons", "Grilled Cheese + Tomato Soup", "Chicken Sandwich + Fries",
      "Tuna Salad + Crackers", "BLT + Chips", "Club Sandwich + Fries", "Quesadilla + Salsa",
      "Philly Cheesesteak + Fries", "Reuben Sandwich + Pickles", "Chicken Wrap + Soup", "Burger + Coleslaw"
    ],
    dinner: [
      "Steak + Potatoes + Vegetables", "Grilled Salmon + Quinoa", "BBQ Ribs + Coleslaw",
      "Chicken Alfredo + Garlic Bread", "Meatloaf + Mashed Potatoes", "Fish + Chips",
      "Prime Rib + Roasted Vegetables", "Lobster Roll + Fries", "BBQ Chicken + Cornbread",
      "Pasta Primavera + Salad", "Beef Stew + Bread", "Chicken Parmesan + Pasta", "Shrimp Scampi + Rice",
      "Pulled Pork + Baked Beans", "Turkey + Stuffing + Gravy", "Ribeye Steak + Asparagus", "Salmon + Roasted Vegetables"
    ],
    snacks: [
      "Nachos + Cheese", "Buffalo Wings", "Onion Rings", "Mozzarella Sticks",
      "Popcorn + Butter", "Trail Mix", "Granola Bar", "Fruit + Yogurt", "Cheese + Crackers",
      "Potato Chips + Dip", "Pretzels + Mustard", "Fruit Smoothie", "Energy Bar", "Popcorn + Seasoning",
      "Cheese Curds + Ketchup", "Chicken Wings + Ranch", "Onion Rings + Ketchup", "Mozzarella Sticks + Marinara"
    ]
  }
};

// Map countries to regional cuisines
const COUNTRY_TO_REGION = {
  // Asia
  "Afghanistan": "middleEastern", "Bangladesh": "southAsian", "Bhutan": "southAsian", "Brunei": "asian",
  "Cambodia": "asian", "China": "asian", "India": "southAsian", "Indonesia": "asian", "Japan": "asian",
  "Kazakhstan": "asian", "Kyrgyzstan": "asian", "Laos": "asian", "Malaysia": "asian", "Maldives": "southAsian",
  "Mongolia": "asian", "Myanmar": "asian", "Nepal": "southAsian", "North Korea": "asian", "Pakistan": "southAsian",
  "Philippines": "asian", "Singapore": "asian", "South Korea": "asian", "Sri Lanka": "southAsian", "Taiwan": "asian",
  "Tajikistan": "asian", "Thailand": "asian", "Timor-Leste": "asian", "Turkmenistan": "asian", "Uzbekistan": "asian",
  "Vietnam": "asian",
  
  // Europe
  "Albania": "european", "Andorra": "european", "Armenia": "european", "Austria": "european",
  "Azerbaijan": "european", "Belarus": "european", "Belgium": "european", "Bosnia and Herzegovina": "european",
  "Bulgaria": "european", "Croatia": "european", "Cyprus": "european", "Czechia": "european",
  "Denmark": "european", "Estonia": "european", "Finland": "european", "France": "european",
  "Georgia": "european", "Germany": "european", "Greece": "european", "Hungary": "european",
  "Iceland": "european", "Ireland": "european", "Italy": "european", "Kosovo": "european",
  "Latvia": "european", "Liechtenstein": "european", "Lithuania": "european", "Luxembourg": "european",
  "Malta": "european", "Moldova": "european", "Monaco": "european", "Montenegro": "european",
  "Netherlands": "european", "North Macedonia": "european", "Norway": "european", "Poland": "european",
  "Portugal": "european", "Romania": "european", "Russia": "european", "San Marino": "european",
  "Serbia": "european", "Slovakia": "european", "Slovenia": "european", "Spain": "european",
  "Sweden": "european", "Switzerland": "european", "Turkey": "middleEastern", "Ukraine": "european",
  "United Kingdom": "european", "Vatican City": "european",
  
  // Africa
  "Algeria": "african", "Angola": "african", "Benin": "african", "Botswana": "african",
  "Burkina Faso": "african", "Burundi": "african", "Cabo Verde": "african", "Cameroon": "african",
  "Central African Republic": "african", "Chad": "african", "Comoros": "african", "Congo, Democratic Republic of the": "african",
  "Congo, Republic of the": "african", "Cote d'Ivoire": "african", "Djibouti": "african", "Egypt": "middleEastern",
  "Equatorial Guinea": "african", "Eritrea": "african", "Eswatini": "african", "Ethiopia": "african",
  "Gabon": "african", "Gambia": "african", "Ghana": "african", "Guinea": "african",
  "Guinea-Bissau": "african", "Kenya": "african", "Lesotho": "african", "Liberia": "african",
  "Libya": "african", "Madagascar": "african", "Malawi": "african", "Mali": "african",
  "Mauritania": "african", "Mauritius": "african", "Morocco": "african", "Mozambique": "african",
  "Namibia": "african", "Niger": "african", "Nigeria": "african", "Rwanda": "african",
  "Sao Tome and Principe": "african", "Senegal": "african", "Seychelles": "african", "Sierra Leone": "african",
  "Somalia": "african", "South Africa": "african", "South Sudan": "african", "Sudan": "african",
  "Tanzania": "african", "Togo": "african", "Tunisia": "african", "Uganda": "african",
  "Zambia": "african", "Zimbabwe": "african",
  
  // Middle East
  "Bahrain": "middleEastern", "Iran": "middleEastern", "Iraq": "middleEastern", "Israel": "middleEastern",
  "Jordan": "middleEastern", "Kuwait": "middleEastern", "Lebanon": "middleEastern", "Oman": "middleEastern",
  "Palestine State": "middleEastern", "Qatar": "middleEastern", "Saudi Arabia": "middleEastern", "Syria": "middleEastern",
  "United Arab Emirates": "middleEastern", "Yemen": "middleEastern",
  
  // Americas
  "Antigua and Barbuda": "latinAmerican", "Argentina": "latinAmerican", "Barbados": "latinAmerican",
  "Belize": "latinAmerican", "Bolivia": "latinAmerican", "Brazil": "latinAmerican", "Canada": "northAmerican",
  "Chile": "latinAmerican", "Colombia": "latinAmerican", "Costa Rica": "latinAmerican", "Cuba": "latinAmerican",
  "Dominica": "latinAmerican", "Dominican Republic": "latinAmerican", "Ecuador": "latinAmerican", "El Salvador": "latinAmerican",
  "Grenada": "latinAmerican", "Guatemala": "latinAmerican", "Guyana": "latinAmerican", "Haiti": "latinAmerican",
  "Honduras": "latinAmerican", "Jamaica": "latinAmerican", "Mexico": "latinAmerican", "Nicaragua": "latinAmerican",
  "Panama": "latinAmerican", "Paraguay": "latinAmerican", "Peru": "latinAmerican", "Saint Kitts and Nevis": "latinAmerican",
  "Saint Lucia": "latinAmerican", "Saint Vincent and the Grenadines": "latinAmerican", "Suriname": "latinAmerican",
  "Trinidad and Tobago": "latinAmerican", "United States of America": "northAmerican", "Uruguay": "latinAmerican",
  "Venezuela": "latinAmerican",
  
  // Oceania
  "Australia": "european", "Fiji": "asian", "Kiribati": "asian", "Marshall Islands": "asian",
  "Micronesia": "asian", "Nauru": "asian", "New Zealand": "european", "Palau": "asian",
  "Papua New Guinea": "asian", "Samoa": "asian", "Solomon Islands": "asian", "Timor-Leste": "asian",
  "Tonga": "asian", "Tuvalu": "asian", "Vanuatu": "asian"
};

// Budget variations for each meal
const BUDGET_VARIATIONS = {
  budget: {
    multiplier: 0.8,
    modifications: "Basic ingredients, simple preparation",
    portionSize: "Small to medium"
  },
  economical: {
    multiplier: 0.9,
    modifications: "Good variety, cost-effective ingredients", 
    portionSize: "Medium"
  },
  moderate: {
    multiplier: 1.0,
    modifications: "Full variety, balanced ingredients",
    portionSize: "Medium to large"
  },
  premium: {
    multiplier: 1.2,
    modifications: "Premium ingredients, extra variety",
    portionSize: "Large"
  }
};

// Generate comprehensive meal database with dynamic randomization
function generateComprehensiveMealDatabase(randomSeed = Date.now()) {
  const database = {};
  
  // Use the random seed for consistent randomness within a single generation
  const random = (() => {
    let seed = randomSeed;
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  })();
  
  // Process each country
  Object.keys(COUNTRY_TO_OFF_CODE).forEach(country => {
    const region = COUNTRY_TO_REGION[country] || "european"; // Default to European
    const templates = REGIONAL_MEAL_TEMPLATES[region];
    
    database[country] = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    };
    
    // Generate meals for each type
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
      const baseMeals = templates[mealType];
      
      // Generate 7 combos for each budget class
      ['budget', 'economical', 'moderate', 'premium'].forEach(budgetClass => {
        const budget = BUDGET_VARIATIONS[budgetClass];
        
        // Create 7 different combos for this budget class
        for (let comboIndex = 0; comboIndex < 7; comboIndex++) {
          // Add randomness to meal selection for variety using our seeded random
          const randomOffset = Math.floor(random() * baseMeals.length);
          
          // Select different base meals based on budget class to ensure variety
          let mealIndex;
          switch(budgetClass) {
            case 'budget':
              mealIndex = (comboIndex + randomOffset) % baseMeals.length; // Use random offset
              break;
            case 'economical':
              mealIndex = (comboIndex + randomOffset + 2) % baseMeals.length; // Shift by 2
              break;
            case 'moderate':
              mealIndex = (comboIndex + randomOffset + 4) % baseMeals.length; // Shift by 4
              break;
            case 'premium':
              mealIndex = (comboIndex + randomOffset + 6) % baseMeals.length; // Shift by 6
              break;
            default:
              mealIndex = (comboIndex + randomOffset) % baseMeals.length;
          }
          
          const baseMeal = baseMeals[mealIndex];
          
          // Calculate nutritional values based on meal type, region, and budget
          let baseCalories, baseProtein, baseCarbs, baseFat;
          
          // Regional nutritional profiles
          const regionalProfiles = {
            southAsian: { carbRatio: 0.65, proteinRatio: 0.15, fatRatio: 0.20 },
            asian: { carbRatio: 0.60, proteinRatio: 0.20, fatRatio: 0.20 },
            european: { carbRatio: 0.45, proteinRatio: 0.25, fatRatio: 0.30 },
            african: { carbRatio: 0.70, proteinRatio: 0.15, fatRatio: 0.15 },
            middleEastern: { carbRatio: 0.50, proteinRatio: 0.20, fatRatio: 0.30 },
            latinAmerican: { carbRatio: 0.55, proteinRatio: 0.20, fatRatio: 0.25 },
            northAmerican: { carbRatio: 0.40, proteinRatio: 0.30, fatRatio: 0.30 }
          };
          
          const profile = regionalProfiles[region] || regionalProfiles.northAmerican;
          
          switch(mealType) {
            case 'breakfast':
              baseCalories = 280 + (comboIndex * 25) + (budgetClass === 'premium' ? 50 : 0);
              baseProtein = Math.round(baseCalories * profile.proteinRatio / 4);
              break;
            case 'lunch':
              baseCalories = 420 + (comboIndex * 35) + (budgetClass === 'premium' ? 80 : 0);
              baseProtein = Math.round(baseCalories * profile.proteinRatio / 4);
              break;
            case 'dinner':
              baseCalories = 480 + (comboIndex * 45) + (budgetClass === 'premium' ? 100 : 0);
              baseProtein = Math.round(baseCalories * profile.proteinRatio / 4);
              break;
            case 'snacks':
              baseCalories = 140 + (comboIndex * 20) + (budgetClass === 'premium' ? 30 : 0);
              baseProtein = Math.round(baseCalories * profile.proteinRatio / 4);
              break;
          }
          
          // Calculate macronutrients based on regional profile
          baseCarbs = Math.round(baseCalories * profile.carbRatio / 4);
          baseFat = Math.round(baseCalories * profile.fatRatio / 9);
          
          // Adjust for budget class
          const budgetMultiplier = BUDGET_VARIATIONS[budgetClass].multiplier;
          const finalCalories = Math.round(baseCalories * budgetMultiplier);
          const finalProtein = Math.round(baseProtein * budgetMultiplier);
          const finalCarbs = Math.round(baseCarbs * budgetMultiplier);
          const finalFat = Math.round(baseFat * budgetMultiplier);
          
          // Create budget-specific food variations
          let foodVariation;
          switch(budgetClass) {
            case 'budget':
              foodVariation = `${baseMeal} (Basic)`;
              break;
            case 'economical':
              foodVariation = `${baseMeal} (Standard)`;
              break;
            case 'moderate':
              foodVariation = `${baseMeal} (Enhanced)`;
              break;
            case 'premium':
              foodVariation = `${baseMeal} (Premium)`;
              break;
            default:
              foodVariation = baseMeal;
          }
          
          const combo = {
            name: `${foodVariation} Combo ${comboIndex + 1}`,
            foods: [{
              name: foodVariation,
              calories: finalCalories,
              protein: finalProtein,
              carbs: finalCarbs,
              fat: finalFat,
              fiber: Math.round(finalCarbs * 0.1), // ~10% of carbs as fiber
              sugar: Math.round(finalCarbs * 0.2), // ~20% of carbs as sugar
              sodium: Math.round(finalCalories * 0.0015), // ~1.5mg per calorie
              potassium: Math.round(finalCalories * 0.002), // ~2mg per calorie
              cholesterol: Math.round(finalProtein * 2), // ~2mg per gram protein
              vitaminA: Math.random() * 1000 + 500, // Random vitamin content
              vitaminC: Math.random() * 50 + 20,
              vitaminD: Math.random() * 10 + 2,
              calcium: Math.random() * 200 + 100,
              iron: Math.random() * 10 + 3,
              magnesium: Math.random() * 100 + 50,
              zinc: Math.random() * 5 + 2,
              source: 'comprehensive_database',
              country: country,
              budget: budgetClass,
              mealType: mealType,
              modifications: budget.modifications,
              portionSize: budget.portionSize,
              region: region
            }],
            calories: finalCalories,
            protein: finalProtein,
            carbs: finalCarbs,
            fat: finalFat,
            fiber: Math.round(finalCarbs * 0.1),
            sugar: Math.round(finalCarbs * 0.2),
            sodium: Math.round(finalCalories * 0.0015),
            potassium: Math.round(finalCalories * 0.002),
            cholesterol: Math.round(finalProtein * 2),
            vitaminA: Math.random() * 1000 + 500,
            vitaminC: Math.random() * 50 + 20,
            vitaminD: Math.random() * 10 + 2,
            calcium: Math.random() * 200 + 100,
            iron: Math.random() * 10 + 3,
            magnesium: Math.random() * 100 + 50,
            zinc: Math.random() * 5 + 2,
            budget: budgetClass,
            country: country,
            mealType: mealType,
            comboIndex: comboIndex + 1,
            targetCalories: finalCalories,
            targetProtein: finalProtein,
            region: region
          };
          
          database[country][mealType].push(combo);
        }
      });
    });
  });
  
  return database;
}

// Export the comprehensive database with dynamic generation
let COMPREHENSIVE_MEAL_DATABASE = generateComprehensiveMealDatabase();

// Function to regenerate database with fresh randomness
function regenerateMealDatabase() {
  COMPREHENSIVE_MEAL_DATABASE = generateComprehensiveMealDatabase();
}

// Helper function to get meals for a specific country and budget
function getCountryMeals(country, mealType, budgetClass) {
  // Regenerate database occasionally for freshness (every 10 calls)
  if (Math.random() < 0.1) {
    regenerateMealDatabase();
  }
  
  const countryMeals = COMPREHENSIVE_MEAL_DATABASE[country] || COMPREHENSIVE_MEAL_DATABASE["United States of America"];
  const mealMeals = countryMeals[mealType] || countryMeals.lunch;
  
  // Return meals for the specific budget class
  return mealMeals.filter(meal => meal.budget === budgetClass);
}

// Helper function to get Open Food Facts country code
function getOpenFoodFactsCode(country) {
  return COUNTRY_TO_OFF_CODE[country] || COUNTRY_TO_OFF_CODE["United States of America"];
}

module.exports = {
  COMPREHENSIVE_MEAL_DATABASE,
  getCountryMeals,
  getOpenFoodFactsCode,
  regenerateMealDatabase,
  COUNTRY_TO_OFF_CODE,
  COUNTRY_TO_REGION,
  REGIONAL_MEAL_TEMPLATES,
  BUDGET_VARIATIONS
};
