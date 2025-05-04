/**
 * Category configuration file
 * 
 * This file defines all available categories and their required fields
 * Use this to configure which fields should be displayed for each category
 */

export interface CategoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiline';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
}

export interface CategoryConfig {
  id: string;
  title: string;
  section: 'A' | 'B';
  description?: string;
  includeRooms: boolean;
  fields: CategoryField[];
}

// Define all available fields
const FIELDS = {
  description: {
    key: 'description',
    label: 'Description',
    type: 'text' as const,
    required: true,
    placeholder: 'Enter item description'
  },
  quantity: {
    key: 'quantity',
    label: 'Quantity',
    type: 'number' as const,
    required: true,
    placeholder: '1'
  },
  price: {
    key: 'price',
    label: 'Price (R)',
    type: 'number' as const,
    required: true,
    placeholder: '0.00'
  },
  notes: {
    key: 'notes',
    label: 'Notes',
    type: 'multiline' as const,
    required: false,
    placeholder: 'Enter any additional notes'
  },
  make: {
    key: 'make',
    label: 'Make',
    type: 'text' as const,
    required: false,
    placeholder: 'Enter make/brand'
  },
  model: {
    key: 'model',
    label: 'Model',
    type: 'text' as const,
    required: false,
    placeholder: 'Enter model number'
  },
  room: {
    key: 'room',
    label: 'room',
    type: 'text' as const,
    required: false,
    placeholder: 'Enter model number'
  },
  serialNumber: {
    key: 'serialNumber',
    label: 'Serial Number',
    type: 'text' as const,
    required: false,
    placeholder: 'Enter serial number'
  }
};

// Define all category configurations
const categories: CategoryConfig[] = [
  // Section A Categories
  {
    id: 'antiques',
    title: 'Antiques',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'valuable-artworks',
    title: 'Valuable Artworks',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'valuable-carpets',
    title: 'Valuable Carpets',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'collections-coins-stamps',
    title: 'Collections (Coins/Stamps)',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'valuable-ornaments',
    title: 'Valuable Ornaments',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'firearms',
    title: 'Firearms',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.make,
      FIELDS.model,
      FIELDS.serialNumber,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'bows',
    title: 'Bows',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.make,
      FIELDS.model,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'outdoor-equipment',
    title: 'Outdoor Equipment',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.quantity,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'clothing-gents-boys',
    title: 'Clothing (Gents/Boys)',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'clothing-ladies-girls',
    title: 'Clothing (Ladies/Girls)',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'clothing-children-babies',
    title: 'Clothing (Children/Babies)',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'jewellery',
    title: 'Jewellery',
    section: 'A',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  
  // Section B Categories
  {
    id: 'domestic-appliances',
    title: 'Domestic Appliances',
    section: 'B',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.make,
      FIELDS.model,
      FIELDS.serialNumber,
      FIELDS.quantity,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'audio-visual-equipment',
    title: 'Audio Visual Equipment',
    section: 'B',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.make,
      FIELDS.model,
      FIELDS.serialNumber,
      FIELDS.quantity,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'computers',
    title: 'Computers & Equipment',
    section: 'B',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.make,
      FIELDS.model,
      FIELDS.serialNumber,
      FIELDS.quantity,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'photography-equipment',
    title: 'Photography Equipment',
    section: 'B',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.make,
      FIELDS.model,
      FIELDS.serialNumber,
      FIELDS.quantity,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'furniture',
    title: 'Furniture',
    section: 'B',
    includeRooms: true,
    fields: [
      FIELDS.room,
      FIELDS.description,
      FIELDS.quantity,
      FIELDS.price,
      FIELDS.notes
    ]
  },
  {
    id: 'kitchenware',
    title: 'Kitchenware',
    section: 'B',
    includeRooms: true,
    fields: [
      FIELDS.description,
      FIELDS.quantity,
      FIELDS.price,
      FIELDS.notes
    ]
  }
];

/**
 * Helper function to get category configuration by ID
 */
export const getCategoryConfig = (categoryId: string): CategoryConfig | undefined => {
  return categories.find(category => category.id === categoryId);
};

/**
 * Helper function to get all categories for a specific section
 */
export const getCategoriesBySection = (section: 'A' | 'B'): CategoryConfig[] => {
  return categories.filter(category => category.section === section);
};

/**
 * Get all available rooms for a specific category
 */
export const getRoomsForCategory = (categoryId: string): string[] => {
  // This could be further enhanced to have different rooms per category
  // For now, using the existing roomsForCategory implementation
  const roomMap: Record<string, string[]> = {
    'antiques': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
    'valuable-artworks': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
    'valuable-carpets': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
    'collections-coins-stamps': ['Study', 'Bedroom', 'Other'],
    'valuable-ornaments': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Other'],
    'firearms': ['Study', 'Bedroom', 'Safe', 'Other'],
    'bows': ['Study', 'Bedroom', 'Garage', 'Other'],
    'outdoor-equipment': ['Garage', 'Garden', 'Shed', 'Other'],
    'clothing-gents-boys': ['Bedroom', 'Closet', 'Other'],
    'clothing-ladies-girls': ['Bedroom', 'Closet', 'Other'],
    'clothing-children-babies': ['Bedroom', 'Closet', 'Other'],
    'jewellery': ['Bedroom', 'Safe', 'Other'],
    'domestic-appliances': ['Kitchen', 'Laundry Room', 'Living Room', 'Bedroom', 'Other'],
    'audio-visual-equipment': ['Living Room', 'Bedroom', 'Study', 'Other'],
    'computers': ['Study', 'Bedroom', 'Living Room', 'Other'],
    'photography-equipment': ['Study', 'Bedroom', 'Other'],
    'furniture': ['Living Room', 'Dining Room', 'Bedroom', 'Study', 'Kitchen', 'Other'],
    'kitchenware': ['Kitchen', 'Dining Room', 'Other'],
  };
  
  return roomMap[categoryId] || [];
};

export default categories; 