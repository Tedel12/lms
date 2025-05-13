import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';

const AddQuizForm = () => {
  const { backendUrl, getToken } = useContext(AppContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: 0 },
  ]);

  // Charger les cours de l’éducateur
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(backendUrl + '/api/course/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(data.courses || []);
      } catch (error) {
        toast.error('Erreur lors du chargement des cours');
      }
    };
    fetchCourses();
  }, [backendUrl, getToken]);

  const addQuestion = () => {
    if (questions.length >= 4) {
      toast.error('Maximum 4 questions');
      return;
    }
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'questionText' || field === 'correctAnswer') {
      newQuestions[index][field] = value;
    } else {
      newQuestions[index].options[field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error('Veuillez sélectionner un cours');
      return;
    }
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + '/api/quiz/create',
        { courseId: selectedCourseId, questions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message);
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]);
      setSelectedCourseId('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du QCM');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4">Ajouter un QCM</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block mb-2 font-medium">Sélectionner un cours</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full p-2 border rounded-sm"
            required
          >
            <option value="">Choisir un cours</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.courseTitle}
              </option>
            ))}
          </select>
        </div>
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="mb-6 border-b pb-4">
            <label className="block mb-2 font-medium">Question {qIndex + 1}</label>
            <input
              type="text"
              value={question.questionText}
              onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
              placeholder="Texte de la question"
              className="w-full p-2 border rounded-sm mb-2"
              required
            />
            {question.options.map((option, oIndex) => (
              <input
                key={oIndex}
                type="text"
                value={option}
                onChange={(e) => updateQuestion(qIndex, oIndex, e.target.value)}
                placeholder={`Option ${oIndex + 1}`}
                className="w-full p-2 border rounded-sm mb-2"
                required
              />
            ))}
            <label className="block mb-2">Bonne réponse</label>
            <select
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(qIndex, 'correctAnswer', Number(e.target.value))}
              className="w-full p-2 border rounded-sm"
            >
              {question.options.map((_, index) => (
                <option key={index} value={index}>
                  Option {index + 1}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="px-4 py-2 bg-gray-600 text-white rounded-sm mb-4"
          disabled={questions.length >= 4}
        >
          Ajouter une question
        </button>
        <div className="flex space-x-4">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-sm">
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuizForm;