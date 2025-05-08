import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"

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
                userId, courseId, lectureCompleted: [lectureId]
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
        const progressData = await Purchase.findOne({userId, courseId})
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

        return res.json({succes: true, message: "Not ajouté avec succès, merci pour votre avis !"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}