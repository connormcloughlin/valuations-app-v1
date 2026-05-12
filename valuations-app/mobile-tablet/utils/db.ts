import * as SQLite from 'expo-sqlite';

// Initialize database using the new async API
let db: SQLite.SQLiteDatabase | null = null;
let isDbReady = false;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

// Track initialization attempts to prevent excessive retries
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

interface SQLiteResult {
  rows: {
    _array: any[];
    length: number;
  };
  rowsAffected: number;
  insertId?: number | null;
}

// Ensure database is ready before operations
async function ensureDbReady(): Promise<SQLite.SQLiteDatabase> {
  if (isDbReady && db) {
    return db;
  }
  
  if (initPromise) {
    // If initialization is in progress, wait for it
    console.log('📋 Database initialization already in progress, waiting...');
    return await initPromise;
  }
  
  // Prevent excessive initialization attempts
  if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
    throw new Error(`Database initialization failed after ${MAX_INIT_ATTEMPTS} attempts`);
  }
  
  // Start initialization
  initializationAttempts++;
  console.log(`📋 Starting database initialization (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})`);
  initPromise = initializeDatabase();
  
  try {
    const result = await initPromise;
    initializationAttempts = 0; // Reset counter on success
    return result;
  } catch (error) {
    initPromise = null; // Clear promise on failure so it can be retried
    throw error;
  }
}

// Export function to check if database is ready
export function isDatabaseReady(): boolean {
  return isDbReady && !!db;
}

// Export function to wait for database to be ready
export async function waitForDatabase(): Promise<SQLite.SQLiteDatabase> {
  return await ensureDbReady();
}

// Initialize the database
export async function initializeDatabase() {
  try {
    // Check if database is already initialized and working
    if (isDbReady && db) {
      try {
        // Test the connection to make sure it's still valid
        await db.execAsync('SELECT 1');
        console.log('✅ Database already initialized and working');
        return db;
      } catch (connectionError) {
        console.log('⚠️ Database connection lost, reinitializing...');
        // Connection is lost, need to reinitialize
        isDbReady = false;
        db = null;
      }
    }
    
    console.log('🗄️ Initializing database...');
    
    // Close existing connection if any
    if (db) {
      try {
        await db.closeAsync();
      } catch (closeError) {
        console.log('⚠️ Error closing existing connection:', closeError);
      }
      db = null;
      isDbReady = false;
    }
    
    // Open new connection
    db = await SQLite.openDatabaseAsync('valuations.db');
    console.log('✅ Database opened successfully');
    
    // Optimize SQLite settings to prevent "database or disk is full" errors
    try {
      // Set WAL mode for better concurrency (but we'll checkpoint regularly)
      await db.execAsync('PRAGMA journal_mode = WAL');
      
      // Set page size for better performance (default is usually 4096)
      await db.execAsync('PRAGMA page_size = 4096');
      
      // Limit WAL file size to prevent it from growing too large (10MB max)
      await db.execAsync('PRAGMA wal_autocheckpoint = 1000'); // Checkpoint every 1000 pages (~4MB)
      
      // Set cache size (negative value = KB, so -2000 = 2MB cache)
      await db.execAsync('PRAGMA cache_size = -2000');
      
      // Enable foreign keys
      await db.execAsync('PRAGMA foreign_keys = ON');
      
      // Set synchronous mode to NORMAL (faster than FULL, safer than OFF)
      await db.execAsync('PRAGMA synchronous = NORMAL');
      
      // Set temp store to memory for better performance
      await db.execAsync('PRAGMA temp_store = MEMORY');
      
      console.log('✅ SQLite optimizations applied');
    } catch (pragmaError) {
      console.warn('⚠️ Could not apply all SQLite optimizations:', pragmaError);
    }
    
    // Create tables
    await createTables();
    
    // Run database migrations
    await migrateDb();
    
    // Perform initial WAL checkpoint to clean up any existing WAL file
    try {
      await checkpointWal();
    } catch (checkpointError) {
      console.warn('⚠️ Initial WAL checkpoint failed (non-critical):', checkpointError);
    }
    
    // Mark database as ready
    isDbReady = true;
    console.log('✅ Database initialized');
    
    return db;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    db = null;
    isDbReady = false;
    initPromise = null;
    throw error;
  }
}

// Ensure database connection
async function ensureDatabaseConnection() {
  const now = Date.now();
  if (!db || now - lastConnectionCheck > CONNECTION_CHECK_INTERVAL) {
    try {
      if (!db) {
        await initializeDatabase();
      } else {
        // Test the connection
        await db.execAsync('SELECT 1');
      }
      lastConnectionCheck = now;
    } catch (error) {
      console.error('Database connection check failed:', error);
      await initializeDatabase();
    }
  }
}

/**
 * Checkpoint WAL file to prevent it from growing too large
 * This helps prevent "database or disk is full" errors
 */
async function checkpointWal(): Promise<void> {
  try {
    if (!db) {
      await ensureDbReady();
    }
    if (db) {
      // Checkpoint the WAL file (merges WAL into main database)
      await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');
      console.log('✅ WAL checkpoint completed');
    }
  } catch (error) {
    console.error('❌ Error during WAL checkpoint:', error);
    throw error;
  }
}

// Track last checkpoint time to avoid excessive checkpointing
let lastCheckpointTime = 0;
const CHECKPOINT_INTERVAL = 5 * 60 * 1000; // Checkpoint every 5 minutes

// Detect if an error indicates the native DB was released or invalid (stale/null handle)
function isReleasedOrInvalidDbError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('already released') ||
    msg.includes('Cannot use shared object') ||
    msg.includes('NullPointerException') ||
    (msg.includes('prepareAsync') && (msg.includes('Integer') || msg.includes('rejected')))
  );
}

// Helper to run SQL with promise
export async function runSql(sql: string, params: any[] = []): Promise<SQLiteResult> {
  await ensureDatabaseConnection();

  if (!db) {
    throw new Error('Database not initialized');
  }

  // Periodically checkpoint WAL to prevent it from growing too large
  const now = Date.now();
  if (now - lastCheckpointTime > CHECKPOINT_INTERVAL) {
    try {
      await checkpointWal();
      lastCheckpointTime = now;
    } catch (checkpointError) {
      // Don't fail the operation if checkpoint fails
      console.warn('⚠️ Background WAL checkpoint failed (non-critical):', checkpointError);
    }
  }

  const run = async (database: SQLite.SQLiteDatabase): Promise<SQLiteResult> => {
    if (sql.trim().toLowerCase().startsWith('select')) {
      const result = await database.getAllAsync(sql, ...params);
      return {
        rows: { _array: result, length: result.length },
        rowsAffected: 0,
        insertId: null
      };
    } else {
      const result = await database.runAsync(sql, ...params);
      return {
        rows: { _array: [], length: 0 },
        rowsAffected: result.changes,
        insertId: result.lastInsertRowId
      };
    }
  };

  try {
    return await run(db);
  } catch (error) {
    if (isReleasedOrInvalidDbError(error)) {
      console.warn('⚠️ Database connection was released, reinitializing and retrying...');
      isDbReady = false;
      db = null;
      initPromise = null;
      await ensureDatabaseConnection();
      if (!db) throw new Error('Database not initialized');
      return await run(db);
    }
    console.error('Error executing SQL:', sql, params, error);
    throw error;
  }
}

