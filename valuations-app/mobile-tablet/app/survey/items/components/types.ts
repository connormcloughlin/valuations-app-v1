// Shared types and interfaces for Items components

// Categories with rooms for furniture
export const roomsForCategory: Record<string, string[]> = {
  'cat-2': [
    'Lounge', 'Kitchen', 'Entrance', 'Family', 'Main Bedroom', 'Bedroom 2', 
    'Bedroom 3', 'Dining', 'Study', 'Bathroom 1', 'Bathroom 2', 'Laundry'
  ]
};

// Define the item type to prevent type errors
export interface Item {
  id: string;
  categoryId?: string;
  type: string;
  description: string;
  room: string;
  quantity: string;
  price: string;
  notes: string;
  photo?: string;
  model?: string;
  selection?: string;
}

// Define the API response type
export interface ApiResponse {
  success: boolean;
  data: any[];
  message?: string;
  status?: number;
  fromCache?: boolean;
}

// Props interfaces for components
export interface ItemsSummaryProps {
  userItemsCount: number;
  totalValue: number;
  onAddItem: () => void;
}

export interface PredefinedItemsListProps {
  items: Item[];
  loading: boolean;
  error: string | null;
  categoryTitle: string;
  isOffline: boolean;
  fromCache: boolean;
  onRefresh: () => void;
  onSelectItem: (item: Item) => void;
  onAddNewItem?: (addFunction: () => void) => void;
}

export interface ItemFormProps {
  currentItem: Item;
  onUpdateItem: (item: Item) => void;
  handwritingEnabled: boolean;
  hasRooms: boolean;
  includeRooms: string[];
  photo: string | null;
  onCancel: () => void;
  onSave: () => void;
  onOpenCamera: () => void;
  onOpenHandwriting: (field: keyof Item) => void;
}

export interface UserItemsTableProps {
  items: Item[];
  totalValue: number;
  onDeleteItem: (itemId: string) => void;
}

export interface HandwritingModalProps {
  visible: boolean;
  currentField: keyof Item;
  paths: {path: string; color: string}[];
  currentPath: string;
  strokeColor: string;
  recognizedText: string;
  onClose: () => void;
  onTouchStart: (event: any) => void;
  onTouchMove: (event: any) => void;
  onTouchEnd: () => void;
  onClearCanvas: () => void;
  onRecognizeHandwriting: () => void;
  onConfirmHandwriting: () => void;
}

export interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onSelectFromGallery: () => void;
}

export interface ItemStatesProps {
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  isOffline?: boolean;
  fromCache?: boolean;
} 