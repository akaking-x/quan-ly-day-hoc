import { Response } from 'express';
import { Payment } from '../models/Payment';
import { AuthRequest } from '../middleware/auth';

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, startDate, endDate } = req.query;
    const filter: Record<string, unknown> = { userId: req.user?._id };

    if (studentId) filter.studentId = studentId;
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate)
        (filter.paymentDate as Record<string, unknown>).$gte = new Date(startDate as string);
      if (endDate)
        (filter.paymentDate as Record<string, unknown>).$lte = new Date(endDate as string);
    }

    const payments = await Payment.find(filter).populate('studentId').sort({ paymentDate: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getPayment = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, userId: req.user?._id }).populate('studentId');
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const payment = new Payment({ ...req.body, userId: req.user?._id });
    await payment.save();
    const populated = await Payment.findById(payment._id).populate('studentId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const updatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('studentId');
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await Payment.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, data: { message: 'Payment deleted' } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
