require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

const uri: string = process.env.MONGODB_URI!;
if (!uri) throw new Error('Missing MONGODB_URI environment variable.');

const options = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true,
};

const products = [
  {
    name: "Dior Sauvage Eau de Parfum",
    slug: "dior-sauvage-eau-de-parfum",
    brand: "Dior",
    category: "Men",
    type: "Eau de Parfum",
    description: "Dior Sauvage Eau de Parfum is a fresh, spicy and powerful fragrance with a warm woody character.",
    shortDescription: "Fresh, spicy and woody men's fragrance.",
    images: [
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 4000, price: 3500, stock: 15 },
      { size: 10, unit: "ml", labelledPrice: 7000, price: 6000, stock: 10 },
    ],
    fragrance: {
      gender: "Men",
      concentration: "Eau de Parfum",
      season: ["Spring", "Summer", "Autumn", "Winter"],
      occasion: ["Casual", "Date Night", "Party"],
      longevity: "8-10 hours",
      sillage: "Strong",
    },
    notes: {
      top: ["Bergamot", "Pepper"],
      middle: ["Lavender", "Pink Pepper"],
      base: ["Ambroxan", "Cedar", "Patchouli"],
    },
    isFeatured: true,
    isBestSeller: true,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "Bleu de Chanel Eau de Parfum",
    slug: "bleu-de-chanel-eau-de-parfum",
    brand: "Chanel",
    category: "Men",
    type: "Eau de Parfum",
    description: "Bleu de Chanel Eau de Parfum is an elegant aromatic woody fragrance with fresh citrus and warm sandalwood.",
    shortDescription: "Elegant, fresh and woody men's fragrance.",
    images: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 5000, price: 4500, stock: 12 },
      { size: 10, unit: "ml", labelledPrice: 8500, price: 7500, stock: 8 },
    ],
    fragrance: {
      gender: "Men",
      concentration: "Eau de Parfum",
      season: ["Spring", "Summer", "Autumn", "Winter"],
      occasion: ["Office", "Formal", "Date Night"],
      longevity: "8-10 hours",
      sillage: "Moderate",
    },
    notes: {
      top: ["Lemon", "Bergamot", "Mint"],
      middle: ["Ginger", "Nutmeg", "Jasmine"],
      base: ["Sandalwood", "Cedar", "Incense"],
    },
    isFeatured: true,
    isBestSeller: true,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "YSL Y Eau de Parfum",
    slug: "ysl-y-eau-de-parfum",
    brand: "Yves Saint Laurent",
    category: "Men",
    type: "Eau de Parfum",
    description: "YSL Y Eau de Parfum is a modern aromatic fragrance combining fresh apple, sage and warm woods.",
    shortDescription: "Fresh, modern and aromatic men's fragrance.",
    images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 4200, price: 3700, stock: 18 },
      { size: 10, unit: "ml", labelledPrice: 7200, price: 6200, stock: 12 },
    ],
    fragrance: {
      gender: "Men",
      concentration: "Eau de Parfum",
      season: ["Spring", "Summer", "Autumn"],
      occasion: ["Casual", "Office", "Date Night"],
      longevity: "8-10 hours",
      sillage: "Strong",
    },
    notes: {
      top: ["Apple", "Bergamot", "Ginger"],
      middle: ["Sage", "Juniper", "Geranium"],
      base: ["Amberwood", "Tonka Bean", "Cedar"],
    },
    isFeatured: true,
    isBestSeller: false,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "Carolina Herrera Good Girl",
    slug: "carolina-herrera-good-girl",
    brand: "Carolina Herrera",
    category: "Women",
    type: "Eau de Parfum",
    description: "Good Girl is a sophisticated women's fragrance combining sweet gourmand notes with floral and warm accords.",
    shortDescription: "Sweet, elegant and seductive women's fragrance.",
    images: [
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 4500, price: 3900, stock: 14 },
      { size: 10, unit: "ml", labelledPrice: 7800, price: 6800, stock: 9 },
    ],
    fragrance: {
      gender: "Women",
      concentration: "Eau de Parfum",
      season: ["Autumn", "Winter"],
      occasion: ["Date Night", "Party", "Special Occasion"],
      longevity: "8-10 hours",
      sillage: "Strong",
    },
    notes: {
      top: ["Almond", "Coffee"],
      middle: ["Jasmine", "Tuberose"],
      base: ["Tonka Bean", "Cocoa", "Vanilla"],
    },
    isFeatured: true,
    isBestSeller: true,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "YSL Libre Eau de Parfum",
    slug: "ysl-libre-eau-de-parfum",
    brand: "Yves Saint Laurent",
    category: "Women",
    type: "Eau de Parfum",
    description: "YSL Libre Eau de Parfum is a floral fragrance blending lavender, orange blossom and warm vanilla.",
    shortDescription: "Elegant floral and warm women's fragrance.",
    images: [
      "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 4300, price: 3800, stock: 16 },
      { size: 10, unit: "ml", labelledPrice: 7500, price: 6500, stock: 11 },
    ],
    fragrance: {
      gender: "Women",
      concentration: "Eau de Parfum",
      season: ["Spring", "Autumn", "Winter"],
      occasion: ["Office", "Date Night", "Special Occasion"],
      longevity: "8-10 hours",
      sillage: "Strong",
    },
    notes: {
      top: ["Lavender", "Mandarin Orange"],
      middle: ["Orange Blossom", "Jasmine"],
      base: ["Madagascar Vanilla", "Tonka Bean", "Cedar"],
    },
    isFeatured: true,
    isBestSeller: false,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "Giorgio Armani Acqua di Gio Eau de Parfum",
    slug: "giorgio-armani-acqua-di-gio-eau-de-parfum",
    brand: "Giorgio Armani",
    category: "Men",
    type: "Eau de Parfum",
    description: "Acqua di Gio Eau de Parfum is a fresh marine fragrance with aromatic and woody depth.",
    shortDescription: "Fresh aquatic and woody men's fragrance.",
    images: [
      "https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 3800, price: 3300, stock: 20 },
      { size: 10, unit: "ml", labelledPrice: 6800, price: 5700, stock: 14 },
    ],
    fragrance: {
      gender: "Men",
      concentration: "Eau de Parfum",
      season: ["Spring", "Summer"],
      occasion: ["Casual", "Office", "Party"],
      longevity: "6-8 hours",
      sillage: "Moderate",
    },
    notes: {
      top: ["Marine Notes", "Green Mandarin"],
      middle: ["Lavender", "Rosemary", "Cypress"],
      base: ["Mineral Notes", "Patchouli", "Woody Notes"],
    },
    isFeatured: false,
    isBestSeller: true,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "Lattafa Khamrah",
    slug: "lattafa-khamrah",
    brand: "Lattafa",
    category: "Unisex",
    type: "Eau de Parfum",
    description: "Lattafa Khamrah is a warm gourmand fragrance featuring cinnamon, dates, praline and vanilla.",
    shortDescription: "Sweet, warm and spicy unisex fragrance.",
    images: [
      "https://images.unsplash.com/photo-1590736969596-f485c53af3eb?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 3000, price: 2600, stock: 25 },
      { size: 10, unit: "ml", labelledPrice: 5200, price: 4500, stock: 18 },
    ],
    fragrance: {
      gender: "Unisex",
      concentration: "Eau de Parfum",
      season: ["Autumn", "Winter"],
      occasion: ["Date Night", "Party", "Special Occasion"],
      longevity: "10+ hours",
      sillage: "Very Strong",
    },
    notes: {
      top: ["Cinnamon", "Nutmeg", "Bergamot"],
      middle: ["Dates", "Praline", "Tuberose"],
      base: ["Vanilla", "Tonka Bean", "Amberwood"],
    },
    isFeatured: true,
    isBestSeller: true,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "Maison Francis Kurkdjian Baccarat Rouge 540",
    slug: "maison-francis-kurkdjian-baccarat-rouge-540",
    brand: "Maison Francis Kurkdjian",
    category: "Unisex",
    type: "Eau de Parfum",
    description: "Baccarat Rouge 540 is a luxurious unisex fragrance with an airy, woody and amber character.",
    shortDescription: "Luxurious, airy and amber unisex fragrance.",
    images: [
      "https://images.unsplash.com/photo-1586495777744-4e6b8a8b2b5b?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 6500, price: 5800, stock: 8 },
      { size: 10, unit: "ml", labelledPrice: 12000, price: 10500, stock: 5 },
    ],
    fragrance: {
      gender: "Unisex",
      concentration: "Eau de Parfum",
      season: ["Spring", "Autumn", "Winter"],
      occasion: ["Formal", "Date Night", "Special Occasion"],
      longevity: "10+ hours",
      sillage: "Strong",
    },
    notes: {
      top: ["Saffron", "Jasmine"],
      middle: ["Amberwood", "Ambergris"],
      base: ["Fir Resin", "Cedar"],
    },
    isFeatured: true,
    isBestSeller: true,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "Versace Eros Eau de Toilette",
    slug: "versace-eros-eau-de-toilette",
    brand: "Versace",
    category: "Men",
    type: "Eau de Toilette",
    description: "Versace Eros is a fresh and sweet men's fragrance with mint, vanilla and woody notes.",
    shortDescription: "Fresh, sweet and energetic men's fragrance.",
    images: [
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 3200, price: 2800, stock: 22 },
      { size: 10, unit: "ml", labelledPrice: 5800, price: 5000, stock: 15 },
    ],
    fragrance: {
      gender: "Men",
      concentration: "Eau de Toilette",
      season: ["Spring", "Summer", "Autumn"],
      occasion: ["Casual", "Party", "Date Night"],
      longevity: "6-8 hours",
      sillage: "Strong",
    },
    notes: {
      top: ["Mint", "Green Apple", "Lemon"],
      middle: ["Tonka Bean", "Geranium", "Ambroxan"],
      base: ["Vanilla", "Cedar", "Oakmoss"],
    },
    isFeatured: false,
    isBestSeller: true,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
  {
    name: "Jean Paul Gaultier Le Male Le Parfum",
    slug: "jean-paul-gaultier-le-male-le-parfum",
    brand: "Jean Paul Gaultier",
    category: "Men",
    type: "Parfum",
    description: "Le Male Le Parfum is a warm and sophisticated men's fragrance combining cardamom, lavender, vanilla and woody notes.",
    shortDescription: "Warm, sweet and sophisticated men's fragrance.",
    images: [
      "https://images.unsplash.com/photo-1543422328-f2e28b6b4db5?w=800&q=80",
    ],
    decants: [
      { size: 5, unit: "ml", labelledPrice: 4200, price: 3600, stock: 13 },
      { size: 10, unit: "ml", labelledPrice: 7500, price: 6400, stock: 8 },
    ],
    fragrance: {
      gender: "Men",
      concentration: "Parfum",
      season: ["Autumn", "Winter"],
      occasion: ["Date Night", "Party", "Formal"],
      longevity: "10+ hours",
      sillage: "Strong",
    },
    notes: {
      top: ["Cardamom"],
      middle: ["Lavender", "Iris"],
      base: ["Vanilla", "Oriental Notes", "Woody Notes"],
    },
    isFeatured: true,
    isBestSeller: false,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  },
];

async function seedDatabase() {
  const client = new MongoClient(uri, options);
  try {
    await client.connect();
    console.log('Connected to MongoDB:', uri.split('@')[1]?.split('/')[0]);

    const db = client.db('kyro');
    const collection = db.collection('products');

    // Clear existing products
    const deleted = await collection.deleteMany({});
    console.log(`Deleted ${deleted.deletedCount} existing products`);

    // Insert new products
    const result = await collection.insertMany(products);
    console.log(`Successfully inserted ${result.insertedCount} products`);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();
