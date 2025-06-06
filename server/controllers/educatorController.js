import {clerkClient} from '@clerk/express'
import Course from '../models/Course.js'
import {v2 as cloudinary} from 'cloudinary'
import { Purchase } from '../models/Purchase.js'
import User from '../models/User.js'
import { QuizResult } from '../models/QuizResult.js';
import Project from '../models/Project.js'
import fs from 'fs'



// Récupérer le nom d’un étudiant depuis la base de données
const getStudentName = async (userId) => {
  try {
    const user = await User.findOne({ userId });
    return user?.name || user?.email || `Étudiant ${userId}`;
  } catch (error) {
    console.error('Erreur récupération nom étudiant:', error);
    return `Étudiant ${userId}`;
  }
};


// Lister les certificats en attente de validation
export const getPendingCertificates = async (req, res) => {
  try {
    const pendingCertificates = await QuizResult.find({
      score: 100,
      isValidatedByEducator: false
    }).populate('courseId', 'courseTitle'); // Assure-toi que courseTitle est bien défini

    const certificates = await Promise.all(
      pendingCertificates.map(async (quizResult) => {
        const studentName = await getStudentName(req.auth.userId);
        return {
          quizResultId: quizResult._id,
          userId: quizResult.userId,
          courseId: quizResult.courseId,
          courseTitle: quizResult.courseId?.courseTitle, // À vérifier
          completedAt: quizResult.completedAt,
          studentName
        };
      })
    );

    res.json(certificates);
  } catch (error) {
    console.error('Get pending certificates error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};



// Valider un certificat
export const validateCertificate = async (req, res) => {
  try {
    const { quizResultId } = req.body;
   

    if (!quizResultId) {
      return res.status(400).json({ error: 'quizResultId requis' });
    }

    const quizResult = await QuizResult.findById(quizResultId);
    if (!quizResult) {
      return res.status(404).json({ error: 'Résultat de QCM non trouvé' });
    }

    if (quizResult.score !== 100) {
      return res.status(400).json({ error: 'Le score doit être de 100% pour valider' });
    }

    quizResult.isValidatedByEducator = true;
    await quizResult.save();
 

    res.json({ message: 'QCM validé avec succès' });
  } catch (error) {
    console.error('Validate certificate error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};




// update role to educator
export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        })

        res.json({ success: true, message: "Vous pouvez publier un cours maintenant"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}


//add new course
export const addCourse = async (req, res) => {
    try {
        const { courseData } = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        if (!imageFile) {
            return res.json({success: false, message: 'La vignette du cours est absent | Thumbnail not attached'})
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = educatorId
        const newCourse = await Course.create(parsedCourseData)
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
        newCourse.courseThumbnail = imageUpload.secure_url
        await newCourse.save()

        res.json({
            success: true,
            message: 'Le cours a été ajouté avec succès'
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

// get educator courses 
export const getEducatorCourses = async (req, res) =>{
    try {
        const educator = req.auth.userId

        const courses = await Course.find({educator})
        res.json({success: true, courses})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// avoir les statistiques du dashabord educator
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({educator});
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        //calculate total earnings from purchases
        const purchases = await Purchase.find({
            courseId: {$in: courseIds},
            status: 'completed'
        })

        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)

        //cllect unique enrolled student IDs with their course titles
        const enrolledStudentsData = [];
        for(const course of courses){
            const students = await User.find({
                _id: {$in: course.enrolledStudents}
            }, 'name imageUrl');

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        res.json({
            success: true,
            dashboardData: {
                totalEarnings, enrolledStudentsData, totalCourses
            }
        })

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({educator})
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: {$in: courseIds},
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseData: purchase.createdAt
        }));

        res.json({
            success: true, enrolledStudents
        })

    } catch (error) {
        res.json({success: false,  message: error.message})
    }
}



// Lister les projets en attente (éducateur)
export const getPendingProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isValidatedByEducator: false }).populate('courseId', 'courseTitle');

    const formattedProjects = await Promise.all(
      projects.map(async (project) => {
        const studentName = await getStudentName(project.userId);
        const quizResult = await QuizResult.findOne({
          userId: project.userId,
          courseId: project.courseId,
          score: 100,
          isValidatedByEducator: true
        });

        const course = await Course.findById(project.courseId);
        return {
          projectId: project._id,
          userId: project.userId,
          courseId: project.courseId,
          courseTitle: course ? course.courseTitle : 'Cours inconnu',
          submission: project.submission,
          submissionType: project.submissionType,
          submittedAt: project.submittedAt,
          studentName,
          quizValidated: !!quizResult,
          isValidatedByEducator: project.isValidatedByEducator
        };
      })
    );

    res.json(formattedProjects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


// Valider un projet (éducateur)
export const validateProject = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId requis' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    project.isValidatedByEducator = true;
    project.validatedAt = new Date();
    await project.save();

    res.json({ message: 'Projet validé avec succès' });
  } catch (error) {
    console.error('Validate project error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


//supprimer les projets
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Supprimer le fichier associé si c’est un upload
    

    await Project.findByIdAndDelete(projectId);
    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};