
import { Request, Response } from 'express';
import { initiateStkPush } from '../services/mpesaService';
import { Payment, Student } from '../models';

// Initiate an M-Pesa STK Push prompt to a parent's phone for fee payment
export const stkPush = async (req: any, res: any): Promise<void> => {
  const { phone, amount, studentId } = req.body;
  try {
    const student = await Student.findByPk(studentId);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const result = await initiateStkPush(phone, amount, student.admissionNumber);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during M-Pesa STK Push';
    res.status(500).json({ message: 'M-Pesa STK Push failed', error: errorMessage });
  }
};

interface MpesaCallbackItem {
  Name: string;
  Value: string | number;
}

interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      ResultCode: number;
      CallbackMetadata?: {
        Item: MpesaCallbackItem[];
      };
    };
  };
}

// Asynchronous callback handler for M-Pesa transaction results
export const mpesaCallback = async (req: any, res: any): Promise<void> => {
  const { Body } = req.body as MpesaCallbackBody;
  const result = Body.stkCallback;

  if (result.ResultCode === 0 && result.CallbackMetadata) {
    const metadata = result.CallbackMetadata.Item;
    const amount = metadata.find(i => i.Name === 'Amount')?.Value as number;
    const receipt = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value as string;
    const phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value;

    const student = await Student.findOne({ where: { guardianPhone: phone?.toString().slice(-9) } });
    if (student) {
      await Payment.create({
        studentId: student.id,
        amount,
        method: 'M-PESA',
        transactionId: receipt,
        description: 'Auto-recorded via M-Pesa STK Push'
      });
    }
  }
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
};
