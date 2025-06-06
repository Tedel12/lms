import express from 'express'
import { addUserRating, getUserCourseProgress, getUserData, getUserProjects, purchaseCourse, submitProject, updateUserCourseProgress, userEnrolledCourses } from '../controllers/userController.js'

const userRouter = express.Router()

userRouter.get('/data', getUserData)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/purchase', purchaseCourse)
userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)
userRouter.post('/add-ratings', addUserRating)
userRouter.post('/project/submit', submitProject)
userRouter.get('/projects', getUserProjects)

export default userRouter;