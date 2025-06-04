import * as SQLite from 'expo-sqlite';

// Initialize database using the new async API
let db: SQLite.SQLiteDatabase;

interface SQLiteResult {
  rows: {
    _array: any[];
    length: number;
  };
  rowsAffected: number;
  insertId?: number | null;
}

// Initialize the database
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    db = await SQLite.openDatabaseAsync('valuations.db');
    console.log('Database opened successfully');
    await createTables();
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Helper to run SQL with promise
export async function runSql(sql: string, params: any[] = []): Promise<SQLiteResult> {
  try {
    console.log('Executing SQL:', sql, 'with params:', params);
    
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
    console.error('Error executing SQL:', error);
    throw error;
  }
}

// Create all tables
export async function createTables() {
  try {
    console.log('Starting database table creation...');
    
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
        pending_sync INTEGER DEFAULT 0
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
    
    // Verify tables were created
    console.log('Verifying tables...');
    const tables = await runSql("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.rows._array);
    
    // Test database access
    console.log('Testing database access...');
    await runSql(
      `INSERT INTO risk_assessment_items (
        riskassessmentitemid,
        riskassessmentcategoryid,
        itemprompt,
        itemtype,
        rank
      ) VALUES (?, ?, ?, ?, ?)`,
      [0, 0, 'TEST', 1, 1]
    );
    
    const testSelect = await runSql('SELECT * FROM risk_assessment_items WHERE riskassessmentitemid = 0');
    console.log('Test record:', testSelect.rows._array);
    
    await runSql('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = 0');
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    console.error('Error creating database tables:', error);
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
    // Log the item being inserted
    console.log('Attempting to insert Risk Assessment Item:', {
      id: i.riskassessmentitemid,
      categoryId: i.riskassessmentcategoryid,
      prompt: i.itemprompt,
      type: i.itemtype,
      rank: i.rank
    });

    // Use parameterized query for better safety and reliability
    const sql = `
      INSERT OR REPLACE INTO risk_assessment_items (
        riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank,
        commaseparatedlist, selectedanswer, qty, price, description, model, location,
        assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
        dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus,
        synctimestamp, hasphoto, latitude, longitude, notes, pending_sync
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    const params = [
      i.riskassessmentitemid,
      i.riskassessmentcategoryid,
      i.itemprompt,
      i.itemtype,
      i.rank,
      i.commaseparatedlist,
      i.selectedanswer,
      i.qty,
      i.price,
      i.description,
      i.model,
      i.location,
      i.assessmentregisterid,
      i.assessmentregistertypeid,
      i.datecreated,
      i.createdbyid,
      i.dateupdated,
      i.updatedbyid,
      i.issynced ? 1 : 0,
      i.syncversion,
      i.deviceid,
      i.syncstatus,
      i.synctimestamp,
      i.hasphoto ? 1 : 0,
      i.latitude,
      i.longitude,
      i.notes,
      i.pending_sync ?? 1
    ];

    await runSql(sql, params);
    
    // Verify the insert by fetching the item back
    const verifyResult = await runSql(
      'SELECT * FROM risk_assessment_items WHERE riskassessmentitemid = ?',
      [i.riskassessmentitemid]
    );
    console.log('Verification query result:', verifyResult);
    
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
    console.log('Fetching all risk assessment items from SQLite');
    const res = await runSql('SELECT * FROM risk_assessment_items');
    console.log('SQLite query result:', res);
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
  await insertRiskAssessmentItem(i);
}
export async function deleteRiskAssessmentItem(id: number) {
  await runSql('DELETE FROM risk_assessment_items WHERE riskassessmentitemid = ?', [id]);
}

// Get all items that need to be synced to the server
export async function getPendingSyncRiskAssessmentItems(): Promise<RiskAssessmentItem[]> {
  try {
    console.log('Fetching pending sync risk assessment items from SQLite');
    const res = await runSql('SELECT * FROM risk_assessment_items WHERE pending_sync = 1');
    console.log('Pending sync items found:', res.rows._array.length);
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
