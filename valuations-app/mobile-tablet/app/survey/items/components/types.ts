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
  selectedanswer?: string;
  commaseparatedlist?: string;
  /** Template/API: when true with commaseparatedlist, selectedanswer is multi-select (comma-separated) */
  multiSelectAnswer?: boolean;
  rank?: number; // Add rank property for item ordering
  itemtype?: number; // Add itemtype property for database compatibility
  qty?: number; // Add original database qty value for hasDataCaptured function
  excludefromreport?: number; // 0 = not excluded, 1 = excluded (syncs to backend ExcludeFromReport)
  pending_sync?: number; // Local sync queue flag from SQLite
  issynced?: number; // Backend sync state from SQLite/API
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
  onDone: () => void;
  // Sync props
  pendingChangesCount: number;
  syncing: boolean;
  onSync: () => void;
}

export interface PredefinedItemsListProps {
  items: Item[];
  loading: boolean;
  error: string | null;
  categoryTitle: string;
  categoryId: string; // Add categoryId prop
  isOffline: boolean;
  fromCache: boolean;
  fieldConfig?: any[]; // Legacy field configuration for backwards compatibility
  dynamicFieldConfig?: import('../../../../types/dynamicUI').FieldConfiguration[]; // New dynamic field configuration
  categoryConfig?: import('../../../../types/dynamicUI').CategoryConfiguration; // Full config including per-item overrides
  useCustomFields?: boolean; // Whether to use custom field configuration
  groupingStrategy?: import('../../../../types/dynamicUI').GroupingStrategy; // Grouping strategy configuration
  assessmentType?: string; // Assessment type to determine default quantity behavior
  onRefresh?: () => void;
  onSelectItem: (item: Item) => void;
  onAddNewItem?: (addFunction: () => void) => void;
  // Sync functionality exposure
  onSyncStatusChange?: (pendingChangesCount: number, syncing: boolean) => void;
  /** Register sync handler; call with `{ silent: true }` to skip success/error alerts (e.g. Done button). */
  onSyncRequest?: (syncFunction: (options?: { silent?: boolean }) => Promise<void>) => void;
  // Totals calculation exposure
  onTotalsChange?: (itemCount: number, totalValue: number) => void;
  onForceRemount?: () => void;
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
  onDelete?: () => void; // Optional delete callback
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
