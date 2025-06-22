import * as SQLite from 'expo-sqlite';

// Initialize database using the new async API
let db: SQLite.SQLiteDatabase | null = null;
let isDbReady = false;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

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
    return await initPromise;
  }
  
  // Start initialization
  initPromise = initializeDatabase();
  return await initPromise;
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
    console.log('Initializing database...');
    
    // Close existing connection if any
    if (db) {
      console.log('Closing existing database connection...');
      await db.closeAsync();
      db = null;
    }
    
    // Open new connection
    db = await SQLite.openDatabaseAsync('valuations.db');
    console.log('Database opened successfully');
    
    // Create tables
    await createTables();
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Ensure database connection
async function ensureDatabaseConnection() {
  const now = Date.now();
  if (!db || now - lastConnectionCheck > CONNECTION_CHECK_INTERVAL) {
    console.log('Checking database connection...');
    try {
      if (!db) {
        console.log('Database not initialized, initializing...');
        await initializeDatabase();
      } else {
        // Test the connection
        await db.execAsync('SELECT 1');
      }
      lastConnectionCheck = now;
      console.log('Database connection verified');
    } catch (error) {
      console.error('Database connection check failed:', error);
      console.log('Attempting to reinitialize database...');
      await initializeDatabase();
    }
  }
}

// Helper to run SQL with promise
export async function runSql(sql: string, params: any[] = []): Promise<SQLiteResult> {
  await ensureDatabaseConnection();
  
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    if (sql.trim().toLowerCase().startsWith('select')) {
      // For SELECT queries, use getAllAsync
      const result = await db.getAllAsync(sql, params);
      return {
        rows: {
          _array: result,
          length: result.length
        },
        rowsAffected: 0,
        insertId: null
      };
    } else {
      // For other queries, use runAsync
      const result = await db.runAsync(sql, params);
      return {
        rows: { _array: [], length: 0 },
        rowsAffected: result.changes,
        insertId: result.lastInsertRowId
      };
    }
  } catch (error) {
    console.error('Error executing SQL:', sql, params, error);
    throw error;
  }
}

