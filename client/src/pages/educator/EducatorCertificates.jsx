import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { AppContext } from '../../context/AppContext';

const EducatorCertificates = () => {
  const { backendUrl, getToken, userData } = useContext(AppContext);
  const [pendingCertificates, setPendingCertificates] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchPendingCertificates = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/educator/certificates/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingCertificates(data);
      console.log('Pending certificates:', data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Accès réservé aux éducateurs');
      } else {
        toast.error(error.message);
      }
    }
  };

  const fetchPendingProjects = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/educator/projects/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingProjects(data);
      console.log('Pending projects:', data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Accès réservé aux éducateurs');
      } else {
        toast.error(error.message);
      }
    }
  }; 

  const validateCertificate = async (quizResultId) => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/educator/certificates/validate`,
        { quizResultId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('QCM validé avec succès');
      fetchPendingCertificates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const validateProject = async (projectId) => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/educator/projects/validate`,
        { projectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Projet validé avec succès');
      fetchPendingProjects();
    } catch (error) {
      toast.error(error.message);
    }
  };


  const handleDeleteProject = async (projectId) => {
    try {
      const token = await getToken();
      await axios.delete(`${backendUrl}/api/educator/delete-project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Projet supprimé avec succès');
      fetchPendingProjects(); // Rafraîchir la liste après suppression
    } catch (error) {
      console.error('Delete project error:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression du projet');
    }
  };

  useEffect(() => {
    fetchPendingCertificates();
    fetchPendingProjects();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Certificats</h1>
      
      <h2 className="text-xl font-semibold mb-4">QCM en attente de validation</h2>
      {pendingCertificates.length > 0 ? (
        <table className="md:table-auto table-fixed w-full overflow-hidden border">
          <thead className="text-gray-900 border-b border-r-gray-500/20 text-sm text-left">
            <tr>
              <th className="px-4 py-3 font-semibold truncate">Étudiant</th>
              <th className="px-4 py-3 font-semibold truncate">Cours</th>
              <th className="px-4 py-3 font-semibold truncate">Date de validation</th>
              <th className="px-4 py-3 font-semibold truncate">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {pendingCertificates.map((cert, index) => (
              <tr key={index} className="border-b border-gray-500/20">
                <td className="px-4 py-3">{userData.name || userData.email}</td>
                <td className="px-4 py-3">{cert.courseTitle || 'Cours inconnu'}</td>
                <td className="px-4 py-3">{new Date(cert.completedAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <button
                    className="px-3 py-1.5 bg-green-600 text-white rounded-sm"
                    onClick={() => validateCertificate(cert.quizResultId)}
                  >
                    Valider
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">Aucun QCM en attente de validation.</p>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-4">Projets en attente de validation</h2>
      {pendingProjects.length > 0 ? (
        <table className="md:table-auto table-fixed w-full overflow-hidden border">
          <thead className="text-gray-900 border-b border-r-gray-500/20 text-sm text-left">
            <tr>
              <th className="px-4 py-3 font-semibold truncate">Étudiant</th>
              <th className="px-4 py-3 font-semibold truncate">Cours</th>
              <th className="px-4 py-3 font-semibold truncate">Type de soumission</th>
              <th className="px-4 py-3 font-semibold truncate">Date de soumission</th>
              <th className="px-4 py-3 font-semibold truncate">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {pendingProjects.map((project, index) => (
              <tr key={index} className="border-b border-gray-500/20">
                <td className="px-4 py-3">{userData.name || userData.email}</td>
                <td className="px-4 py-3">{project.courseTitle || 'Cours inconnu'}</td>
                <td className="px-4 py-3">{project.submissionType === 'file' ? 'Fichier' : 'Lien'}</td>
                <td className="px-4 py-3">{new Date(project.submittedAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                <button
                  className="px-3 mx-5 py-1.5 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition ml-2"
                  onClick={() => {
                    setSelectedProject(project);
                    setIsProjectModalOpen(true);
                  }}
                >
                  Voir le projet
                </button>
                  {
                    project.isValidatedByEducator && (
                      <button
                        className="px-3 mx-5 py-1.5 bg-red-600 text-white rounded-sm hover:bg-red-700 transition"
                        onClick={() => handleDeleteProject(project.projectId)}
                      >
                        Supprimer
                      </button>
                    )
                  }
                  {!project.isValidatedByEducator && (
                    <button
                      className="px-3 py-1.5 bg-green-600 text-white rounded-sm"
                      onClick={() => validateProject(project.projectId)}
                    >
                      Valider
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">Aucun projet en attente de validation.</p>
      )}

      <Modal
        isOpen={!!selectedProject}
        onRequestClose={() => setSelectedProject(null)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '500px',
            width: '90%',
            padding: '20px',
            overflow: 'auto',
            background: '#fff'
          }
        }}
      >
        {selectedProject && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Détails du projet</h2>
            <p><strong>Étudiant :</strong> {userData.name}</p>
            <p><strong>Cours :</strong> {selectedProject.courseTitle}</p>
            <p><strong>Soumis le :</strong> {new Date(selectedProject.submittedAt).toLocaleDateString('fr-FR')}</p>
            <p><strong>Projet :</strong></p>
            {selectedProject.submissionType === 'file' ? (
              <p className="mt-2">
                <a
                  href={`${backendUrl}${selectedProject.submission}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Télécharger le fichier
                </a>
              </p>
            ) : (
              <p className="mt-2">
                <a
                  href={selectedProject.submission}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Voir le lien
                </a>
              </p>
            )}
            <div className="mt-4 flex justify-center space-x-4">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition"
                onClick={() => setSelectedProject(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EducatorCertificates;