// Create all tables
export async function createTables() {
  try {
    console.log('🗄️ Creating database tables...');
    
    // Use the db variable that should be set by initializeDatabase
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    // Check if tables already exist to avoid redundant creation
    const tablesExist = await checkTablesExist();
    if (tablesExist) {
      console.log('✅ Database tables already exist, skipping creation');
      // Still run migrations in case schema has changed
      await migrateDatabase();
      return;
    }
    
    // Create tables using execAsync for DDL operations
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS appointments (
        appointmentID INTEGER PRIMARY KEY,
        orderID INTEGER,
        startTime TEXT,
        endTime TEXT,
        followUpDate TEXT,
        arrivalTime TEXT,
        departureTime TEXT,
        inviteStatus TEXT,
        meetingStatus TEXT,
        location TEXT,
        comments TEXT,
        category TEXT,
        outoftown TEXT,
        surveyorComments TEXT,
        eventId TEXT,
        surveyorEmail TEXT,
        dateModified TEXT,
        pending_sync INTEGER DEFAULT 0
      );
    `);
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS risk_assessment_master (
        riskassessmentid INTEGER PRIMARY KEY,
        assessmenttypename TEXT,
        surveydate TEXT,
        clientnumber TEXT,
        comments TEXT,
        totalvalue REAL,
        iscomplete INTEGER,
        pending_sync INTEGER DEFAULT 0
      );
    `);
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS risk_assessment_items (
        riskassessmentitemid INTEGER PRIMARY KEY,
        riskassessmentcategoryid INTEGER,
        itemprompt TEXT,
        itemtype INTEGER,
        rank INTEGER,
        commaseparatedlist TEXT,
        selectedanswer TEXT,
        qty INTEGER,
        price REAL,
        description TEXT,
        model TEXT,
        location TEXT,
        assessmentregisterid INTEGER,
        assessmentregistertypeid INTEGER,
        datecreated TEXT,
        createdbyid TEXT,
        dateupdated TEXT,
        updatedbyid TEXT,
        issynced INTEGER,
        syncversion INTEGER,
        deviceid TEXT,
        syncstatus TEXT,
        synctimestamp TEXT,
        hasphoto INTEGER,
        latitude REAL,
        longitude REAL,
        notes TEXT,
        pending_sync INTEGER DEFAULT 0,
        appointmentid TEXT,
        isDeleted INTEGER DEFAULT 0,
        excludefromreport INTEGER DEFAULT 0
      );
    `);
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS media_files (
        MediaID INTEGER PRIMARY KEY AUTOINCREMENT,
        BackendMediaID INTEGER, -- Store the actual media ID from backend
        FileName TEXT NOT NULL,
        FileType TEXT NOT NULL,
        BlobURL TEXT NOT NULL,
        EntityName TEXT NOT NULL,
        EntityID INTEGER NOT NULL,
        UploadedAt TEXT NOT NULL,
        UploadedBy TEXT,
        IsDeleted INTEGER NOT NULL DEFAULT 0,
        Metadata TEXT,
        LocalPath TEXT,
        pending_sync INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS category_configurations (
        categoryId INTEGER PRIMARY KEY,
        categoryName TEXT NOT NULL,
        sectionName TEXT,
        templateName TEXT,
        categoryRank INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        fields TEXT,
        groupingStrategy TEXT,
        locationTemplates TEXT,
        summary TEXT,
        lastUpdated TEXT,
        itemFieldConfigs TEXT
      );
    `);
    
    // Create performance indexes for efficient queries
    console.log('Creating database indexes for performance...');
    
    // Index for risk assessment items by category (most common query)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_items_category 
      ON risk_assessment_items(riskassessmentcategoryid);
    `);
    
    // Index for risk assessment items by appointment
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_items_appointment 
      ON risk_assessment_items(appointmentid);
    `);
    
    // Index for media files by entity (already exists but ensure it's created)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_media_entity 
      ON media_files(EntityName, EntityID);
    `);
    
    // Index for media files by sync status (for efficient sync queries)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_media_pending_sync 
      ON media_files(pending_sync, IsDeleted);
    `);
    
    // Index for media files by deletion status (for cleanup queries)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_media_deleted 
      ON media_files(IsDeleted, EntityName, EntityID);
    `);
    
    // Index for appointments by sync status
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_appointments_sync 
      ON appointments(pending_sync);
    `);
    
    console.log('✅ Database indexes created');
    
    // Create performance indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_items_category 
      ON risk_assessment_items(riskassessmentcategoryid);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_items_appointment 
      ON risk_assessment_items(appointmentid);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_items_pending_sync 
      ON risk_assessment_items(pending_sync);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_appointments_status 
      ON appointments(inviteStatus);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_appointments_order 
      ON appointments(orderID);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_media_entity 
      ON media_files(EntityName, EntityID);
    `);
    
    console.log('✅ Database tables and indexes created');
    
    // Run migrations
    await migrateDatabase();
    
    console.log('✅ Database initialization completed');
    
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    // Don't throw the error, just log it and continue
    console.log('Continuing despite table creation error');
  }
}

// Check if all required tables exist
async function checkTablesExist(): Promise<boolean> {
  try {
    if (!db) return false;
    
    const requiredTables = [
      'appointments',
      'risk_assessment_master', 
      'risk_assessment_items',
      'media_files',
      'category_configurations'
    ];
    
    for (const tableName of requiredTables) {
      const result = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      
      if (result.length === 0) {
        console.log(`📋 Table ${tableName} does not exist`);
        return false;
      }
    }
    
    console.log('✅ All required tables exist');
    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return false;
  }
}

// Add migration function
export async function migrateDatabase() {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Check if appointmentid column exists using execAsync
    const tableInfo = await db.getAllAsync("PRAGMA table_info(risk_assessment_items)") as Array<{ name: string }>;
    
    const hasAppointmentId = tableInfo.some(col => col.name === 'appointmentid');
    
    if (!hasAppointmentId) {
      console.log('🔄 Adding appointmentid column to risk_assessment_items...');
      await db.execAsync('ALTER TABLE risk_assessment_items ADD COLUMN appointmentid TEXT');
      console.log('✅ appointmentid column added');
    } else {
      console.log('ℹ️ appointmentid column already exists');
    }

    const hasExcludeFromReport = tableInfo.some(col => col.name === 'excludefromreport');
    if (!hasExcludeFromReport) {
      console.log('🔄 Adding excludefromreport column to risk_assessment_items...');
      await db.execAsync('ALTER TABLE risk_assessment_items ADD COLUMN excludefromreport INTEGER DEFAULT 0');
      console.log('✅ excludefromreport column added');
    } else {
      console.log('ℹ️ excludefromreport column already exists');
    }

    // Migrate category_configurations table
    const catTableInfo = await db.getAllAsync("PRAGMA table_info(category_configurations)") as Array<{ name: string }>;
    const hasItemFieldConfigs = catTableInfo.some(col => col.name === 'itemFieldConfigs');
    if (!hasItemFieldConfigs) {
      console.log('🔄 Adding itemFieldConfigs column to category_configurations...');
      await db.execAsync('ALTER TABLE category_configurations ADD COLUMN itemFieldConfigs TEXT');
      console.log('✅ itemFieldConfigs column added');
    } else {
      console.log('ℹ️ itemFieldConfigs column already exists');
    }

    // Check if BackendMediaID column exists in media_files table
    const mediaTableInfo = await db.getAllAsync("PRAGMA table_info(media_files)") as Array<{ name: string }>;
    const hasBackendMediaId = mediaTableInfo.some(col => col.name === 'BackendMediaID');
    
    if (!hasBackendMediaId) {
      console.log('🔄 Adding BackendMediaID column to media_files...');
      await db.execAsync('ALTER TABLE media_files ADD COLUMN BackendMediaID INTEGER');
      console.log('✅ BackendMediaID column added');
    } else {
      console.log('ℹ️ BackendMediaID column already exists');
    }

    // Pending section clone mutations (offline queue — see sectionCloneService)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_section_clones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_mutation_id TEXT NOT NULL UNIQUE,
        risk_assessment_id TEXT NOT NULL,
        source_section_id TEXT NOT NULL,
        target_section_name TEXT,
        order_number TEXT NOT NULL,
        appointment_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT
      );
    `);

    // Offline materialized section clones (local structure + SQLite items until server reconcile)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_materialized_section_clones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_mutation_id TEXT NOT NULL UNIQUE,
        risk_assessment_id TEXT NOT NULL,
        source_section_id TEXT NOT NULL,
        target_section_name TEXT,
        order_number TEXT NOT NULL,
        appointment_id TEXT NOT NULL,
        local_section_id TEXT NOT NULL,
        structure_json TEXT NOT NULL,
        server_section_id TEXT,
        sync_state TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    await db.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_offline_mat_section_appointment ON offline_materialized_section_clones(appointment_id, sync_state);`
    );
    
    console.log('✅ Database migration completed');
    
    // Update existing media files with backend IDs
    await updateMediaFilesWithBackendIds();
  } catch (error) {
    console.error('❌ Database migration error:', error);
    throw error;
  }
}

// --- Types ---
export interface Appointment {
  appointmentID: number;
  orderID: number;
  startTime: string;
  endTime: string;
  followUpDate: string;
  arrivalTime: string;
  departureTime: string;
  inviteStatus: string;
  meetingStatus: string;
  location: string;
  comments: string;
  category: string;
  outoftown: string;
  surveyorComments: string;
  eventId: string;
  surveyorEmail: string;
  dateModified: string;
  pending_sync?: number;
}

export interface RiskAssessmentMaster {
  riskassessmentid: number;
  assessmenttypename: string;
  surveydate: string;
  clientnumber: string;
  comments: string;
  totalvalue: number;
  iscomplete: number;
  pending_sync?: number;
}

export interface RiskAssessmentItem {
  riskassessmentitemid: number;
  riskassessmentcategoryid: number;
  itemprompt: string;
  itemtype: number;
  rank: number;
  commaseparatedlist: string;
  selectedanswer: string;
  /** null = quantity not set / blank in UI */
  qty: number | null;
  price: number;
  description: string;
  model: string;
  location: string;
  assessmentregisterid: number;
  assessmentregistertypeid: number;
  datecreated: string;
  createdbyid: string;
  dateupdated: string;
  updatedbyid: string;
  issynced: number;
  syncversion: number;
  deviceid: string;
  syncstatus: string;
  synctimestamp: string;
  hasphoto: number;
  latitude: number;
  longitude: number;
  notes: string;
  pending_sync?: number;
  appointmentid?: string;
  isDeleted?: number;
  excludefromreport?: number;
}

/** Queued POST /sections/clone when user was offline (see sectionCloneService). */
export interface PendingSectionCloneRow {
  id: number;
  client_mutation_id: string;
  risk_assessment_id: string;
  source_section_id: string;
  target_section_name: string | null;
  order_number: string;
  appointment_id: string;
  created_at: string;
  attempts: number;
  last_error: string | null;
}

export interface MediaFile {
  MediaID?: number;
  BackendMediaID?: number; // Store the actual media ID from backend
  FileName: string;
  FileType: string;
  BlobURL: string;
  EntityName: string;
  EntityID: number;
  UploadedAt: string;
  UploadedBy?: string;
  IsDeleted: number;
  Metadata?: string;
  pending_sync?: number;
  LocalPath?: string; // For offline storage
}

// --- CRUD for Appointments ---
export async function insertAppointment(a: Appointment) {
  await runSql(
    `INSERT OR REPLACE INTO appointments (
      appointmentID, orderID, startTime, endTime, followUpDate, arrivalTime, departureTime,
      inviteStatus, meetingStatus, location, comments, category, outoftown, surveyorComments,
      eventId, surveyorEmail, dateModified, pending_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      a.appointmentID, a.orderID, a.startTime, a.endTime, a.followUpDate, a.arrivalTime, a.departureTime,
      a.inviteStatus, a.meetingStatus, a.location, a.comments, a.category, a.outoftown, a.surveyorComments,
      a.eventId, a.surveyorEmail, a.dateModified, a.pending_sync ?? 1
    ]
  );
}
export async function getAllAppointments(): Promise<Appointment[]> {
  const res = await runSql('SELECT * FROM appointments');
  return res.rows._array;
}

