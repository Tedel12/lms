import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Aligné avec ton userId (String)
  courseId: { type: String, required: true },
  answers: [{ questionIndex: Number, selectedOption: Number }], // Ex. : [{ questionIndex: 0, selectedOption: 2 }]
  score: { type: Number, required: true }, // Ex. : 75 (pour 75%)
  completedAt: { type: Date, default: Date.now },
}, { minimize: false });

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);