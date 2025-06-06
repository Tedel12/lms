import express from "express";
import { addCourse, deleteProject, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, getPendingCertificates, getPendingProjects, updateRoleToEducator, validateCertificate, validateProject } from "../controllers/educatorController.js";
import upload from "../configs/multer.js";
import { protectEducator } from '../middlewares/authMiddleware.js'

const educatorRouter = express.Router()

// Add eductor role
educatorRouter.get('/update-role', updateRoleToEducator)
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)
educatorRouter.get('/certificates/pending', protectEducator, getPendingCertificates)
educatorRouter.post('/certificates/validate', protectEducator, validateCertificate)
educatorRouter.get('/projects/pending', protectEducator, getPendingProjects)
educatorRouter.post('/projects/validate', protectEducator, validateProject)
educatorRouter.delete('/delete-project/:projectId', protectEducator, deleteProject);

export default educatorRouter;