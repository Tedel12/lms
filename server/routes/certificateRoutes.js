import express from 'express';
import Certificate from '../models/Certificate.js';

const Certificaterouter = express.Router();

// Générer un certificat et un lien unique
Certificaterouter.post('/generate', async (req, res) => {
  try {
    const { courseId, courseTitle, studentName, completedAt } = req.body;

    const userId = req.auth.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!courseId || !courseTitle || !studentName || !completedAt) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const certificateNumber = `${userId}-${courseId}`;
    const existingCertificate = await Certificate.findOne({ certificateNumber });
    if (existingCertificate) {
      return res.json({ certificateId: existingCertificate._id });
    }

    const certificate = new Certificate({
      userId,
      courseId,
      courseTitle,
      studentName,
      completedAt,
      certificateNumber
    });
    await certificate.save();


    res.json({ certificateId: certificate._id });
  } catch (error) {
    console.error('Generate certificate error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Voir un certificat via un lien public
Certificaterouter.get('/view/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificat non trouvé' });
    }

    res.json({
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      completedAt: certificate.completedAt,
      certificateNumber: certificate.certificateNumber
    });
  } catch (error) {
    console.error('View certificate error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default Certificaterouter;