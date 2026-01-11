import { Response } from 'express';
import { Group, getCurrentSchoolYear } from '../models/Group';
import { Student } from '../models/Student';
import { AuthRequest } from '../middleware/auth';

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const { active, schoolYear } = req.query;
    const filter: Record<string, unknown> = { userId: req.user?._id };
    if (active !== undefined) filter.active = active === 'true';
    if (schoolYear) filter.schoolYear = schoolYear;

    const groups = await Group.find(filter).sort({ schoolYear: -1, name: 1 });
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get list of available school years
export const getSchoolYears = async (req: AuthRequest, res: Response) => {
  try {
    const years = await Group.distinct('schoolYear', { userId: req.user?._id });
    // Sort years in descending order
    years.sort((a, b) => b.localeCompare(a));
    // Include current year if not in list
    const currentYear = getCurrentSchoolYear();
    if (!years.includes(currentYear)) {
      years.unshift(currentYear);
    }
    res.json({ success: true, data: years });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    // Set default school year if not provided
    const schoolYear = req.body.schoolYear || getCurrentSchoolYear();
    const group = new Group({ ...req.body, schoolYear, userId: req.user?._id });
    await group.save();
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    // Handle duplicate key error
    if ((error as { code?: number }).code === 11000) {
      return res.status(400).json({
        success: false,
        error: `Lớp "${req.body.name}" đã tồn tại trong năm học ${req.body.schoolYear || getCurrentSchoolYear()}`,
      });
    }
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: group });
  } catch (error) {
    // Handle duplicate key error
    if ((error as { code?: number }).code === 11000) {
      return res.status(400).json({
        success: false,
        error: `Lớp "${req.body.name}" đã tồn tại trong năm học này`,
      });
    }
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { active: false },
      { new: true }
    );
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getGroupStudents = async (req: AuthRequest, res: Response) => {
  try {
    const students = await Student.find({
      userId: req.user?._id,
      groupId: req.params.id,
      active: true,
    }).sort({ name: 1 });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const addStudentToGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.body;
    const group = await Group.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const student = await Student.findOneAndUpdate(
      { _id: studentId, userId: req.user?._id },
      { groupId: req.params.id, type: 'group' },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const removeStudentFromGroup = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.studentId, userId: req.user?._id },
      { groupId: null, type: 'individual' },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Advance a group to the next school year
// This will:
// 1. Create a new group with the next school year
// 2. Optionally update all students' grades (+1)
// 3. Move students to the new group
// 4. Archive (deactivate) the old group
export const advanceToNextYear = async (req: AuthRequest, res: Response) => {
  try {
    const { newName, incrementGrade = true } = req.body;
    const oldGroup = await Group.findOne({ _id: req.params.id, userId: req.user?._id });

    if (!oldGroup) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Calculate the next school year
    const currentYearParts = oldGroup.schoolYear.split('-');
    const nextYear = `${parseInt(currentYearParts[1])}-${parseInt(currentYearParts[1]) + 1}`;

    // Check if a group with the new name already exists in the next year
    const existingGroup = await Group.findOne({
      userId: req.user?._id,
      name: newName || oldGroup.name,
      schoolYear: nextYear,
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        error: `Lớp "${newName || oldGroup.name}" đã tồn tại trong năm học ${nextYear}`,
      });
    }

    // Create the new group
    const newGroup = new Group({
      userId: req.user?._id,
      name: newName || oldGroup.name,
      description: oldGroup.description,
      schoolYear: nextYear,
      schedule: oldGroup.schedule,
      defaultFeePerSession: oldGroup.defaultFeePerSession,
      active: true,
    });
    await newGroup.save();

    // Get all students in the old group
    const students = await Student.find({
      userId: req.user?._id,
      groupId: oldGroup._id,
      active: true,
    });

    // Update students: move to new group and optionally increment grade
    const updateData: Record<string, unknown> = { groupId: newGroup._id };

    for (const student of students) {
      const studentUpdate: Record<string, unknown> = { groupId: newGroup._id };
      if (incrementGrade && student.grade) {
        studentUpdate.grade = student.grade + 1;
      }
      await Student.findByIdAndUpdate(student._id, studentUpdate);
    }

    // Archive the old group
    oldGroup.active = false;
    await oldGroup.save();

    res.json({
      success: true,
      data: {
        oldGroup,
        newGroup,
        studentsUpdated: students.length,
      },
    });
  } catch (error) {
    // Handle duplicate key error
    if ((error as { code?: number }).code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Lớp đã tồn tại trong năm học mới',
      });
    }
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