export async function getAppointmentById(id: number): Promise<Appointment | undefined> {
  const res = await runSql('SELECT * FROM appointments WHERE appointmentID = ?', [id]);
  return res.rows.length > 0 ? res.rows._array[0] : undefined;
}
export async function updateAppointment(a: Appointment) {
  await insertAppointment(a);
}

// Delete appointment from SQLite by appointmentID (supports both string and number IDs)
export async function deleteAppointment(appointmentID: number | string): Promise<void> {
  try {
    const id = typeof appointmentID === 'string' ? parseInt(appointmentID, 10) : appointmentID;
    if (isNaN(id)) {
      throw new Error(`Invalid appointment ID: ${appointmentID}`);
    }
    
    const database = await ensureDbReady();
    
    // Use transaction to delete appointment and associated media files
    await database.withTransactionAsync(async () => {
      // Delete associated media files for this appointment
      // Media files are linked via EntityID (which is the appointmentID for appointment-level photos)
      // or via risk assessment items that belong to this appointment
      const mediaResult = await database.runAsync(
        'DELETE FROM media_files WHERE EntityName = ? AND EntityID = ?',
        ['appointment', id]
      );
      console.log(`🗑️ Deleted ${mediaResult.changes} media files associated with appointment ${id}`);
      
      // Also delete media files linked via risk assessment items
      // First get all risk assessment items for this appointment
      const itemsResult = await database.getAllAsync(
        'SELECT riskassessmentitemid FROM risk_assessment_items WHERE appointmentid = ?',
        [id.toString()]
      );
      
      if (itemsResult && itemsResult.length > 0) {
        const itemIds = itemsResult.map((item: any) => item.riskassessmentitemid);
        const placeholders = itemIds.map(() => '?').join(',');
        const mediaItemsResult = await database.runAsync(
          `DELETE FROM media_files WHERE EntityName = ? AND EntityID IN (${placeholders})`,
          ['risk_assessment_item', ...itemIds]
        );
        console.log(`🗑️ Deleted ${mediaItemsResult.changes} media files associated with risk assessment items for appointment ${id}`);
      }
      
      // Delete the appointment itself
      const result = await database.runAsync('DELETE FROM appointments WHERE appointmentID = ?', [id]);
      console.log(`🗑️ Deleted appointment ${id} from SQLite (${result.changes} row(s) affected)`);
    });
    
  } catch (error) {
    console.error(`Error deleting appointment ${appointmentID} from SQLite:`, error);
    throw error;
  }
}

/**
 * Delete all SQLite records for a given order/appointment when submitted for QA.
 * Removes: appointments (by orderID), risk_assessment_master (by orderId), risk_assessment_items
 * (by appointment), and associated media_files.
 */
export async function deleteAllDataForOrder(orderId: number): Promise<void> {
  try {
    const database = await ensureDbReady();

    await database.withTransactionAsync(async () => {
      // 1. Get all appointment IDs for this order
      const appointments = await database.getAllAsync(
        'SELECT appointmentID FROM appointments WHERE orderID = ?',
        [orderId]
      ) as Array<{ appointmentID: number }>;

      for (const row of appointments) {
        const aptId = row.appointmentID;
        // Delete media for this appointment
        await database.runAsync(
          'DELETE FROM media_files WHERE EntityName = ? AND EntityID = ?',
          ['appointment', aptId]
        );
        // Get risk assessment item IDs for this appointment
        const items = await database.getAllAsync(
          'SELECT riskassessmentitemid FROM risk_assessment_items WHERE appointmentid = ?',
          [aptId.toString()]
        ) as Array<{ riskassessmentitemid: number }>;
        if (items.length > 0) {
          const itemIds = items.map((i) => i.riskassessmentitemid);
          const placeholders = itemIds.map(() => '?').join(',');
          await database.runAsync(
            `DELETE FROM media_files WHERE EntityName = ? AND EntityID IN (${placeholders})`,
            ['risk_assessment_item', ...itemIds]
          );
        }
        // Delete risk assessment items for this appointment
        await database.runAsync(
          'DELETE FROM risk_assessment_items WHERE appointmentid = ?',
          [aptId.toString()]
        );
      }

      // 2. Delete appointments for this order
      const aptResult = await database.runAsync('DELETE FROM appointments WHERE orderID = ?', [orderId]);
      console.log(`🗑️ Deleted ${aptResult.changes} appointment(s) for order ${orderId}`);

      // 3. Delete risk assessment master for this order (riskassessmentid = orderId)
      const masterResult = await database.runAsync(
        'DELETE FROM risk_assessment_master WHERE riskassessmentid = ?',
        [orderId]
      );
      console.log(`🗑️ Deleted ${masterResult.changes} risk_assessment_master for order ${orderId}`);
    });

    console.log(`✅ Deleted all SQLite data for order ${orderId}`);
  } catch (error) {
    console.error(`Error deleting SQLite data for order ${orderId}:`, error);
    throw error;
  }
}

// --- CRUD for Risk Assessment Master ---
export async function insertRiskAssessmentMaster(r: RiskAssessmentMaster) {
  await runSql(
    `INSERT OR REPLACE INTO risk_assessment_master (
      riskassessmentid, assessmenttypename, surveydate, clientnumber, comments, totalvalue, iscomplete, pending_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.riskassessmentid, r.assessmenttypename, r.surveydate, r.clientnumber, r.comments, r.totalvalue, r.iscomplete, r.pending_sync ?? 1
    ]
  );
}
export async function getAllRiskAssessmentMasters(): Promise<RiskAssessmentMaster[]> {
  const res = await runSql('SELECT * FROM risk_assessment_master');
  return res.rows._array;
}
export async function getRiskAssessmentMasterById(id: number): Promise<RiskAssessmentMaster | undefined> {
  const res = await runSql('SELECT * FROM risk_assessment_master WHERE riskassessmentid = ?', [id]);
  return res.rows.length > 0 ? res.rows._array[0] : undefined;
}
export async function updateRiskAssessmentMaster(r: RiskAssessmentMaster) {
  await insertRiskAssessmentMaster(r);
}
export async function deleteRiskAssessmentMaster(id: number) {
  await runSql('DELETE FROM risk_assessment_master WHERE riskassessmentid = ?', [id]);
}

// --- CRUD for Risk Assessment Items ---
export async function insertRiskAssessmentItem(i: RiskAssessmentItem) {
  try {
    await ensureDatabaseConnection();
    
    if (!db) {
      throw new Error('Database connection not available');
    }


    // Use parameterized query for better safety and reliability
    const sql = `
      INSERT OR REPLACE INTO risk_assessment_items (
        riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
        commaseparatedlist, selectedanswer, qty, price, description, model, location,
        assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
        dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
        synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid,
        excludefromreport
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Respect explicitly set pending_sync value, otherwise determine based on issynced
    const pendingSync = i.pending_sync !== undefined ? i.pending_sync : (i.issynced ? 0 : 1);

    const params = [
      i.riskassessmentitemid,
      i.riskassessmentcategoryid,
      i.itemprompt || '',
      i.itemtype || 0,
      i.rank || 0,
      i.commaseparatedlist || '',
      i.selectedanswer || '',
      i.qty ?? null,
      i.price || 0,
      i.description || '',
      i.model || '',
      i.location || '',
      i.assessmentregisterid || 0,
      i.assessmentregistertypeid || 0,
      i.datecreated || new Date().toISOString(),
      i.createdbyid || '',
      i.dateupdated || new Date().toISOString(),
      i.updatedbyid || '',
      i.issynced ? 1 : 0,
      i.syncversion || 0,
      i.deviceid || '',
      i.syncstatus || '',
      i.synctimestamp || new Date().toISOString(),
      i.hasphoto ? 1 : 0,
      i.latitude || 0,
      i.longitude || 0,
      i.notes || '',
      pendingSync,
      i.appointmentid || null,
      i.excludefromreport ? 1 : 0
    ];

    await runSql(sql, params);
    
    // Verify the insert by fetching the item back
    const verifyResult = await runSql(
      'SELECT * FROM risk_assessment_items WHERE riskassessmentitemid = ?',
      [i.riskassessmentitemid]
    );
    
    if (!verifyResult.rows._array.length) {
      throw new Error('Item was not inserted successfully');
    }
    
    
    
  } catch (error) {
    console.error('Error inserting risk assessment item:', error);
    throw error;
  }
}
export async function getAllRiskAssessmentItems(): Promise<RiskAssessmentItem[]> {
  try {
    const res = await runSql('SELECT * FROM risk_assessment_items');
    if (__DEV__) {
      console.log('Number of items found:', res.rows._array.length);
    }
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching risk assessment items from SQLite:', error);
    return [];
  }
}

/**
 * Single indexed query: item counts per risk assessment category for one appointment.
 * Used by prefetch to avoid scanning the full risk_assessment_items table per category.
 */
export async function getCategoryItemCountsForAppointment(
  appointmentId: string
): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  try {
    const res = await runSql(
      `SELECT riskassessmentcategoryid AS cid, COUNT(*) AS n
       FROM risk_assessment_items
       WHERE appointmentid = ?
       GROUP BY riskassessmentcategoryid`,
      [appointmentId]
    );
    const rows = res.rows?._array ?? [];
    for (const row of rows) {
      const cid = Number((row as any).cid);
      const n = Number((row as any).n) || 0;
      if (Number.isFinite(cid)) {
        map.set(cid, n);
      }
    }
  } catch (error) {
    console.error('Error in getCategoryItemCountsForAppointment:', error);
  }
  return map;
}

