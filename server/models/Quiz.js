import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  courseId: { type: String, required: true }, // Aligné avec ton courseId (String)
  questions: [
    {
      questionText: { type: String, required: true },
      options: [{ type: String, required: true }], // Ex. : ["Option 1", "Option 2", "Option 3", "Option 4"]
      correctAnswer: { type: Number, required: true }, // Index de la bonne réponse (0 à 3)
    },
  ],
  createdAt: { type: Date, default: Date.now },
}, { minimize: false });

export const Quiz = mongoose.model('Quiz', quizSchema);