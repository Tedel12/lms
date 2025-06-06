import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  courseTitle: { type: String, required: true },
  studentName: { type: String, required: true },
  completedAt: { type: Date, required: true },
  certificateNumber: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Certificate', certificateSchema);