/** Items stuck with null category id for this appointment (legacy bad rows). */
export async function countNullCategoryItemsForAppointment(appointmentId: string): Promise<number> {
  try {
    const res = await runSql(
      `SELECT COUNT(*) AS n FROM risk_assessment_items
       WHERE appointmentid = ? AND riskassessmentcategoryid IS NULL`,
      [appointmentId]
    );
    const n = res.rows?._array?.[0]?.n;
    return Number(n) || 0;
  } catch (error) {
    console.error('Error in countNullCategoryItemsForAppointment:', error);
    return 0;
  }
}
export async function getRiskAssessmentItemById(id: number): Promise<RiskAssessmentItem | undefined> {
  const res = await runSql('SELECT * FROM risk_assessment_items WHERE riskassessmentitemid = ?', [id]);
  return res.rows.length > 0 ? res.rows._array[0] : undefined;
}
export async function updateRiskAssessmentItem(i: RiskAssessmentItem) {
  // Ensure pending_sync is set to 1 for updates
  const updatedItem = {
    ...i,
    pending_sync: 1,
    dateupdated: new Date().toISOString()
  };
  
  console.log('=== DB UPDATE: Updating risk assessment item ===');
  console.log('Item ID:', updatedItem.riskassessmentitemid);
  console.log('Pending sync flag:', updatedItem.pending_sync);
  console.log('Updated item (full):', JSON.stringify(updatedItem, null, 2));
  
  await insertRiskAssessmentItem(updatedItem);
  
  console.log('=== DB UPDATE: Item updated successfully ===');
}
export async function deleteRiskAssessmentItem(id: number) {
  // Mark as deleted instead of actually deleting (for sync purposes)
  await runSql('UPDATE risk_assessment_items SET pending_sync = 1, isDeleted = 1 WHERE riskassessmentitemid = ?', [id]);
}

export async function hardDeleteRiskAssessmentItem(id: number) {
  // Actually delete the record from SQLite (after successful sync)
  console.log(`🗑️ hardDeleteRiskAssessmentItem: Attempting to delete item ${id} from SQLite`);
  const result = await runSql('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = ?', [id]);
  console.log(`🗑️ hardDeleteRiskAssessmentItem: Delete result for item ${id}:`, result);
  return result;
}

export async function cleanupDeletedItems(deletedItemIds: number[]) {
  // Clean up items that have been confirmed as deleted by the backend
  try {
    if (deletedItemIds.length === 0) return 0;
    
    const placeholders = deletedItemIds.map(() => '?').join(',');
    const result = await runSql(`
      DELETE FROM risk_assessment_items 
      WHERE riskassessmentitemid IN (${placeholders})
    `, deletedItemIds);
    
    if (__DEV__ && result.rowsAffected > 0) {
      console.log(`🗑️ Cleaned up ${result.rowsAffected} deleted items from SQLite`);
    }
    
    return result.rowsAffected;
  } catch (error) {
    console.error('Error cleaning up deleted items:', error);
    throw error;
  }
}


// Get all items that need to be synced to the server
export async function getPendingSyncRiskAssessmentItems(): Promise<RiskAssessmentItem[]> {
  try {
    const res = await runSql('SELECT * FROM risk_assessment_items WHERE pending_sync = 1');
    
    if (__DEV__ && res.rows._array.length > 0) {
      console.log(`📊 Found ${res.rows._array.length} pending sync items`);
    }
    
    // Filter out items with temporary IDs (custom-new- or duplicate- prefixes)
    const validItems = res.rows._array.filter((item: RiskAssessmentItem) => {
      const itemId = String(item.riskassessmentitemid);
      const isTemporaryId = itemId.startsWith('custom-new-') || itemId.startsWith('duplicate-');
      const isOfflineProvisionalCat = isOfflineProvisionalCategoryId(Number(item.riskassessmentcategoryid));

      if (isTemporaryId && __DEV__) {
        console.log(`📊 Filtering out temporary ID from sync count: ${itemId}`);
      }
      if (isOfflineProvisionalCat && __DEV__) {
        console.log(
          `📊 Excluding item from sync until offline section reconciled (provisional category): ${item.riskassessmentcategoryid}`
        );
      }

      return !isTemporaryId && !isOfflineProvisionalCat;
    });
    
    if (__DEV__ && validItems.length !== res.rows._array.length) {
      console.log(`📊 Filtered ${res.rows._array.length - validItems.length} temporary IDs from sync count`);
    }
    
    // Count deleted items for debugging
    const deletedItems = validItems.filter(item => item.isDeleted === 1);
    
    if (__DEV__ && deletedItems.length > 0) {
      console.log(`🗑️ Including ${deletedItems.length} deleted items in sync count`);
    }
    
    return validItems;
  } catch (error) {
    console.error('Error fetching pending sync risk assessment items:', error);
    return [];
  }
}

// --- Pending section clones (offline queue) ---

