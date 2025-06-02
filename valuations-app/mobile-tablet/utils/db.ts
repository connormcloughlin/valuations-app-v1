import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("valuations.db");

// Helper to run SQL with promise
export function runSql(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, result: any) => resolve(result),
        (_: any, error: any) => {
          reject(error);
          return false;
        },
      );
    });
  });
}

// Create all tables
export async function createTables() {
  // Appointments
  await runSql(`
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

  // Risk Assessment Master
  await runSql(`
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

  // Risk Assessment Items
  await runSql(`
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
  await runSql(
    `INSERT OR REPLACE INTO risk_assessment_items (
      riskassessmentitemid, riskassessmentcategoryid, itemprompt, itemtype, rank, commaseparatedlist, selectedanswer,
      qty, price, description, model, location, assessmentregisterid, assessmentregistertypeid, datecreated, createdbyid,
      dateupdated, updatedbyid, issynced, syncversion, deviceid, syncstatus, synctimestamp, hasphoto, latitude, longitude, notes, pending_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      i.riskassessmentitemid, i.riskassessmentcategoryid, i.itemprompt, i.itemtype, i.rank, i.commaseparatedlist, i.selectedanswer,
      i.qty, i.price, i.description, i.model, i.location, i.assessmentregisterid, i.assessmentregistertypeid, i.datecreated, i.createdbyid,
      i.dateupdated, i.updatedbyid, i.issynced, i.syncversion, i.deviceid, i.syncstatus, i.synctimestamp, i.hasphoto, i.latitude, i.longitude, i.notes, i.pending_sync ?? 1
    ]
  );
}
export async function getAllRiskAssessmentItems(): Promise<RiskAssessmentItem[]> {
  const res = await runSql('SELECT * FROM risk_assessment_items');
  return res.rows._array;
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
