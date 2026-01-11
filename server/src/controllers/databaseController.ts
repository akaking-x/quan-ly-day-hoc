import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Student } from '../models/Student';
import { Group } from '../models/Group';
import { Session } from '../models/Session';
import { Payment } from '../models/Payment';
import { Note } from '../models/Note';
import { Setting } from '../models/Setting';
import { User } from '../models/User';

// Get database info
export const getDatabaseInfo = async (req: Request, res: Response) => {
  try {
    const connection = mongoose.connection;
    const isConnected = connection.readyState === 1;

    // Get current URI (mask password)
    const currentUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-management';
    const maskedUri = currentUri.replace(/:([^:@]+)@/, ':****@');

    // Get collection counts
    const collections: { name: string; count: number }[] = [];

    if (isConnected) {
      const db = connection.db;
      if (db) {
        const collectionList = await db.listCollections().toArray();
        for (const col of collectionList) {
          const count = await db.collection(col.name).countDocuments();
          collections.push({ name: col.name, count });
        }
      }
    }

    res.json({
      success: true,
      data: {
        currentUri: maskedUri,
        isConnected,
        databaseName: connection.db?.databaseName || 'Unknown',
        collections,
      },
    });
  } catch (error) {
    console.error('Error getting database info:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lấy thông tin database',
    });
  }
};

// Test a connection string
export const testConnection = async (req: Request, res: Response) => {
  try {
    const { uri } = req.body;

    if (!uri) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp connection string',
      });
    }

    // Create a new connection to test
    const testConnection = await mongoose.createConnection(uri).asPromise();
    const databaseName = testConnection.db?.databaseName;

    // Close test connection
    await testConnection.close();

    res.json({
      success: true,
      data: {
        success: true,
        message: `Kết nối thành công đến database: ${databaseName}`,
        databaseName,
      },
    });
  } catch (error: any) {
    console.error('Connection test failed:', error);
    res.json({
      success: true,
      data: {
        success: false,
        message: error.message || 'Không thể kết nối',
      },
    });
  }
};

// Switch database (requires server restart)
export const switchDatabase = async (req: Request, res: Response) => {
  try {
    const { uri } = req.body;

    if (!uri) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp connection string',
      });
    }

    // Test connection first
    const testConn = await mongoose.createConnection(uri).asPromise();
    await testConn.close();

    // Update environment variable (this will be used on next startup)
    process.env.MONGODB_URI = uri;

    // Close current connection
    await mongoose.disconnect();

    // Connect to new database
    await mongoose.connect(uri);

    res.json({
      success: true,
      data: {
        success: true,
        message: 'Đã chuyển sang database mới',
      },
    });
  } catch (error: any) {
    console.error('Switch database failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Không thể chuyển database',
    });
  }
};

// Migrate data to another database
export const migrateData = async (req: Request, res: Response) => {
  try {
    const { targetUri, clearTarget } = req.body;

    if (!targetUri) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp URI database đích',
      });
    }

    // Connect to target database
    const targetConnection = await mongoose.createConnection(targetUri).asPromise();
    const targetDb = targetConnection.db;

    if (!targetDb) {
      throw new Error('Không thể kết nối đến database đích');
    }

    // Clear target if requested
    if (clearTarget) {
      const collections = await targetDb.listCollections().toArray();
      for (const col of collections) {
        await targetDb.collection(col.name).deleteMany({});
      }
    }

    // Migrate each collection
    const migratedCounts = {
      students: 0,
      groups: 0,
      sessions: 0,
      payments: 0,
      notes: 0,
      settings: 0,
      users: 0,
    };

    // Migrate students
    const students = await Student.find().lean();
    if (students.length > 0) {
      await targetDb.collection('students').insertMany(students);
      migratedCounts.students = students.length;
    }

    // Migrate groups
    const groups = await Group.find().lean();
    if (groups.length > 0) {
      await targetDb.collection('groups').insertMany(groups);
      migratedCounts.groups = groups.length;
    }

    // Migrate sessions
    const sessions = await Session.find().lean();
    if (sessions.length > 0) {
      await targetDb.collection('sessions').insertMany(sessions);
      migratedCounts.sessions = sessions.length;
    }

    // Migrate payments
    const payments = await Payment.find().lean();
    if (payments.length > 0) {
      await targetDb.collection('payments').insertMany(payments);
      migratedCounts.payments = payments.length;
    }

    // Migrate notes
    const notes = await Note.find().lean();
    if (notes.length > 0) {
      await targetDb.collection('notes').insertMany(notes);
      migratedCounts.notes = notes.length;
    }

    // Migrate settings
    const settings = await Setting.find().lean();
    if (settings.length > 0) {
      await targetDb.collection('settings').insertMany(settings);
      migratedCounts.settings = settings.length;
    }

    // Migrate users
    const users = await User.find().lean();
    if (users.length > 0) {
      await targetDb.collection('users').insertMany(users);
      migratedCounts.users = users.length;
    }

    // Close target connection
    await targetConnection.close();

    const total = Object.values(migratedCounts).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      data: {
        success: true,
        message: `Đã migrate ${total} bản ghi thành công`,
        migratedCounts,
      },
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi xảy ra khi migrate',
    });
  }
};