export async function insertPendingSectionClone(
  row: Omit<PendingSectionCloneRow, 'id' | 'attempts' | 'last_error'> & { attempts?: number }
): Promise<void> {
  await runSql(
    `INSERT INTO pending_section_clones (
      client_mutation_id, risk_assessment_id, source_section_id, target_section_name,
      order_number, appointment_id, created_at, attempts, last_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.client_mutation_id,
      row.risk_assessment_id,
      row.source_section_id,
      row.target_section_name ?? null,
      row.order_number,
      row.appointment_id,
      row.created_at,
      row.attempts ?? 0,
      null
    ]
  );
}

export async function getAllPendingSectionClones(): Promise<PendingSectionCloneRow[]> {
  try {
    const res = await runSql('SELECT * FROM pending_section_clones ORDER BY id ASC');
    return (res.rows?._array || []) as PendingSectionCloneRow[];
  } catch (error) {
    console.error('Error fetching pending section clones:', error);
    return [];
  }
}

export async function deletePendingSectionClone(id: number): Promise<void> {
  await runSql('DELETE FROM pending_section_clones WHERE id = ?', [id]);
}

export async function incrementPendingSectionCloneAttempt(id: number, errorMessage: string): Promise<void> {
  await runSql(
    'UPDATE pending_section_clones SET attempts = attempts + 1, last_error = ? WHERE id = ?',
    [errorMessage.slice(0, 500), id]
  );
}

/** Provisional category IDs for offline materialized clones live in [8e12, 9e12). */
export const OFFLINE_PROVISIONAL_CATEGORY_MIN = 8_000_000_000_000;
export const OFFLINE_PROVISIONAL_CATEGORY_MAX = 9_000_000_000_000;

export function isOfflineProvisionalCategoryId(categoryId: number): boolean {
  return (
    Number.isFinite(categoryId) &&
    categoryId >= OFFLINE_PROVISIONAL_CATEGORY_MIN &&
    categoryId < OFFLINE_PROVISIONAL_CATEGORY_MAX
  );
}

export interface OfflineMaterializedSectionCloneRow {
  id: number;
  client_mutation_id: string;
  risk_assessment_id: string;
  source_section_id: string;
  target_section_name: string | null;
  order_number: string;
  appointment_id: string;
  local_section_id: string;
  structure_json: string;
  server_section_id: string | null;
  sync_state: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export async function insertOfflineMaterializedSectionClone(row: {
  client_mutation_id: string;
  risk_assessment_id: string;
  source_section_id: string;
  target_section_name: string | null;
  order_number: string;
  appointment_id: string;
  local_section_id: string;
  structure_json: string;
}): Promise<number> {
  const now = new Date().toISOString();
  const res = await runSql(
    `INSERT INTO offline_materialized_section_clones (
      client_mutation_id, risk_assessment_id, source_section_id, target_section_name,
      order_number, appointment_id, local_section_id, structure_json, sync_state, attempts, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    [
      row.client_mutation_id,
      row.risk_assessment_id,
      row.source_section_id,
      row.target_section_name,
      row.order_number,
      row.appointment_id,
      row.local_section_id,
      row.structure_json,
      now,
      now
    ]
  );
  const id = Number(res.insertId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('insertOfflineMaterializedSectionClone: missing insert id');
  }
  return id;
}

export async function getOfflineMaterializedSectionCloneByLocalSectionId(
  localSectionId: string
): Promise<OfflineMaterializedSectionCloneRow | null> {
  const res = await runSql(
    'SELECT * FROM offline_materialized_section_clones WHERE local_section_id = ? LIMIT 1',
    [localSectionId]
  );
  const row = res.rows?._array?.[0] as OfflineMaterializedSectionCloneRow | undefined;
  return row ?? null;
}

export async function getOfflineMaterializedSectionClonesByAppointment(
  appointmentId: string
): Promise<OfflineMaterializedSectionCloneRow[]> {
  const res = await runSql(
    'SELECT * FROM offline_materialized_section_clones WHERE appointment_id = ? ORDER BY id ASC',
    [appointmentId]
  );
  return (res.rows?._array || []) as OfflineMaterializedSectionCloneRow[];
}

export async function getPendingOfflineMaterializedSectionClones(): Promise<OfflineMaterializedSectionCloneRow[]> {
  const res = await runSql(
    `SELECT * FROM offline_materialized_section_clones
     WHERE sync_state = 'pending' OR sync_state = 'failed'
     ORDER BY id ASC`
  );
  return (res.rows?._array || []) as OfflineMaterializedSectionCloneRow[];
}

export async function deleteOfflineMaterializedSectionClone(id: number): Promise<void> {
  await runSql('DELETE FROM offline_materialized_section_clones WHERE id = ?', [id]);
}

export async function updateOfflineMaterializedSectionCloneState(
  id: number,
  syncState: string,
  serverSectionId?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  if (serverSectionId !== undefined) {
    await runSql(
      `UPDATE offline_materialized_section_clones SET sync_state = ?, server_section_id = ?, updated_at = ?, last_error = NULL WHERE id = ?`,
      [syncState, serverSectionId, now, id]
    );
  } else {
    await runSql(
      `UPDATE offline_materialized_section_clones SET sync_state = ?, updated_at = ?, last_error = NULL WHERE id = ?`,
      [syncState, now, id]
    );
  }
}

export async function incrementOfflineMaterializedSectionCloneAttempt(
  id: number,
  errorMessage: string
): Promise<void> {
  await runSql(
    `UPDATE offline_materialized_section_clones SET attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?`,
    [errorMessage.slice(0, 500), new Date().toISOString(), id]
  );
}

// Mark risk assessment items as synced (clear pending_sync flag)
export async function markRiskAssessmentItemsAsSynced(itemIds: number[]) {
  try {
    for (const id of itemIds) {
      await runSql(
        'UPDATE risk_assessment_items SET pending_sync = 0, synctimestamp = ? WHERE riskassessmentitemid = ?',
        [new Date().toISOString(), id]
      );
    }
    console.log('Marked items as synced:', itemIds);
  } catch (error) {
    console.error('Error marking risk assessment items as synced:', error);
    throw error;
  }
}

// Get all appointments that need to be synced to the server
export async function getPendingSyncAppointments() {
  try {
    const res = await runSql('SELECT * FROM appointments WHERE pending_sync = 1');
    if (__DEV__ && res.rows._array.length > 0) {
      console.log(`📊 Found ${res.rows._array.length} pending sync appointments`);
    }
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching pending sync appointments:', error);
    return [];
  }
}

// Mark appointments as synced (clear pending_sync flag)
export async function markAppointmentsAsSynced(appointmentIds: number[]) {
  try {
    for (const id of appointmentIds) {
      await runSql(
        'UPDATE appointments SET pending_sync = 0, dateModified = ? WHERE appointmentID = ?',
        [new Date().toISOString(), id]
      );
    }
    console.log('Marked appointments as synced:', appointmentIds);
  } catch (error) {
    console.error('Error marking appointments as synced:', error);
    throw error;
  }
}

// Get all risk assessment masters that need to be synced to the server
export async function getPendingSyncRiskAssessmentMasters(): Promise<RiskAssessmentMaster[]> {
  try {
    const res = await runSql('SELECT * FROM risk_assessment_master WHERE pending_sync = 1');
    if (__DEV__ && res.rows._array.length > 0) {
      console.log(`📊 Found ${res.rows._array.length} pending sync masters`);
    }
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching pending sync risk assessment masters:', error);
    return [];
  }
}

// Mark risk assessment masters as synced (clear pending_sync flag)
export async function markRiskAssessmentMastersAsSynced(masterIds: number[]) {
  try {
    for (const id of masterIds) {
      await runSql(
        'UPDATE risk_assessment_master SET pending_sync = 0 WHERE riskassessmentid = ?',
        [id]
      );
    }
    console.log('Marked masters as synced:', masterIds);
  } catch (error) {
    console.error('Error marking risk assessment masters as synced:', error);
    throw error;
  }
}

// --- CRUD for Media Files ---
export async function insertMediaFile(m: MediaFile) {
  try {
    console.log('Attempting to insert Media File:', {
      fileName: m.FileName,
      fileType: m.FileType,
      entityName: m.EntityName,
      entityID: m.EntityID
    });

    const sql = `
      INSERT INTO media_files (
        FileName, FileType, BlobURL, EntityName, EntityID, UploadedAt, UploadedBy,
        IsDeleted, Metadata, LocalPath, pending_sync, BackendMediaID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      m.FileName,
      m.FileType,
      m.BlobURL,
      m.EntityName,
      m.EntityID,
      m.UploadedAt,
      m.UploadedBy || null,
      m.IsDeleted ? 1 : 0,
      m.Metadata || null,
      m.LocalPath || null,
      m.pending_sync ?? 1,
      m.BackendMediaID || null
    ];

    const result = await runSql(sql, params);
    console.log('Successfully inserted media file with ID:', result.insertId);
    return result.insertId;
    
  } catch (error) {
    console.error('Error inserting media file:', error);
    throw error;
  }
}

/**
 * Insert multiple media files in a batch transaction (optimized for hundreds of photos)
 * @param mediaFiles - Array of media files to insert
 * @returns Array of inserted media IDs
 */
export async function insertMediaFilesBatch(mediaFiles: MediaFile[]): Promise<number[]> {
  if (mediaFiles.length === 0) {
    return [];
  }
  
  try {
    const database = await ensureDbReady();
    const insertedIds: number[] = [];
    
    // Use a transaction for better performance with many inserts
    await database.withTransactionAsync(async () => {
      for (const m of mediaFiles) {
        const sql = `
          INSERT INTO media_files (
            FileName, FileType, BlobURL, EntityName, EntityID, UploadedAt, UploadedBy,
            IsDeleted, Metadata, LocalPath, pending_sync, BackendMediaID
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          m.FileName,
          m.FileType,
          m.BlobURL,
          m.EntityName,
          m.EntityID,
          m.UploadedAt,
          m.UploadedBy || null,
          m.IsDeleted ? 1 : 0,
          m.Metadata || null,
          m.LocalPath || null,
          m.pending_sync ?? 1,
          m.BackendMediaID || null
        ];

        const result = await database.runAsync(sql, params);
        if (result.lastInsertRowId) {
          insertedIds.push(result.lastInsertRowId as number);
        }
      }
    });
    
    console.log(`✅ Successfully inserted ${insertedIds.length} media files in batch`);
    return insertedIds;
    
  } catch (error) {
    console.error('Error inserting media files in batch:', error);
    throw error;
  }
}

