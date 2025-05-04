// Mock data for category items - shared between web and mobile versions
// TODO: Move this to a backend API service

// Mock data - this would come from the SQL database
const mockCategoryItems = {
  'a1': [ // ANTIQUES
    { type: 'Clocks', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Furniture', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Ornaments', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Paintings', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Silverware', description: '', model: '', selection: '', price: '0', quantity: 0 }
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
    { type: 'Jackets / Blazers', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'b1': [ // DOMESTIC APPLIANCES
    { type: 'Deepfreeze', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Dishwasher', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Fridge', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Microwave', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Washing Machine', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Tumble Dryer', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Coffee Machine', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'cat-1': [ // For backward compatibility with existing mock data in items.tsx
    { type: 'Belts', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Hats / Gloves / Scarves', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Jackets / Blazers', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Shirts / T-Shirts', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Shoes / Boots', description: '', model: '', selection: '', price: '0', quantity: 0 }
  ],
  'cat-2': [ // FURNITURE (backward compatibility)
    { type: 'Sofa', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Coffee Table', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Dining Table', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Chairs', description: '', model: '', selection: '', price: '0', quantity: 0 },
    { type: 'Bed Frame', description: '', model: '', selection: '', price: '0', quantity: 0 }
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
          id: Math.random().toString(36).substring(2, 9) // Generate unique ID
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
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Simulate successful save
    return {
      success: true,
      data: items
    };
  }
};

export default categoryItemsApi; 