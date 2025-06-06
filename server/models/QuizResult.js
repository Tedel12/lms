import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Aligné avec ton userId (String)
  courseId: {type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true},
  answers: [{ questionIndex: Number, selectedOption: Number }], // Ex. : [{ questionIndex: 0, selectedOption: 2 }]
  score: { type: Number, required: true }, // Ex. : 75 (pour 75%)
  completedAt: { type: Date, default: Date.now },
  isValidatedByEducator: {type: Boolean, default: false},
}, { minimize: false });

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);