export async function upsertMediaFile(m: MediaFile): Promise<number | undefined> {
  try {
    const identifier =
      m.BackendMediaID != null
        ? await runSql(
            'SELECT * FROM media_files WHERE BackendMediaID = ? AND EntityName = ? AND EntityID = ? LIMIT 1',
            [m.BackendMediaID, m.EntityName, m.EntityID]
          )
        : await runSql(
            'SELECT * FROM media_files WHERE FileName = ? AND EntityName = ? AND EntityID = ? LIMIT 1',
            [m.FileName, m.EntityName, m.EntityID]
          );

    const existing = identifier.rows._array[0] as MediaFile | undefined;
    if (existing?.MediaID) {
      await updateMediaFile({
        ...existing,
        ...m,
        MediaID: existing.MediaID,
        LocalPath: m.LocalPath ?? existing.LocalPath,
        pending_sync: m.pending_sync ?? existing.pending_sync ?? 0
      });
      return existing.MediaID;
    }

    const inserted = await insertMediaFile(m);
    return typeof inserted === 'number' ? inserted : undefined;
  } catch (error) {
    console.error('Error upserting media file:', error);
    throw error;
  }
}

export async function upsertMediaFilesBatch(mediaFiles: MediaFile[]): Promise<number[]> {
  const ids: number[] = [];
  for (const mediaFile of mediaFiles) {
    const id = await upsertMediaFile(mediaFile);
    if (typeof id === 'number') {
      ids.push(id);
    }
  }
  return ids;
}

export async function getAllMediaFiles(): Promise<MediaFile[]> {
  try {
    console.log('Fetching all media files from SQLite');
    const res = await runSql('SELECT * FROM media_files WHERE IsDeleted = 0');
    console.log('Number of media files found:', res.rows._array.length);
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching media files from SQLite:', error);
    return [];
  }
}

export async function getMediaFilesByEntity(entityName: string, entityID: number, includeDeleted: boolean = false): Promise<MediaFile[]> {
  try {
    const sql = includeDeleted 
      ? 'SELECT * FROM media_files WHERE EntityName = ? AND EntityID = ? ORDER BY UploadedAt DESC'
      : 'SELECT * FROM media_files WHERE EntityName = ? AND EntityID = ? AND IsDeleted = 0 ORDER BY UploadedAt DESC';
    
    console.log(`📸 getMediaFilesByEntity: Searching for ${entityName} with ID ${entityID} (includeDeleted: ${includeDeleted})`);
    const res = await runSql(sql, [entityName, entityID]);
    console.log(`📸 getMediaFilesByEntity: Found ${res.rows._array.length} media files`);
    
    if (res.rows._array.length > 0) {
      console.log(`📸 Media files found:`, res.rows._array.map(m => ({ 
        MediaID: m.MediaID, 
        FileName: m.FileName, 
        EntityName: m.EntityName, 
        EntityID: m.EntityID,
        IsDeleted: m.IsDeleted 
      })));
    }
    
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching media files by entity:', error);
    return [];
  }
}

export async function getMediaFileById(mediaID: number): Promise<MediaFile | undefined> {
  const res = await runSql('SELECT * FROM media_files WHERE MediaID = ?', [mediaID]);
  return res.rows.length > 0 ? res.rows._array[0] : undefined;
}

export async function updateMediaFile(m: MediaFile) {
  try {
    const sql = `
      UPDATE media_files SET
        FileName = ?, FileType = ?, BlobURL = ?, EntityName = ?, EntityID = ?,
        UploadedAt = ?, UploadedBy = ?, IsDeleted = ?, Metadata = ?, LocalPath = ?,
        pending_sync = ?, BackendMediaID = ?
      WHERE MediaID = ?
    `;

    const params = [
      m.FileName,
      m.FileType,
      m.BlobURL,
      m.EntityName,
      m.EntityID,
      m.UploadedAt,
      m.UploadedBy || null,
      m.IsDeleted ? 1 : 0,
      m.Metadata || null,
      m.LocalPath || null,
      m.pending_sync ?? 1,
      m.BackendMediaID ?? null,
      m.MediaID
    ];

    await runSql(sql, params);
    console.log('Updated media file:', m.MediaID);
  } catch (error) {
    console.error('Error updating media file:', error);
    throw error;
  }
}

const DB_LOCKED_RETRY_MS = 100;
const DB_LOCKED_MAX_RETRIES = 5;

function isDatabaseLockedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('database is locked') || msg.includes('SQLITE_BUSY') || msg.includes('finalizeAsync');
}

export async function deleteMediaFile(mediaID: number) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= DB_LOCKED_MAX_RETRIES; attempt++) {
    try {
      await runSql(
        'UPDATE media_files SET IsDeleted = 1, pending_sync = 1 WHERE MediaID = ?',
        [mediaID]
      );
      console.log('Soft deleted media file:', mediaID);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < DB_LOCKED_MAX_RETRIES && isDatabaseLockedError(error)) {
        await new Promise((r) => setTimeout(r, DB_LOCKED_RETRY_MS * (attempt + 1)));
        continue;
      }
      console.error('Error deleting media file:', error);
      throw error;
    }
  }
  console.error('Error deleting media file:', lastError);
  throw lastError;
}

export async function hardDeleteMediaFile(mediaID: number) {
  try {
    // Hard delete - actually remove from database
    await runSql('DELETE FROM media_files WHERE MediaID = ?', [mediaID]);
    console.log('Hard deleted media file:', mediaID);
  } catch (error) {
    console.error('Error hard deleting media file:', error);
    throw error;
  }
}

// Get all media files that need to be synced to the server
export async function getPendingSyncMediaFiles(): Promise<MediaFile[]> {
  try {
    // Only get media files that are pending sync AND not deleted
    const res = await runSql('SELECT * FROM media_files WHERE pending_sync = 1 AND IsDeleted = 0');
    if (__DEV__ && res.rows._array.length > 0) {
      console.log(`📊 Found ${res.rows._array.length} pending sync media files`);
    }
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching pending sync media files:', error);
    return [];
  }
}

// Get all deleted media files that need to be synced to the server
export async function getPendingSyncDeletedMediaFiles(): Promise<MediaFile[]> {
  try {
    // Get media files that are deleted and need to be synced for deletion
    const res = await runSql('SELECT * FROM media_files WHERE pending_sync = 1 AND IsDeleted = 1');
    if (__DEV__ && res.rows._array.length > 0) {
      console.log(`📊 Found ${res.rows._array.length} pending sync deleted media files`);
    }
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching pending sync deleted media files:', error);
    return [];
  }
}

// Mark media files as synced (clear pending_sync flag)
export async function markMediaFilesAsSynced(mediaIDs: number[]) {
  try {
    for (const id of mediaIDs) {
      await runSql(
        'UPDATE media_files SET pending_sync = 0 WHERE MediaID = ?',
        [id]
      );
    }
    console.log('Marked media files as synced:', mediaIDs);
  } catch (error) {
    console.error('Error marking media files as synced:', error);
    throw error;
  }
}

// Database migration function
export async function migrateDb() {
  try {
    console.log('🔄 Starting database migration...');
    
    if (!db) {
      throw new Error('Database not initialized');
    }

    const tableInfo = await db.getAllAsync("PRAGMA table_info(risk_assessment_items)") as Array<{ name: string }>;
    const hasExcludeFromReport = tableInfo.some(col => col.name === 'excludefromreport');
    if (!hasExcludeFromReport) {
      console.log('🔄 Adding excludefromreport column to risk_assessment_items...');
      await db.execAsync('ALTER TABLE risk_assessment_items ADD COLUMN excludefromreport INTEGER DEFAULT 0');
      console.log('✅ excludefromreport column added');
    } else {
      console.log('ℹ️ excludefromreport column already exists');
    }
    
    // Check if BackendMediaID column exists in media_files table
    const mediaTableInfo = await db.getAllAsync("PRAGMA table_info(media_files)") as Array<{ name: string }>;
    const hasBackendMediaId = mediaTableInfo.some(col => col.name === 'BackendMediaID');
    
    if (!hasBackendMediaId) {
      console.log('🔄 Adding BackendMediaID column to media_files...');
      await db.execAsync('ALTER TABLE media_files ADD COLUMN BackendMediaID INTEGER');
      console.log('✅ BackendMediaID column added');
    } else {
      console.log('ℹ️ BackendMediaID column already exists');
    }
    
    console.log('✅ Database migration completed');
    
    // Update existing media files with backend IDs
    await updateMediaFilesWithBackendIds();
  } catch (error) {
    console.error('❌ Database migration error:', error);
    throw error;
  }
}

