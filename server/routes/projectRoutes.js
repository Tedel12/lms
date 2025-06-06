import express from 'express';

// import { submitProject } from '../controllers/educatorController.js'; // Utiliser le même contrôleur pour l’instant

const projectRouter = express.Router();

// Soumettre un projet (accessible aux étudiants)
// projectRouter.post('/project/submit', authMiddleware, submitProject);

export default projectRouter;