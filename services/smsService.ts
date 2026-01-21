
/**
 * Africa's Talking SMS Adapter Simulation
 * In production, this would call the AT API gateway via backend.
 */
export const smsService = {
  async sendSMS(to: string, message: string) {
    console.log(`[Africa's Talking] Sending to ${to}: ${message}`);
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));
    return { status: 'success', messageId: 'AT_' + Math.random().toString(36).substr(2, 9) };
  },

  async sendBulkAbsenceAlerts(absentStudents: { name: string, phone: string }[]) {
    const promises = absentStudents.map(student => 
      smsService.sendSMS(student.phone, `ElimuSmart Alert: Hello, your child ${student.name} is marked absent today. Please contact the school if you are unaware of this.`)
    );
    return Promise.all(promises);
  },

  async sendFeeReminder(studentName: string, phone: string, balance: number) {
    return smsService.sendSMS(phone, `ElimuSmart Fee Reminder: Dear Guardian, your child ${studentName} has an outstanding balance of KES ${balance.toLocaleString()}. Kindly clear to avoid inconveniences.`);
  }
};