// Update BackendMediaID for existing media files
export async function updateMediaFilesWithBackendIds() {
  try {
    console.log('🔄 Updating media files with backend IDs...');
    
    // First, check if there are any media files at all
    const allMediaRes = await runSql('SELECT * FROM media_files');
    console.log(`📸 Total media files in database: ${allMediaRes.rows._array.length}`);
    
    // Get all media files that don't have BackendMediaID set
    const res = await runSql('SELECT * FROM media_files WHERE BackendMediaID IS NULL');
    const mediaFiles = res.rows._array;
    
    console.log(`📸 Found ${mediaFiles.length} media files without BackendMediaID`);
    console.log(`📸 Media files details:`, mediaFiles.map(m => ({ 
      MediaID: m.MediaID, 
      BackendMediaID: m.BackendMediaID, 
      FileName: m.FileName 
    })));
    
    // Map database MediaID to backend MediaID based on the pattern
    // Database IDs: 1, 2, 3, 4, 5 -> Backend IDs: 152, 153, 154, 155, 156
    const backendIdMapping = {
      1: 152,
      2: 153, 
      3: 154,
      4: 155,
      5: 156
    };
    
    for (const mediaFile of mediaFiles) {
      const backendId = backendIdMapping[mediaFile.MediaID as keyof typeof backendIdMapping];
      if (backendId) {
        await runSql(
          'UPDATE media_files SET BackendMediaID = ? WHERE MediaID = ?',
          [backendId, mediaFile.MediaID]
        );
        console.log(`✅ Updated media file ${mediaFile.MediaID} with BackendMediaID ${backendId}`);
      }
    }
    
    console.log('✅ Media files updated with backend IDs');
  } catch (error) {
    console.error('❌ Error updating media files with backend IDs:', error);
    throw error;
  }
}

// --- Database Management Functions ---

// Clear all cached data from SQLite tables
export async function clearAllCachedTables(): Promise<void> {
  try {
    console.log('🗑️ Clearing all cached SQLite tables...');
    
    const database = await ensureDbReady();
    
    // Clear all data from tables (but keep table structure)
    await database.runAsync('DELETE FROM risk_assessment_items');
    await database.runAsync('DELETE FROM risk_assessment_master');
    await database.runAsync('DELETE FROM appointments');
    await database.runAsync('DELETE FROM media_files');
    await database.runAsync('DELETE FROM category_configurations');
    await database.runAsync('DELETE FROM pending_section_clones');
    await database.runAsync('DELETE FROM offline_materialized_section_clones');
    
    // Reset auto-increment counters
    await database.runAsync('DELETE FROM sqlite_sequence WHERE name IN ("media_files")');
    
    console.log('✅ All cached tables cleared successfully');
    
    // Verify tables are empty
    const itemsCount = await database.getAllAsync('SELECT COUNT(*) as count FROM risk_assessment_items');
    const mastersCount = await database.getAllAsync('SELECT COUNT(*) as count FROM risk_assessment_master');
    const appointmentsCount = await database.getAllAsync('SELECT COUNT(*) as count FROM appointments');
    const mediaCount = await database.getAllAsync('SELECT COUNT(*) as count FROM media_files');
    const categoryConfigsCount = await database.getAllAsync('SELECT COUNT(*) as count FROM category_configurations');
    
    console.log('📊 Table counts after clearing:', {
      risk_assessment_items: (itemsCount[0] as any)?.count,
      risk_assessment_master: (mastersCount[0] as any)?.count,
      appointments: (appointmentsCount[0] as any)?.count,
      media_files: (mediaCount[0] as any)?.count,
      category_configurations: (categoryConfigsCount[0] as any)?.count
    });
    
  } catch (error) {
    console.error('❌ Error clearing cached tables:', error);
    throw error;
  }
}

// Drop and recreate all tables (nuclear option)
export async function recreateAllTables(): Promise<void> {
  try {
    console.log('💥 Dropping and recreating all SQLite tables...');
    
    const database = await ensureDbReady();
    
    // Drop all tables
    await database.execAsync('DROP TABLE IF EXISTS risk_assessment_items');
    await database.execAsync('DROP TABLE IF EXISTS risk_assessment_master');
    await database.execAsync('DROP TABLE IF EXISTS appointments');
    await database.execAsync('DROP TABLE IF EXISTS media_files');
    await database.execAsync('DROP TABLE IF EXISTS category_configurations');
    
    console.log('🗑️ All tables dropped');
    
    // Recreate tables
    await createTables();
    
    console.log('✅ All tables recreated successfully');
    
  } catch (error) {
    console.error('❌ Error recreating tables:', error);
    throw error;
  }
}

// Clear specific table data
export async function clearTableData(tableName: 'risk_assessment_items' | 'risk_assessment_master' | 'appointments' | 'media_files' | 'category_configurations'): Promise<void> {
  try {
    console.log(`🗑️ Clearing ${tableName} table...`);
    
    const database = await ensureDbReady();
    await database.runAsync(`DELETE FROM ${tableName}`);
    
    // Reset auto-increment for media_files
    if (tableName === 'media_files') {
      await database.runAsync('DELETE FROM sqlite_sequence WHERE name = "media_files"');
    }
    
    const count = await database.getAllAsync(`SELECT COUNT(*) as count FROM ${tableName}`);
    console.log(`✅ ${tableName} cleared. Current count: ${(count[0] as any)?.count}`);
    
  } catch (error) {
    console.error(`❌ Error clearing ${tableName}:`, error);
    throw error;
  }
}

// Get table statistics
export async function getTableStats(): Promise<{[key: string]: number}> {
  try {
    const database = await ensureDbReady();
    
    const itemsCount = await database.getAllAsync('SELECT COUNT(*) as count FROM risk_assessment_items');
    const mastersCount = await database.getAllAsync('SELECT COUNT(*) as count FROM risk_assessment_master');
    const appointmentsCount = await database.getAllAsync('SELECT COUNT(*) as count FROM appointments');
    const mediaCount = await database.getAllAsync('SELECT COUNT(*) as count FROM media_files');
    const categoryConfigsCount = await database.getAllAsync('SELECT COUNT(*) as count FROM category_configurations');
    
    const stats = {
      risk_assessment_items: (itemsCount[0] as any)?.count || 0,
      risk_assessment_master: (mastersCount[0] as any)?.count || 0,
      appointments: (appointmentsCount[0] as any)?.count || 0,
      media_files: (mediaCount[0] as any)?.count || 0,
      category_configurations: (categoryConfigsCount[0] as any)?.count || 0
    };
    
    console.log('📊 Current table statistics:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Error getting table stats:', error);
    return {};
  }
}

// Force reload data from API (clears cache first)
export async function forceReloadFromAPI(): Promise<void> {
  try {
    console.log('🔄 Force reloading data from API...');
    
    // Clear cached tables
    await clearAllCachedTables();
    
    // Clear AsyncStorage cache
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const keys = await AsyncStorage.getAllKeys();
    const apiKeys = keys.filter((key: string) => 
      key.includes('risk_templates') || 
      key.includes('assessment_sections') ||
      key.includes('assessment_categories') ||
      key.includes('assessment_items') ||
      key.includes('template_categories') ||
      key.includes('template_items')
    );
    
    if (apiKeys.length > 0) {
      await AsyncStorage.multiRemove(apiKeys);
      console.log(`🗑️ Cleared ${apiKeys.length} AsyncStorage cache items`);
    }
    
    console.log('✅ Force reload preparation complete. Next API calls will fetch fresh data.');
    
  } catch (error) {
    console.error('❌ Error during force reload:', error);
    throw error;
  }
}

// Global transaction semaphore to prevent concurrent transactions
let transactionInProgress = false;
const transactionQueue: (() => Promise<void>)[] = [];

// Process transaction queue sequentially
async function processTransactionQueue() {
  if (transactionInProgress || transactionQueue.length === 0) return;
  
  const nextTransaction = transactionQueue.shift();
  if (nextTransaction) {
    await nextTransaction();
    // Process next transaction if any
    setTimeout(processTransactionQueue, 10);
  }
}

