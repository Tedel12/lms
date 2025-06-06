import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true},
  submission: { type: String, required: true }, // Chemin du fichier ou URL du lien
  submissionType: { type: String, enum: ['file', 'link'], required: true }, // Type de soumission
  isValidatedByEducator: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
  validatedAt: { type: Date }
});

export default mongoose.model('Project', projectSchema);