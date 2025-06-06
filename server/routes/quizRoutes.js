import express from 'express';
import { Quiz } from '../models/Quiz.js';
import { QuizResult } from '../models/QuizResult.js';
import { CourseProgress } from '../models/CourseProgress.js';
import { protectEducator } from '../middlewares/authMiddleware.js'

const router = express.Router();

// // Middleware pour vérifier le token (à adapter à ton auth)
// const authMiddleware = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ error: 'Non autorisé' });
//   // Vérifie le token ici (ex. : avec jwt.verify si tu utilises JWT)
//   req.user = { _id: 'userIdFromToken' }; // Remplace par ton décodage du token
//   next();
// };


// Ajouter ou modifier un QCM
router.post('/create', protectEducator, async (req, res) => {
    try {
      const { courseId, questions } = req.body;
  
      // Valider les données
      if (!questions || questions.length > 4 || questions.length === 0) {
        return res.status(400).json({ error: 'Le QCM doit avoir entre 1 et 4 questions' });
      }
      for (const question of questions) {
        if (!question.questionText || !question.options || question.options.length !== 4 || question.correctAnswer < 0 || question.correctAnswer > 3) {
          return res.status(400).json({ error: 'Format de question invalide' });
        }
      }
  
      // Supprimer le QCM existant (si modification)
      await Quiz.deleteOne({ courseId });
  
      // Créer le nouveau QCM
      const quiz = new Quiz({
        courseId,
        questions,
      });
      await quiz.save();
  
      res.json({ message: 'QCM créé avec succès' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  




// Récupérer le QCM d’un cours
router.post('/get-quiz', async (req, res) => {
  try {
    const userId = req.auth.userId
    const { courseId } = req.body;
    const progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress || !progress.completed) {
      return res.status(403).json({ error: 'Vous devez terminer le cours pour passer le QCM' });
    }
    const quiz = await Quiz.findOne({  courseId });
    if (!quiz) return res.status(404).json({ error: 'QCM non trouvé' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Soumettre les réponses du QCM
router.post('/submit', async (req, res) => {
  try {
    const { courseId, answers } = req.body;
  

    const userId = req.auth.userId;
 
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!courseId) {
      return res.status(400).json({ error: 'courseId requis' });
    }

    const quiz = await Quiz.findOne({ courseId });
    
    if (!quiz) {
      return res.status(404).json({ error: 'QCM non trouvé' });
    }

    const progress = await CourseProgress.findOne({ userId, courseId });
   
    if (!progress || !progress.completed) {
      return res.status(403).json({ error: 'Vous devez terminer le cours pour passer le QCM' });
    }

    // Vérifier les réponses
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
   
      return res.status(400).json({ error: 'Nombre de réponses invalide' });
    }
    for (const answer of answers) {
      if (
        typeof answer.questionIndex !== 'number' ||
        typeof answer.selectedOption !== 'number' ||
        answer.questionIndex < 0 ||
        answer.questionIndex >= quiz.questions.length ||
        answer.selectedOption < 0 ||
        answer.selectedOption >= quiz.questions[answer.questionIndex]?.options.length
      ) {
       
        return res.status(400).json({ error: 'Format de réponse invalide' });
      }
    }

    // Calculer le score
    let correctAnswers = 0;
    answers.forEach((answer) => {

      if (quiz.questions[answer.questionIndex].correctAnswer === answer.selectedOption) {
        correctAnswers++;
      }
    });
    const score = (correctAnswers / quiz.questions.length) * 100;


    const updateData = {
      userId,
      courseId,
      answers,
      score,
      isValidatedByEducator: false
    }

    if (score === 100) {
      updateData.completedAt = new Date();
    }


    // Mettre à jour ou créer le QuizResult
    const quizResult = await QuizResult.findOneAndUpdate(
      { userId, courseId }, // Recherche par userId et courseId
      updateData,         // Mise à jour des champs
      { upsert: true, new: true } // Créer si n'existe pas, retourner le document mis à jour
    );
   

    res.json({
      score,
      message: `Votre score est de ${score}%`,
      correctAnswers,
      totalQuestions: quiz.questions.length
    });
  } catch (error) {
    console.error('Submit quiz error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



// Dans routes/quizRoutes.js pour vérifier si un QCM a été validé
router.post('/result', async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    if (!courseId) {
      return res.status(400).json({ error: 'courseId requis' });
    }

    const quizResult = await QuizResult.findOne({ userId, courseId });

    res.json({
      hasPassed: !!quizResult,
      score: quizResult ? quizResult.score : null,
      completedAt: quizResult ?  quizResult.completedAt : null,
      isValidatedByEducator: quizResult ? quizResult.isValidatedByEducator : false
    });
  } catch (error) {
    console.error('Check quiz result error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;