// Create all tables
export async function createTables() {
  try {
    console.log('Starting database table creation...');
    
    // Use the db variable that should be set by initializeDatabase
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    // Create tables using execAsync for DDL operations
    console.log('Creating appointments table...');
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
    
    console.log('Creating risk_assessment_master table...');
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
    
    console.log('Creating risk_assessment_items table...');
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
        appointmentid TEXT
      );
    `);
    
    console.log('Creating media_files table...');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS media_files (
        MediaID INTEGER PRIMARY KEY AUTOINCREMENT,
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
    
    // Create performance indexes
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
    
    // Index for pending sync items (sync operations)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_risk_items_pending_sync 
      ON risk_assessment_items(pending_sync);
    `);
    
    // Index for appointments by status (dashboard queries)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_appointments_status 
      ON appointments(inviteStatus);
    `);
    
    // Index for appointments by order ID
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_appointments_order 
      ON appointments(orderID);
    `);
    
    // Index for media files by entity
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_media_entity 
      ON media_files(EntityName, EntityID);
    `);
    
    console.log('✅ Database indexes created successfully');

    // Verify tables were created
    console.log('Verifying tables...');
    const tablesResult = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tablesResult);
    
    // Test database access
    console.log('Testing database access...');
    await db.runAsync(
      `INSERT INTO risk_assessment_items (
        riskassessmentitemid,
        riskassessmentcategoryid,
        itemprompt,
        itemtype,
        rank
      ) VALUES (?, ?, ?, ?, ?)`,
      [0, 0, 'TEST', 1, 1]
    );
    
    const testSelectResult = await db.getAllAsync('SELECT * FROM risk_assessment_items WHERE riskassessmentitemid = 0');
    console.log('Test record:', testSelectResult);
    
    await db.runAsync('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = 0');
    
    // Run migrations
    console.log('Running database migrations...');
    await migrateDatabase();
    
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    console.error('Error creating database tables:', error);
    // Don't throw the error, just log it and continue
    console.log('Continuing despite table creation error');
  }
}

// Add migration function
export async function migrateDatabase() {
  try {
    console.log('Starting database migration...');
    
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Check if appointmentid column exists using execAsync
    const tableInfo = await db.getAllAsync("PRAGMA table_info(risk_assessment_items)") as Array<{ name: string }>;
    console.log('Table info:', tableInfo);
    
    const hasAppointmentId = tableInfo.some(col => col.name === 'appointmentid');
    console.log('Has appointmentid column:', hasAppointmentId);
    
    if (!hasAppointmentId) {
      console.log('Adding appointmentid column to risk_assessment_items table...');
      await db.execAsync('ALTER TABLE risk_assessment_items ADD COLUMN appointmentid TEXT');
      console.log('Successfully added appointmentid column');
    } else {
      console.log('appointmentid column already exists');
    }
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during database migration:', error);
    // Don't throw the error, just log it and continue
    console.log('Continuing despite migration error');
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
  qty: number;
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
}

export interface MediaFile {
  MediaID?: number;
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
export async function deleteAppointment(id: number) {
  await runSql('DELETE FROM appointments WHERE appointmentID = ?', [id]);
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

    // Log the item being inserted
    console.log('Attempting to insert Risk Assessment Item:', {
      id: i.riskassessmentitemid,
      categoryId: i.riskassessmentcategoryid,
      prompt: i.itemprompt,
      type: i.itemtype,
      rank: i.rank,
      appointmentid: i.appointmentid,
      pending_sync: i.pending_sync
    });

    // Use parameterized query for better safety and reliability
    const sql = `
      INSERT OR REPLACE INTO risk_assessment_items (
        riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
        commaseparatedlist, selectedanswer, qty, price, description, model, location,
        assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
        dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
        synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Only set pending_sync if the item has been modified locally
    // For items loaded from server (issynced = 1), set pending_sync = 0
    const pendingSync = i.issynced ? 0 : (i.pending_sync ?? 1);

    const params = [
      i.riskassessmentitemid,
      i.riskassessmentcategoryid,
      i.itemprompt || '',
      i.itemtype || 0,
      i.rank || 0,
      i.commaseparatedlist || '',
      i.selectedanswer || '',
      i.qty || 0,
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
      i.appointmentid || null
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
    
    console.log('Successfully inserted and verified item');
    
  } catch (error) {
    console.error('Error inserting risk assessment item:', error);
    throw error;
  }
}
export async function getAllRiskAssessmentItems(): Promise<RiskAssessmentItem[]> {
  try {
    const res = await runSql('SELECT * FROM risk_assessment_items');
    console.log('Number of items found:', res.rows._array.length);
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching risk assessment items from SQLite:', error);
    return [];
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
  await runSql('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = ?', [id]);
}

// Get all items that need to be synced to the server
export async function getPendingSyncRiskAssessmentItems(): Promise<RiskAssessmentItem[]> {
  try {
    console.log('=== DB QUERY: Fetching pending sync risk assessment items ===');
    console.log('SQL Query: SELECT * FROM risk_assessment_items WHERE pending_sync = 1');
    
    const res = await runSql('SELECT * FROM risk_assessment_items WHERE pending_sync = 1');
    
    console.log('=== DB RESULT: Pending sync items found ===');
    console.log('Total rows returned:', res.rows._array.length);
    
    if (res.rows._array.length > 0) {
      console.log('=== FIRST ITEM FROM DB (Raw) ===');
      console.log(JSON.stringify(res.rows._array[0], null, 2));
      
      console.log('=== ALL PENDING ITEMS IDs ===');
      console.log('IDs:', res.rows._array.map(item => item.riskassessmentitemid));
    }
    
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching pending sync risk assessment items:', error);
    return [];
  }
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
    console.log('Fetching pending sync appointments from SQLite');
    const res = await runSql('SELECT * FROM appointments WHERE pending_sync = 1');
    console.log('Pending sync appointments found:', res.rows._array.length);
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
    console.log('Fetching pending sync risk assessment masters from SQLite');
    const res = await runSql('SELECT * FROM risk_assessment_master WHERE pending_sync = 1');
    console.log('Pending sync masters found:', res.rows._array.length);
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
        IsDeleted, Metadata, LocalPath, pending_sync
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      m.pending_sync ?? 1
    ];

    const result = await runSql(sql, params);
    console.log('Successfully inserted media file with ID:', result.insertId);
    return result.insertId;
    
  } catch (error) {
    console.error('Error inserting media file:', error);
    throw error;
  }
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
      ? 'SELECT * FROM media_files WHERE EntityName = ? AND EntityID = ?'
      : 'SELECT * FROM media_files WHERE EntityName = ? AND EntityID = ? AND IsDeleted = 0';
    
    console.log(`Fetching media files for ${entityName} ID ${entityID}, includeDeleted: ${includeDeleted}`);
    const res = await runSql(sql, [entityName, entityID]);
    console.log('Number of media files found:', res.rows._array.length);
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
        pending_sync = ?
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
      m.MediaID
    ];

    await runSql(sql, params);
    console.log('Updated media file:', m.MediaID);
  } catch (error) {
    console.error('Error updating media file:', error);
    throw error;
  }
}

