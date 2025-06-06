import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import Project from '../models/Project.js';
import { QuizResult } from '../models/QuizResult.js';
import multer from 'multer';
import path from 'path';

//get user data
export const getUserData = async (req, res) =>{
    try {
        const userId = req.auth.userId
        const user = await User.findById(userId)

        if (!user) {
            return res.json({success: false, message: "User not found"})
        }

        res.json({success: true, user})
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

//users enrolled courses with lecture links
export const userEnrolledCourses = async (req, res) =>{
    try {
        const userId = req.auth.userId
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({success: true, enrolledCourses: userData.enrolledCourses})
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}



// purchase course (endpoint pour s'inscrire au cours)
export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.auth.userId;

        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);

        // Vérifie que le cours existe
        if (!courseData) {
            return res.json({ success: false, message: 'Cours non trouvé.' });
        }

        // Vérifie que l'utilisateur existe
        if (!userData) {
            return res.json({ success: false, message: 'Utilisateur non trouvé.' });
        }

        // Vérifie si l'utilisateur est déjà inscrit à ce cours
        if (userData.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'Vous êtes déjà inscrit à ce cours.' });
        }

        // Calcul du prix après réduction
        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (
                courseData.coursePrice -
                (courseData.discount * courseData.coursePrice) / 100
            ).toFixed(2),
            status: 'completed', // ajout d'une date d'achat
        };

        // Mise à jour des cours de l'utilisateur
        userData.enrolledCourses.push(courseData._id);
        await userData.save();

        // Mise à jour des étudiants du cours
        courseData.enrolledStudents.push(userId);
        await courseData.save();

        // Enregistrement dans la collection Purchase
        const newPurchase = await Purchase.create(purchaseData);

        // Réponse succès
        res.json({
            success: true,
            message: 'Inscription réussie avec succès.',
            newPurchase
        });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// update user course progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId
        const { courseId, lectureId } = req.body;
        const  progressData = await CourseProgress.findOne({userId, courseId})

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture déjà terminé'})
            }

            progressData.lectureCompleted.push(lectureId)
            await progressData.save()
        } else{
            await CourseProgress.create({
                userId, courseId, lectureCompleted: [lectureId], completed: true
            })
        }
        res.json({success: true, message: 'La progression a été mise à jour avec succès'})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

//get user course progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId
        const { courseId } = req.body
        const progressData = await CourseProgress.findOne({userId, courseId})
        res.json({success: true, progressData})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// add user ratings to course
export const addUserRating = async (req, res) =>{
    const userId = req.auth.userId;
    const { courseId, rating } = req.body;

    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
        return res.json({succes: false, message: 'Détails invalides.'});
    }

    try {
        const course = await Course.findById(courseId)

        if (!course) {
            return res.json({success: false, message: 'Cours indisponible.'})
        }

        const user = await User.findById(userId);

        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.jon({success: false, message: 'Ce cours est non lu ou non payé.'});
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId)

        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating  = rating;
        }else{
            course.courseRatings.push({userId, rating});
        }
        await course.save();

        return res.json({success: true, message: "Note ajouté avec succès, merci pour votre avis !"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}




// Configuration de multer pour gérer les uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier où stocker les fichiers
  },
  filename: (req, file, cb) => {
    cb(null,` ${Date.now()}-${file.originalname}`); // Nom unique pour le fichier
  }
});


const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const filetypes = /pdf|zip/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Seuls les fichiers PDF et ZIP sont autorisés'));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
  }).single('file');
  


// Soumettre un projet (étudiant)
export const submitProject = async (req, res) => {
    try {
      // Gérer l'upload du fichier avec multer
      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
  
        const { courseId, link } = req.body;
        const userId = req.auth.userId;
  
        // Vérifier les données
        if (!courseId) {
          return res.status(400).json({ error: 'courseId requis' });
        }
  
        if (!req.file && !link) {
          return res.status(400).json({ error: 'Un fichier ou un lien est requis' });
        }
  
        if (req.file && link) {
          return res.status(400).json({ error: 'Vous ne pouvez pas soumettre un fichier et un lien en même temps' });
        }
  
        const existingProject = await Project.findOne({ userId, courseId });
        if (existingProject) {
          return res.status(400).json({ error: 'Projet déjà soumis pour ce cours' });
        }
  
        const project = new Project({
          userId,
          courseId,
          submission: req.file ? `/uploads/${req.file.filename}` : link,
          submissionType: req.file ? 'file' : 'link'
        });
        await project.save();
  
        res.json({ message: 'Projet soumis avec succès' });
      });
    } catch (error) {
      console.error('Submit project error:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };

  // Récupérer les projets de l’utilisateur (étudiant)
export const getUserProjects = async (req, res) => {
    try {
      const userId = req.auth.userId;
      const projects = await Project.find({ userId }).populate('courseId', 'courseTitle');
  
      const formattedProjects = projects.map(project => ({
        projectId: project._id,
        userId: project.userId,
        courseId: project.courseId._id,
        courseTitle: project.courseId?.courseTitle || 'Cours inconnu',
        submission: project.submission,
        submissionType: project.submissionType,
        submittedAt: project.submittedAt,
        isValidatedByEducator: project.isValidatedByEducator,
        validatedAt: project.validatedAt
      }));
  
      res.json(formattedProjects);
    } catch (error) {
      console.error('Get user projects error:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };