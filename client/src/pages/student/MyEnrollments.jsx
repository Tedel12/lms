import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Line } from 'rc-progress';
import Footer from '../../components/student/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { FaCheckCircle } from 'react-icons/fa';
import { assets } from '../../assets/assets';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Loading from '../../components/student/Loading';

// Lier la modale à l’app pour l’accessibilité
Modal.setAppElement('#root');

const MyEnrollments = () => {
  const { enrolledCourses, navigate, calculateCourseDuration, userData, fetchUserEnrolledCourses, backendUrl, getToken, calculateNoOfLectures } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [score, setScore] = useState(null);
  const [validatedCourses, setValidatedCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const certificateRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [submissionForm, setSubmissionForm] = useState({ courseId: null, submissionType: 'link', link: '', file: null }); // Ajout pour gérer la soumission

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          const { data: progressData } = await axios.post(
            backendUrl + '/api/user/get-course-progress',
            { courseId: course._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          let totalLectures = calculateNoOfLectures(course);
          const lectureCompleted = progressData.progressData ? progressData.progressData.lectureCompleted.length : 0;

          const { data: quizResult } = await axios.post(
            backendUrl + '/api/quiz/result',
            { courseId: course._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          return {
            totalLectures,
            lectureCompleted,
            hasPassedQuiz: quizResult.hasPassed,
            score: quizResult.score,
            completedAt: quizResult.completedAt,
            isValidatedByEducator: quizResult.isValidatedByEducator,
          };
        })
      );

      setProgressArray(tempProgressArray);
      const validated = tempProgressArray
        .map((progress, index) => (progress.hasPassedQuiz && progress.score === 100 ? enrolledCourses[index]._id : null))
        .filter(Boolean);
      setValidatedCourses(validated);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchCertificates = async () => {
    try {
      const token = await getToken();
      const certs = await Promise.all(
        enrolledCourses.map(async (course, index) => {
          const quizResult = await axios.post(
            `${backendUrl}/api/quiz/result`,
            { courseId: course._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          const project = projects.find(p => p.courseId === course._id)

          const projectValidated = project && project.isValidatedByEducator; // Vérification historique
  
          if (
            progressArray[index] &&
            progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 &&
            progressArray[index].hasPassedQuiz &&
            progressArray[index].score === 100 &&
            progressArray[index].isValidatedByEducator &&
            project &&
            projectValidated
          ) {
            const studentName =` ${userData.name}`;
            const { data: certData } = await axios.post(
              `${backendUrl}/api/certificate/generate`,
              {
                courseId: course._id,
                courseTitle: course.courseTitle,
                studentName,
                completedAt: progressArray[index].completedAt
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
  
            return {
              courseId: course._id,
              courseTitle: course.courseTitle,
              completedAt: progressArray[index].completedAt,
              certificateNumber: certData.certificateNumber || `${course._id}`,
              certificateId: certData.certificateId
            };
          }
          return null;
        })
      );
      setCertificates(certs.filter(Boolean));
      console.log('Certificates:', certs.filter(Boolean));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('project feted:', data);
      
      setProjects(data);
    } catch (error) {
      console.error('Fetch projects error:', error);
      toast.error('Erreur lors de la récupération des projets');
    }
  };

  const handleProjectSubmission = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('courseId', submissionForm.courseId);
      if (submissionForm.submissionType === 'file' && submissionForm.file) {
        formData.append('file', submissionForm.file);
      } else if (submissionForm.submissionType === 'link') {
        formData.append('link', submissionForm.link);
      }

      await axios.post(`${backendUrl}/api/user/project/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Projet soumis avec succès');
      setSubmissionForm({ courseId: null, submissionType: 'link', link: '', file: null });
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    }
  };

  const fetchQuiz = async (courseId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + '/api/quiz/get-quiz',
        { courseId },
        { headers: { Authorization: ` Bearer ${token}` } }
      );
      if (data.error === 'QCM non trouvé') {
        toast.info('Aucun QCM disponible pour ce cours.');
        return;
      }
      setQuiz(data);
      setAnswers([]);
      setIsQuizModalOpen(true);
    } catch (error) {
      console.error('Error fetching quiz:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      toast.error(error.response?.data?.error || 'Erreur lors du chargement du QCM');
    }
  };

  const handleAnswerChange = (questionIndex, selectedOption) => {
    setAnswers((prev) => [
      ...prev.filter((a) => a.questionIndex !== questionIndex),
      { questionIndex, selectedOption },
    ]);
  };

  const submitQuiz = async () => {
    try {
      console.log('Submitting answers:', { courseId: selectedCourseId, answers });
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + '/api/quiz/submit',
        { courseId: selectedCourseId, answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Submit response:', data);
      setScore(data.score);
      setQuizResult({
        score: data.score,
        message: data.message || `Votre score est de ${data.score}%`,
        correctAnswers: data.correctAnswers || 0,
        totalQuestions: data.totalQuestions || 0
      });
      console.log('Setting quizResult:', {
        score: data.score,
        message: data.message,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions
      });
      setIsResultModalOpen(true);
      setIsQuizModalOpen(false);
    } catch (error) {
      console.error('Error submitting quiz:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      toast.error(error.response?.data?.error || 'Erreur lors de la soumission du QCM');
    }
  };

  useEffect(() => {
    if (userData) {
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    getCourseProgress();
    fetchProjects();
  }, [enrolledCourses]); // Ajout de la dépendance pour recharger les projets si les cours changent

  useEffect(() => {
    if (enrolledCourses.length > 0 && progressArray.length > 0) {
      fetchCertificates();
    }
  }, [enrolledCourses, progressArray, projects]);

  const Certificate = ({ studentName, courseTitle, completedAt, certificateNumber, onRender }) => {
    return (
      <div
        ref={onRender}
        className="w-[800px] h-[600px] border-4 border-purple-600 bg-gradient-to-br from-blue-100 via-green-100 to-purple-100 p-8 flex flex-col justify-between"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">Certificat de Réussite</h1>
          <p className="text-lg text-green-700">Délivré par Ulearning</p>
        </div>
        <div className="text-center flex-1 flex flex-col justify-center">
          <p className="text-xl text-blue-600 mb-2">Ce certificat est décerné à</p>
          <h2 className="text-3xl font-semibold text-purple-700 mb-4">{studentName || userData.email}</h2>
          <p className="text-lg text-blue-600 mb-2">pour avoir complété avec succès le cours</p>
          <h3 className="text-2xl font-medium text-green-600 mb-4">{courseTitle}</h3>
          <p className="text-lg text-blue-600">Date de validation : {new Date(completedAt).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600">Numéro du certificat : <span className="font-medium">{certificateNumber || 'N/A'}</span></p>
            <p className="text-sm text-blue-600">Signé par : Ben Ephraïm AGBANNON</p>
          </div>
          <img src={assets.logo} alt="Logo" className="w-30 h-17" />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="md:px-36 px-8 pt-10">
        <h1 className="text-2xl font-semibold">Mes inscriptions</h1>
        <table className="md:table-auto table-fixed w-full overflow-hidden border mt-10">
          <thead className="text-gray-900 border-b border-r-gray-500/20 text-sm text-left max-sm:hidden">
            <tr>
              <th className="px-4 py-3 font-semibold truncate">Cours</th>
              <th className="px-4 py-3 font-semibold truncate">Durée</th>
              <th className="px-4 py-3 font-semibold truncate">Complété</th>
              <th className="px-4 py-3 font-semibold truncate">Projet</th> {/* Nouvelle colonne */}
              <th className="px-4 py-3 font-semibold truncate">Statut</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {enrolledCourses.map((course, index) => {
              const project = projects.find(p => p.courseId === course._id);
              const canSubmitProject = progressArray[index] && 
                progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 && 
                progressArray[index].hasPassedQuiz && 
                progressArray[index].score === 100 && 
                progressArray[index].isValidatedByEducator && 
                !project; // Condition pour soumettre un projet

              const projectStatus = project ? (project.isValidatedByEducator ? 'Validé' : 'En attente de validation') : 'Non soumis';

              return (
                <tr key={index} className="border-b border-gray-500/20">
                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3">
                    <img src={course.courseThumbnail} alt="thumbnail" className="w-14 sm:w-24 md:w-28" />
                    <div className="flex-1">
                      <p className="mb-1 max-sm:text-sm">{course.courseTitle}</p>
                      <Line
                        strokeWidth={2}
                        percent={
                          progressArray[index]
                            ? (progressArray[index].lectureCompleted * 100) / progressArray[index].totalLectures
                            : 0
                        }
                        className="bg-gray-300 rounded-full"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-sm:hidden">{calculateCourseDuration(course)}</td>
                  <td className="px-4 py-3 mx-9 max-sm:text-right">
                    {progressArray[index] && progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 ? (
                      progressArray[index].hasPassedQuiz && progressArray[index].score === 100 ? (
                        progressArray[index].isValidatedByEducator ? (
                          project && project.isValidatedByEducator ? (
                            <span className="flex items-center text-green-600 font-medium">
                              <FaCheckCircle className="mr-1" />
                              Validé
                            </span>
                          ) : (
                            <span className="text-yellow-600 font-medium">
                              Projet requis
                            </span>
                          )
                        ) : (
                          <span className="text-yellow-600 font-medium">
                            En attente de validation (QCM)
                          </span>
                        )
                      ) : (
                        <div className="flex items-center space-x-3">
                          <button
                            className="px-3 sm:px-5 py-1.5 sm:py-2 bg-green-600 max-sm:text-xs text-white rounded-sm"
                            onClick={() => {
                              console.log('Course ID clicked:', course._id);
                              setSelectedCourseId(course._id);
                              fetchQuiz(course._id);
                            }}
                          >
                            QCM
                          </button>
                        </div>
                      )
                    ) : (
                      <button
                        className="px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 max-sm:text-xs text-white rounded-sm"
                        onClick={() => navigate('/player/' + course._id)}
                      >
                        En cours
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canSubmitProject ? (
                      <button
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-sm"
                        onClick={() => setSubmissionForm({ courseId: course._id, submissionType: 'link', link: '', file: null })}
                      >
                        Projet
                      </button>
                    ) : (
                      projectStatus
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {progressArray[index] && progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 ? (
                      progressArray[index].hasPassedQuiz && progressArray[index].score === 100 ? (
                        progressArray[index].isValidatedByEducator ? (
                          project && project.isValidatedByEducator ? (
                            <span className="flex items-center text-green-600 font-medium">
                              <FaCheckCircle className="mr-1" />
                              Certificat délivré
                            </span>
                          ) : (
                            <span className="text-yellow-600 font-medium">
                              En attente (Projet)
                            </span>
                          )
                        ) : (
                          <span className="text-yellow-600 font-medium">
                            En attente (QCM)
                          </span>
                        )
                      ) : (
                        <span className="text-red-600 font-medium">
                          QCM non validé
                        </span>
                      )
                    ) : (
                      <span className="text-red-600 font-medium">
                        Cours non terminé
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Formulaire de soumission de projet */}
        {submissionForm.courseId && (
          <Modal
            isOpen={!!submissionForm.courseId}
            onRequestClose={() => setSubmissionForm({ courseId: null, submissionType: 'link', link: '', file: null })}
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
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Soumettre votre projet</h2>
              <form onSubmit={handleProjectSubmission}>
                <div className="mb-4">
                  <label className="block text-left mb-2">Type de soumission :</label>
                  <select
                    className="w-full p-2 border rounded-sm"
                    value={submissionForm.submissionType}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, submissionType: e.target.value, link: '', file: null })}
                  >
                    <option value="link">Lien (GitHub, site)</option>
                    <option value="file">Fichier (PDF, ZIP)</option>
                  </select>
                </div>
                {submissionForm.submissionType === 'link' ? (
                  <div className="mb-4">
                    <label className="block text-left mb-2">Lien :</label>
                    <input
                      type="url"
                      className="w-full p-2 border rounded-sm"
                      placeholder="https://github.com/..."
                      value={submissionForm.link}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, link: e.target.value })}
                      required
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-left mb-2">Fichier (PDF ou ZIP, max 10MB) :</label>
                    <input
                      type="file"
                      accept=".pdf,.zip"
                      className="w-full p-2 border rounded-sm"
                      onChange={(e) => setSubmissionForm({ ...submissionForm, file: e.target.files[0] })}
                      required
                    />
                  </div>
                )}
                <div className="flex justify-center space-x-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition"
                  >
                    Soumettre
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition"
                    onClick={() => setSubmissionForm({ courseId: null, submissionType: 'link', link: '', file: null })}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* Section Historique des certificats */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Historique des certificats</h2>
          {certificates.length > 0 ? (
            <table className="md:table-auto table-fixed w-full overflow-hidden border">
              <thead className="text-gray-900 border-b border-r-gray-500/20 text-sm text-left max-sm:hidden">
                <tr>
                  <th className="px-4 py-3 font-semibold truncate">Cours</th>
                  <th className="px-4 py-3 font-semibold truncate">Date de validation</th>
                  <th className="px-4 py-3 font-semibold truncate">Numéro du certificat</th>
                  <th className="px-4 py-3 font-semibold truncate">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {certificates.map((cert, index) => (
                  <tr key={index} className="border-b border-gray-500/20">
                    <td className="px-4 py-3">{cert.courseTitle}</td>
                    <td className="px-4 py-3">{new Date(cert.completedAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">{cert.certificateNumber}</td>
                    <td className="px-4 py-3">
                      <button
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-sm"
                        onClick={() => {
                          setSelectedCertificate(cert);
                          setIsCertificateModalOpen(true);
                        }}
                      >
                        Certificat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Vous n'avez encore aucun certificat pour le moment !</p>
          )}
        </div>

        {/* Modale pour le certificat */}
        <Modal
          isOpen={isCertificateModalOpen}
          onRequestClose={() => {
            setIsCertificateModalOpen(false);
            setSelectedCertificate(null);
          }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '900px',
              width: '90%',
              padding: '20px',
              overflow: 'auto',
              background: '#fff',
              maxHeight: '80vh',
            }
          }}
        >
          {selectedCertificate ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Votre certificat</h2>
              <Certificate
                studentName={`${userData.name?.name || userData.email}`}
                courseTitle={selectedCertificate.courseTitle}
                completedAt={selectedCertificate.completedAt}
                certificateNumber={selectedCertificate.certificateNumber}
                onRender={(ref) => (certificateRef.current = ref)}
              />
              <div className="mt-4 flex justify-center space-x-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition"
                  onClick={async () => {
                    const canvas = await html2canvas(certificateRef.current, { scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                      orientation: 'landscape',
                      unit: 'px',
                      format: [canvas.width, canvas.height]
                    });
                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                    pdf.save(`${selectedCertificate.courseTitle}-certificate.pdf`);
                  }}
                >
                  Télécharger
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 transition"
                  onClick={() => {
                    const shareLink = `${backendUrl}/api/certificate/view/${selectedCertificate.certificateId}`;
                    navigator.clipboard.writeText(shareLink).then(() => {
                      toast.success('Lien copié dans le presse-papiers !');
                    });
                  }}
                >
                  Copier le lien
                </button>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-sm hover:bg-purple-700 transition"
                  onClick={() => {
                    const shareText = `Je viens de valider le cours "${selectedCertificate.courseTitle}" sur Ulearning ! 🎉`;
                    const shareUrl = `${backendUrl}/api/certificate/view/${selectedCertificate.certificateId}`;
                    const linkedInUrl = ` https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
                    window.open(linkedInUrl, '_blank');
                  }}
                >
                  Partager sur LinkedIn
                </button>
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition"
                  onClick={() => {
                    setIsCertificateModalOpen(false);
                    setSelectedCertificate(null);
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <p>Chargement...</p>
          )}
        </Modal>

        {/* Modale pour le QCM */}
        <Modal
          isOpen={isQuizModalOpen}
          onRequestClose={() => setIsQuizModalOpen(false)}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '600px',
              width: '90%',
              padding: '20px',
              overflow: 'auto',
              background: '#fff'
            }
          }}
        >
          {quiz ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">QCM pour {enrolledCourses.find(c => c._id === selectedCourseId)?.courseTitle}</h2>
              {quiz.questions.map((question, qIndex) => (
                <div key={qIndex} className="mb-4">
                  <p className="font-medium mb-2">{qIndex + 1}. {question.questionText}</p>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center mb-1">
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={oIndex}
                        checked={answers.some(a => a.questionIndex === qIndex && a.selectedOption === oIndex)}
                        onChange={() => handleAnswerChange(qIndex, oIndex)}
                        className="mr-2"
                      />
                      <label>{option}</label>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex justify-center space-x-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition"
                  onClick={submitQuiz}
                >
                  Soumettre
                </button>
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition"
                  onClick={() => setIsQuizModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <p>Chargement...</p>
          )}
        </Modal>

        {/* Modale pour le résultat du QCM */}
        <Modal
          isOpen={isResultModalOpen}
          onRequestClose={() => setIsResultModalOpen(false)}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '400px',
              width: '90%',
              padding: '20px',
              overflow: 'auto',
              background: '#fff'
            }
          }}
        >
          {quizResult ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Résultat du QCM</h2>
              <p className="text-lg mb-2">{quizResult.message}</p>
              <p>Réponses correctes : {quizResult.correctAnswers} / {quizResult.totalQuestions}</p>
              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded-sm hover:bg-gray-700 transition"
                  onClick={() => setIsResultModalOpen(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <p>Chargement...</p>
          )}
        </Modal>
      </div>
      <Footer />
    </>
  );
};

export default MyEnrollments;   