export async function deleteMediaFile(mediaID: number) {
  try {
    // Soft delete - just mark as deleted
    await runSql(
      'UPDATE media_files SET IsDeleted = 1, pending_sync = 1 WHERE MediaID = ?',
      [mediaID]
    );
    console.log('Soft deleted media file:', mediaID);
  } catch (error) {
    console.error('Error deleting media file:', error);
    throw error;
  }
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
    console.log('Fetching pending sync media files from SQLite');
    const res = await runSql('SELECT * FROM media_files WHERE pending_sync = 1');
    console.log('Pending sync media files found:', res.rows._array.length);
    return res.rows._array;
  } catch (error) {
    console.error('Error fetching pending sync media files:', error);
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
    
    // Reset auto-increment counters
    await database.runAsync('DELETE FROM sqlite_sequence WHERE name IN ("media_files")');
    
    console.log('✅ All cached tables cleared successfully');
    
    // Verify tables are empty
    const itemsCount = await database.getAllAsync('SELECT COUNT(*) as count FROM risk_assessment_items');
    const mastersCount = await database.getAllAsync('SELECT COUNT(*) as count FROM risk_assessment_master');
    const appointmentsCount = await database.getAllAsync('SELECT COUNT(*) as count FROM appointments');
    const mediaCount = await database.getAllAsync('SELECT COUNT(*) as count FROM media_files');
    
    console.log('📊 Table counts after clearing:', {
      risk_assessment_items: (itemsCount[0] as any)?.count,
      risk_assessment_master: (mastersCount[0] as any)?.count,
      appointments: (appointmentsCount[0] as any)?.count,
      media_files: (mediaCount[0] as any)?.count
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
export async function clearTableData(tableName: 'risk_assessment_items' | 'risk_assessment_master' | 'appointments' | 'media_files'): Promise<void> {
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
    
    const stats = {
      risk_assessment_items: (itemsCount[0] as any)?.count || 0,
      risk_assessment_master: (mastersCount[0] as any)?.count || 0,
      appointments: (appointmentsCount[0] as any)?.count || 0,
      media_files: (mediaCount[0] as any)?.count || 0
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

// Batch insert risk assessment items (Step 1.2 - Performance Optimization)
export async function batchInsertRiskAssessmentItems(items: RiskAssessmentItem[]): Promise<void> {
  if (items.length === 0) return;
  
  console.log(`🔄 Batch inserting ${items.length} risk assessment items...`);
  const start = performance.now();
  
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
      
      try {
        const database = await ensureDbReady();
        
        await database.withTransactionAsync(async () => {
          const stmt = await database.prepareAsync(`
            INSERT OR REPLACE INTO risk_assessment_items (
              riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
              commaseparatedlist, selectedanswer, qty, price, description, model, location,
              assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
              dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
              synctimestamp, hasphoto, latitude, longitude, notes, pending_sync, appointmentid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                item.qty || 0,
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
                item.appointmentid || null
              ]);
            }
          } finally {
            await stmt.finalizeAsync();
          }
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
