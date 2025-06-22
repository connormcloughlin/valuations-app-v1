import axios from 'axios';

// Mock data - this would come from the SQL database
const mockCategoryItems = {
  'a1': [ // ANTIQUES
    { type: 'Clocks', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Furniture', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Ornaments', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Paintings', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Silverware', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a2': [ // VALUABLE ARTWORKS
    { type: 'Oil Paintings', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Watercolor Paintings', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Sculptures', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Limited Edition Prints', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Wall Hangings', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Art Glass', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a3': [ // VALUABLE CARPETS
    { type: 'Persian Carpets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Oriental Rugs', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Turkish Carpets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Silk Rugs', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Antique Carpets', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a4': [ // COLLECTIONS - COINS / STAMPS
    { type: 'Rare Coins', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Commemorative Coins', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Gold Coins', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Rare Stamps', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'First Day Covers', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Stamp Albums', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a5': [ // VALUABLE ORNAMENTS
    { type: 'Crystal Vases', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Porcelain Figurines', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Glass Sculptures', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Bone China', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Decorative Bowls', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Collectible Plates', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a6': [ // FIREARMS, BOWS
    { type: 'Hunting Rifles', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Shotguns', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Compound Bows', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Recurve Bows', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Crossbows', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Gun Cases', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Ammunition Boxes', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a7': [ // CLOTHING (GENTS / BOYS)
    { type: 'Belts', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Hats / Gloves / Scarves', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Jackets / Blazers', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Leather / Suede Jackets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Long Trousers / Jeans', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Pullovers / Cardigans', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Raincoats / Overcoats', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Shirts / T-Shirts', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Shoes / Boots', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Shorts / Swimming Trunks', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Socks / Underwear / Sleepwear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Sports Wear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Suits', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Ties', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Tracksuits', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a8': [ // CLOTHING (LADIES / GIRLS)
    { type: 'Belts / Scarves', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Blouses / Tops', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Dresses', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Evening Wear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Handbags', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Jackets / Blazers', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Leather / Suede Jackets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Long Trousers / Jeans', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Pullovers / Cardigans', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Raincoats / Overcoats', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Shoes / Boots', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Skirts', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Sleepwear / Underwear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Sports Wear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Suits', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a9': [ // CLOTHING (CHILDREN / BABIES)
    { type: 'Baby Clothes (0-2 years)', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Toddler Clothes (2-4 years)', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Children Clothes (4-12 years)', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'School Uniforms', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Sports Uniforms', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Shoes / Boots', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Winter Wear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Swimming Wear', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a10': [ // JEWELLERY
    { type: 'Bracelets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Necklaces', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Rings', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Earrings', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Watches', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Brooches', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Cufflinks', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Jewellery Boxes', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a11': [ // FURNITURE
    { type: 'Dining Room Suite', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Lounge Suite', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Bedroom Suite', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Office Furniture', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Patio Furniture', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a12': [ // LINEN
    { type: 'Bedding', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Towels', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Table Linen', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Duvets / Quilts', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Pillows', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Blankets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Curtains / Drapes', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a13': [ // LUGGAGE CONTAINERS
    { type: 'Suitcases', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Travel Bags', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Storage Boxes', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Briefcases', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Backpacks', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Storage Trunks', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a14': [ // PERSONAL EFFECTS
    { type: 'Books', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'CDs / DVDs', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Personal Care Items', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Perfumes / Cosmetics', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Eyewear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Musical Instruments', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Hobby Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a15': [ // SPORTS EQUIPMENT
    { type: 'Exercise Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Sports Gear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Bicycles', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Golf Clubs', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Tennis Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Fishing Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Camping Gear', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Water Sports Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'a16': [ // OUTDOOR EQUIPMENT
    { type: 'Garden Tools', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Camping Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Outdoor Furniture', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'BBQ / Braai Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Pool Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Outdoor Lighting', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'b1': [ // DOMESTIC APPLIANCES
    { type: 'Deepfreeze', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Dishwasher', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Fridge', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Garden Vacuum', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Hardwyer / Styler', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Heaters / Fans', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Hostess Trolley', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Lawnmower', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Microwave', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Mixer / Blender', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Overlocking', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Washing Machine', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Tumble Dryer', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Coffee Machine', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Food Processor', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'b2': [ // KITCHENWARE
    { type: 'Pots and Pans', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Cutlery', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Crockery', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Kitchen Utensils', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Storage Containers', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Bakeware', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Glassware', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Serving Dishes', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'b3': [ // PHOTOGRAPHIC EQUIPMENT
    { type: 'Digital Cameras', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Camera Lenses', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Camera Flashes', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Tripods / Stands', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Camera Bags', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Memory Cards', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Studio Lighting', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Video Cameras', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'b4': [ // POWER TOOLS
    { type: 'Drills / Drivers', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Sanders / Grinders', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Saws (Circular, Jig, etc)', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Power Washers', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Air Compressors', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Welding Equipment', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Tool Sets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Work Benches', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'b5': [ // VISUAL, SOUND, COMPUTER
    { type: 'Television Sets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Home Theatre Systems', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Sound Systems', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Desktop Computers', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Laptops', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Tablets', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Printers / Scanners', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Gaming Consoles', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Computer Monitors', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Computer Accessories', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'b6': [ // HIGH RISK ITEMS
    { type: 'Fine Jewellery', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Luxury Watches', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Valuable Art Pieces', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Rare Collectibles', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Designer Handbags', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Antique Items', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Rare Books', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Musical Instruments', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ]
};

// Mock API endpoints
const categoryItemsApi = {
  // Get predefined items for a specific category
  getCategoryItems: async (categoryId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate API response
    if (mockCategoryItems[categoryId]) {
      return {
        success: true,
        data: mockCategoryItems[categoryId].map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9) // Generate unique ID
        }))
      };
    }
    
    // Return empty array if category not found
    return {
      success: true,
      data: []
    };
  },

  // Save updated items for a category
  saveCategoryItems: async (categoryId, items) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real API, this would update the database
    // For now, just return success
    return {
      success: true,
      message: 'Items saved successfully'
    };
  }
};

export default categoryItemsApi; 