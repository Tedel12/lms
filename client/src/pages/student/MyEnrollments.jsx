import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Line } from 'rc-progress';
import Footer from '../../components/student/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import {FaCheckCircle} from 'react-icons/fa'

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
  const [validatedCourses, setValidatedCourses] = useState([])

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          // Progression du cours
          const { data: progressData } = await axios.post(
            backendUrl + '/api/user/get-course-progress',
            { courseId: course._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          let totalLectures = calculateNoOfLectures(course);
          const lectureCompleted = progressData.progressData ? progressData.progressData.lectureCompleted.length : 0;
  
          // Vérifier si le QCM est validé
          const { data: quizResult } = await axios.post(
            backendUrl + '/api/quiz/result',
            { courseId: course._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          return {
            totalLectures,
            lectureCompleted,
            hasPassedQuiz: quizResult.hasPassed,
            score: quizResult.score
          };
        })
      );
  
      setProgressArray(tempProgressArray);
      // Mettre à jour validatedCourses
      const validated = tempProgressArray
        .map((progress, index) => (progress.hasPassedQuiz && progress.score === 100 ? enrolledCourses[index]._id : null))
        .filter(Boolean);
      setValidatedCourses(validated);
      // console.log('Validated courses:', validated);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchQuiz = async (courseId) => {
    try {
      const token = await getToken();
      console.log('Fetching quiz for courseId:', courseId); // Log courseId
      console.log('Token:', token ? token : 'Token absent'); // Log token
      const { data } = await axios.post(
        backendUrl + '/api/quiz/get-quiz',
        { courseId },
        { headers: { Authorization: ` Bearer ${token}` } }
      );
      console.log('Quiz response:', data); // Log réponse
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
      console.log('Submitting answers:', { courseId: selectedCourseId, answers }); // Log payload
      const token = await getToken();
      console.log('Token:', token ? token : 'Token absent'); // Log token
      const { data } = await axios.post(
        backendUrl + '/api/quiz/submit',
        { courseId: selectedCourseId, answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Submit response:', data); // Log réponse
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
      }); // Log quizResult
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
    if (enrolledCourses.length > 0) {
      getCourseProgress();
    }
  }, [enrolledCourses]);

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
              <th className="px-4 py-3 font-semibold truncate">Statut</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {enrolledCourses.map((course, index) => (
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
                <td className="px-4 py-3 max-sm:hidden">
                  {progressArray[index] &&` ${progressArray[index].lectureCompleted} / ${progressArray[index].totalLectures}`}{' '}
                  <span>Lectures</span>
                </td>
                <td className="px-4 py-3 mx-9 max-sm:text-right">
                  {progressArray[index] && progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 ? (
                    progressArray[index].hasPassedQuiz && progressArray[index].score === 100 ? (
                      <span className="flex items-center text-green-600 font-medium">
                        <FaCheckCircle className="mr-1" />
                        Validé
                      </span>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <button
                          className="px-3 sm:px-5 py-1.5 sm:py-2 bg-green-600 max-sm:text-xs text-white rounded-sm"
                          onClick={() => {
                            setSelectedCourseId(course._id);
                            fetchQuiz(course._id);
                          }}
                        >
                          QCMs
                        </button>
                        <button
                          className="px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 max-sm:text-xs text-white rounded-sm"
                          onClick={() => navigate('/player/' + course._id)}
                        >
                          Terminé
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          },
        }}
      >
        {quiz ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">QCM</h2>
            {quiz.questions.map((question, index) => (
              <div key={index} className="mb-4">
                <p className="font-medium">{question.questionText}</p>
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="block">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={optionIndex}
                      onChange={() => handleAnswerChange(index, optionIndex)}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
            ))}
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-sm"
              onClick={submitQuiz}
              disabled={answers.length !== quiz?.questions.length}
            >
              Soumettre
            </button>
          </div>
        ) : (
          <p>Chargement...</p>
        )}
      </Modal>

      {/* Modale pour le résultat */}
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
            backgroundColor: '#fff', // Fond blanc pour visibilité
            color: '#000', // Texte noir pour contraste
          },
        }}
      >
        <div>
          <h2 className="text-xl font-semibold mb-4">Résultat du QCM</h2>
          {quizResult ? (
            <>
              <p className="mb-2">Score : {quizResult.score}%</p>
              <p className="mb-2">{quizResult.message}</p>
              {quizResult.correctAnswers !== undefined && quizResult.totalQuestions !== undefined && (
                <p>Réponses correctes : {quizResult.correctAnswers} / {quizResult.totalQuestions}</p>
              )}
            </>
          ) : (
            <p>Aucun résultat disponible.</p>
          )}
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-sm mt-4"
            onClick={() => {
              setIsResultModalOpen(false);
              setQuizResult(null);
              setScore(null);
            }}
          >
            Fermer
          </button>
        </div>
      </Modal>

      <Footer />
    </>
  );
};

export default MyEnrollments;