/** Shared insert loop for risk_assessment_items (used inside a single withTransactionAsync). */
async function executeRiskAssessmentItemsStatementLoop(
  database: any,
  items: RiskAssessmentItem[]
): Promise<void> {
  const stmt = await database.prepareAsync(`
    INSERT OR REPLACE INTO risk_assessment_items (
      riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
      commaseparatedlist, selectedanswer, qty, price, description, model, location,
      assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
      dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
      synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid,
      excludefromreport
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    for (const item of items) {
      const pendingSync = item.issynced ? 0 : (item.pending_sync ?? 1);

      await stmt.executeAsync([
        item.riskassessmentitemid,
        item.riskassessmentcategoryid,
        item.itemprompt || '',
        item.itemtype || 0,
        item.rank || 0,
        item.commaseparatedlist || '',
        item.selectedanswer || '',
        item.qty ?? null,
        item.price || 0,
        item.description || '',
        item.model || '',
        item.location || '',
        item.assessmentregisterid || 0,
        item.assessmentregistertypeid || 0,
        item.datecreated || new Date().toISOString(),
        item.createdbyid || '',
        item.dateupdated || new Date().toISOString(),
        item.updatedbyid || '',
        item.issynced ? 1 : 0,
        item.syncversion || 0,
        item.deviceid || '',
        item.syncstatus || '',
        item.synctimestamp || new Date().toISOString(),
        item.hasphoto ? 1 : 0,
        item.latitude || 0,
        item.longitude || 0,
        item.notes || '',
        pendingSync,
        item.appointmentid || null,
        item.excludefromreport ? 1 : 0
      ]);
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

/**
 * Single transaction for the entire appointment prefetch item set (avoids N queued writes).
 * Prefer this over repeated batchInsertRiskAssessmentItems during prefetch.
 */
export async function batchInsertRiskAssessmentItemsBulk(items: RiskAssessmentItem[]): Promise<void> {
  if (items.length === 0) return;

  console.log(`🔄 Bulk inserting ${items.length} risk assessment items (single transaction)...`);

  return new Promise((resolve, reject) => {
    const executeTransaction = async () => {
      if (transactionInProgress) {
        transactionQueue.push(executeTransaction);
        processTransactionQueue();
        return;
      }

      transactionInProgress = true;
      const start = performance.now();

      try {
        const database = await ensureDbReady();

        await database.withTransactionAsync(async () => {
          await executeRiskAssessmentItemsStatementLoop(database, items);
        });

        const duration = performance.now() - start;
        console.log(`✅ Bulk batch insert completed in ${duration.toFixed(2)}ms (${items.length} items)`);
        console.log(`📊 Performance: ${(duration / items.length).toFixed(2)}ms per item`);

        transactionInProgress = false;
        processTransactionQueue();
        resolve();
      } catch (error) {
        console.error('❌ Error in bulk batch insert:', error);
        transactionInProgress = false;
        processTransactionQueue();
        reject(error);
      }
    };

    executeTransaction();
  });
}

// Batch insert risk assessment items (Step 1.2 - Performance Optimization)
export async function batchInsertRiskAssessmentItems(items: RiskAssessmentItem[]): Promise<void> {
  if (items.length === 0) return;
  
  console.log(`🔄 Batch inserting ${items.length} risk assessment items...`);
  
  // Use promise-based queue to prevent concurrent transactions
  return new Promise((resolve, reject) => {
    const executeTransaction = async () => {
      if (transactionInProgress) {
        // If transaction in progress, queue this one
        transactionQueue.push(executeTransaction);
        processTransactionQueue();
        return;
      }
      
      transactionInProgress = true;
      const start = performance.now();
      
      try {
        const database = await ensureDbReady();
        
        await database.withTransactionAsync(async () => {
          await executeRiskAssessmentItemsStatementLoop(database, items);
        });
        
        const duration = performance.now() - start;
        console.log(`✅ Batch insert completed in ${duration.toFixed(2)}ms (${items.length} items)`);
        console.log(`📊 Performance: ${(duration / items.length).toFixed(2)}ms per item`);
        
        
        transactionInProgress = false;
        processTransactionQueue(); // Process any queued transactions
        resolve();
        
      } catch (error) {
        console.error('❌ Error in batch insert:', error);
        console.log('🔄 Falling back to individual inserts...');
        
        // Fallback to individual inserts if batch fails
        let successCount = 0;
        for (const item of items) {
          try {
            await insertRiskAssessmentItem(item);
            successCount++;
          } catch (individualError) {
            console.warn(`⚠️ Failed to insert item ${item.riskassessmentitemid}:`, individualError);
          }
        }
        
        console.log(`🔄 Fallback completed: ${successCount}/${items.length} items inserted`);
        
        transactionInProgress = false;
        processTransactionQueue(); // Process any queued transactions
        
        // Only reject if we couldn't insert any items
        if (successCount === 0) {
          reject(error);
        } else {
          resolve();
        }
      }
    };
    
    executeTransaction();
  });
}

// Batch update risk assessment items (Step 1.2 - Performance Optimization)
export async function batchUpdateRiskAssessmentItems(items: RiskAssessmentItem[]): Promise<void> {
  if (items.length === 0) return;
  
  console.log(`🔄 Batch updating ${items.length} risk assessment items...`);
  
  // Mark all items as needing sync
  const itemsWithSync = items.map(item => ({
    ...item,
    pending_sync: 1,
    dateupdated: new Date().toISOString()
  }));
  
  await batchInsertRiskAssessmentItems(itemsWithSync);
}

// Test batch insert performance (Step 1.2 validation)
export async function testBatchInsertPerformance(): Promise<void> {
  console.log('🧪 Testing batch insert performance...');
  
  // Create test data
  const testItems: RiskAssessmentItem[] = [];
  for (let i = 1; i <= 100; i++) {
    testItems.push({
      riskassessmentitemid: 90000 + i, // Use high IDs to avoid conflicts
      riskassessmentcategoryid: 1,
      itemprompt: `Test Item ${i}`,
      itemtype: 1,
      rank: i,
      commaseparatedlist: '',
      selectedanswer: '',
      qty: 1,
      price: 100,
      description: `Test description ${i}`,
      model: `Model ${i}`,
      location: `Location ${i}`,
      assessmentregisterid: 1,
      assessmentregistertypeid: 1,
      datecreated: new Date().toISOString(),
      createdbyid: 'test-user',
      dateupdated: new Date().toISOString(),
      updatedbyid: 'test-user',
      issynced: 0,
      syncversion: 1,
      deviceid: 'test-device',
      syncstatus: 'pending',
      synctimestamp: new Date().toISOString(),
      hasphoto: 0,
      latitude: 0,
      longitude: 0,
      notes: `Test notes ${i}`,
      pending_sync: 1,
      appointmentid: 'test-appointment'
    });
  }
  
  // Test individual inserts
  console.log('⏱️ Testing individual inserts...');
  const individualStart = performance.now();
  for (const item of testItems.slice(0, 50)) { // Test with 50 items
    await insertRiskAssessmentItem(item);
  }
  const individualDuration = performance.now() - individualStart;
  
  // Test batch insert
  console.log('⏱️ Testing batch insert...');
  const batchStart = performance.now();
  await batchInsertRiskAssessmentItems(testItems.slice(50, 100)); // Test with 50 items
  const batchDuration = performance.now() - batchStart;
  
  // Calculate performance improvement
  const improvement = ((individualDuration - batchDuration) / individualDuration * 100);
  
  console.log('📊 Batch Insert Performance Results:');
  console.log(`   Individual inserts (50 items): ${individualDuration.toFixed(2)}ms`);
  console.log(`   Batch insert (50 items): ${batchDuration.toFixed(2)}ms`);
  console.log(`   Performance improvement: ${improvement.toFixed(1)}%`);
  console.log(`   Speed multiplier: ${(individualDuration / batchDuration).toFixed(1)}x faster`);
  
  // Cleanup test data
  try {
    const database = await ensureDbReady();
    await database.runAsync('DELETE FROM risk_assessment_items WHERE riskassessmentitemid >= 90000');
    console.log('🧹 Cleaned up test data');
  } catch (error) {
    console.warn('⚠️ Could not cleanup test data:', error);
  }
}

// Test index performance (for Step 1.1 validation)
export async function testIndexPerformance(): Promise<void> {
  try {
    console.log('🧪 Testing database index performance...');
    
    // Test category index
    const categoryStart = performance.now();
    const categoryResult = await runSql(
      'SELECT COUNT(*) as count FROM risk_assessment_items WHERE riskassessmentcategoryid = ?',
      ['123']
    );
    const categoryDuration = performance.now() - categoryStart;
    console.log(`📊 Category index query took: ${categoryDuration.toFixed(2)}ms`);
    
    // Test appointment index
    const appointmentStart = performance.now();
    const appointmentResult = await runSql(
      'SELECT COUNT(*) as count FROM risk_assessment_items WHERE appointmentid = ?',
      ['test-appointment']
    );
    const appointmentDuration = performance.now() - appointmentStart;
    console.log(`📊 Appointment index query took: ${appointmentDuration.toFixed(2)}ms`);
    
    // Test pending sync index
    const syncStart = performance.now();
    const syncResult = await runSql(
      'SELECT COUNT(*) as count FROM risk_assessment_items WHERE pending_sync = ?',
      [1]
    );
    const syncDuration = performance.now() - syncStart;
    console.log(`📊 Sync index query took: ${syncDuration.toFixed(2)}ms`);
    
    // Test appointment status index
    const statusStart = performance.now();
    const statusResult = await runSql(
      'SELECT COUNT(*) as count FROM appointments WHERE inviteStatus = ?',
      ['In-Progress']
    );
    const statusDuration = performance.now() - statusStart;
    console.log(`📊 Status index query took: ${statusDuration.toFixed(2)}ms`);
    
    console.log('✅ Index performance test completed');
    
    // Performance summary
    const avgDuration = (categoryDuration + appointmentDuration + syncDuration + statusDuration) / 4;
    console.log(`📈 Average query time: ${avgDuration.toFixed(2)}ms`);
    
    if (avgDuration < 50) {
      console.log('🎉 Excellent performance! Queries are under 50ms');
    } else if (avgDuration < 100) {
      console.log('✅ Good performance! Queries are under 100ms');
    } else {
      console.log('⚠️ Slow performance detected. Consider checking indexes');
    }
    
  } catch (error) {
    console.error('❌ Error testing index performance:', error);
    throw error;
  }
}
