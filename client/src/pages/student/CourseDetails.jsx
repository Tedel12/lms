import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/student/Footer'
import YouTube from 'react-youtube'
import axios from 'axios'
import { toast } from 'react-toastify'

const CourseDetails = () => {

  const {id} = useParams()

  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
  const [playerData, setPlayerData] = useState(null)

  const { allCourses, calculateRating, calculateNoOfLectures, calculateCourseDuration, 
    calculateChapterTime, currency, backendUrl, userData, getToken } = useContext(AppContext)

  const fetchCourseData = async () =>{
    try {
      const {data} = await axios.get(backendUrl + '/api/course/' + id)

      if (data.success) {
        setCourseData(data.courseData)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const enrollCourse = async () =>{
    try {
      if (!userData) {
        return toast.warn('Connectez-vous pour vous inscrire à un cours.')
      }
      if(isAlreadyEnrolled){
        return toast.warn('Vous êtes déjà inscrit à ce cours.')
      }

      const token = await getToken();

      const {data} = await axios.post(backendUrl + '/api/user/purchase', {courseId: courseData._id}, {headers: {Authorization: `Bearer ${token}`}})
      if (data.success) {
        toast.success(data.message)
        setIsAlreadyEnrolled(true)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    fetchCourseData()
  },[])


  useEffect(()=>{
    if (userData && courseData) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id))
    }
  },[userData, courseData])


  const toggleSection = (index) =>{
    setOpenSections((prev)=>(
      {...prev,
        [index]: !prev[index],
      }
    ));
  }


  return courseData ? (
    <>
      <div className='flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left mb-11'>

      <div className='absolute top-0 left-0 w-full h-section-height -z-1 bg-gradient-to-b from-cyan-100/70'>

      </div>

      {/* left column */}
      <div className='max-w-xl z-10 text-gray-500'>
        <h1 className='md:text-course-deatails-heading-large text-course-deatails-heading-small font-semibold text-gray-800'>{courseData.courseTitle}</h1>
        <p className='pt-4 md:text-base text-sm' dangerouslySetInnerHTML={{__html: courseData.courseDescription.slice(0, 600)}}></p>

        {/* review and ratings */}

        <div className='flex items-center space-x-2 pt-3 pb-3 text-sm'>
          <p>{calculateRating(courseData)}</p>
          <div className='flex'>
            {[...Array(5)].map((_, i)=>(
              <img key={i} src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank} alt="" className='w-3.5 h-3.5' />
            ))}
          </div>
          <p className='text-blue-600'>({courseData.courseRatings.length} {courseData.courseRatings.length > 1 ? 'notes' : 'note'}) </p>
          <p>{courseData.enrolledStudents.length} {courseData.enrolledStudents.length > 1 ? 'étudiants' :  'étudiant'}</p>
        </div>

        <p className='text-sm'>Présenté par <span className='text-blue-600 underline'>{courseData.educator?.name}</span></p>

        <div className="pt-8 text-gray-800">
          <h2 className='text-xl font-semibold'>Structure du cours</h2>

          <div className="pt-5">
            {courseData.courseContent.map((chapter, index)=>(
              <div key={index} className='border border-gray-300 bg-white mb-2 rounded'>
                <div className='flex items-center justify-between px-4 py-3 cursor-pointer select-none' onClick={()=>toggleSection(index)}>
                  <div className='flex items-center gap-2'>
                    <img className={`transform transition-transform ${openSections[index] ? 'rotate-180' :  ''}`} src={assets.down_arrow_icon} alt="arrow icon" />
                    <p className='font-semibold md:text-base text-sm'>{chapter.chapterTitle}</p>
                  </div>
                  <p className='text-sm md:text-default'>{chapter.chapterContent.length } {chapter.chapterContent.length === 1 ? 'lecture' : 'lectures' }  - {calculateChapterTime(chapter)}</p>
                </div>

                <div className={`overflow-hidden translate-all duration-300 ${openSections[index] ? 'max-h-96' : 'max-h-0'} `}>
                  <ul className='list-disc md:pl-10 pl-4 py-2 pr-4 text-gray-600 border-t border-gray-300'>
                    {chapter.chapterContent.map((lecture, i)=>(
                      <li className='flex items-start gap-2 py-1' key={i}>
                        <img className='w-4 h-4 mt-1' src={assets.play_icon} alt="" />
                        <div className='flex items-center justify-between w-full text-gray-800 text-xs md:text-default'>
                          <p>{lecture.lectureTitle}</p>
                          <div className='flex gap-2'>
                            {lecture.isPreviewFree && <p
                            onClick={()=>setPlayerData({
                              videoId: lecture.lectureUrl.split('/').pop()
                            })}
                            className='text-blue-500 cursor-pointer'>Aperçu</p> }
                            <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, {units: ["h", "m"]})}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            ))}
          </div>
        </div>
              
        <div className='py-20 text-sm md:text-default'>
          <h3 className='text-xl font-semibold text-gray-800'>Description du cours</h3>
          <p className='pt-3 rich-text' dangerouslySetInnerHTML={{__html: courseData.courseDescription}}></p>
        </div>

      </div>

      {/* right column*/}
      <div className='max-w-course-card z-10 shadow-custom-card rounded-t md:rounded-none overflow-hidden bg-white min-w-[300px] sm:min-w-[420px]'>
        {
          playerData ? <YouTube videoId={playerData.videoId} opts={{playerVars: {autoplay: 1}}} iframeClassName='w-full aspect-video' />
          :  <img style={{width : '100%'}} src={courseData.courseThumbnail} alt="thumbnail" />
        }
           
        <div className="p-5">
          
          {
            courseData.coursePrice !== 0 ? <div className='flex items-center gap-3'>
            <img className='w-3.5' src={assets.time_left_clock_icon} alt="time" />
            <p className='text-red-500'><span className='font-medium'>Encore</span> à ce prix</p>
          </div> : ''
          }

          <div className='flex gap-3 items-center pt-2'>
            <p className='text-gray-800 md:text-3xl text-2xl font-semibold'>{courseData.coursePrice === 0 ? 'Gratuit' : (courseData.coursePrice  - courseData.discount * courseData.coursePrice / 100).toFixed(2)} {courseData.coursePrice !== 0 ? currency : ''}</p>
            <p className='md:text-lg text-gray-500 line-through'>{courseData.coursePrice === 0 ? '': courseData.coursePrice} {courseData.coursePrice === 0 ? '' : currency}</p>
            <p className='md:text-lg text-gray-500'>{courseData.coursePrice === 0 ? '' : courseData.discount} {courseData.coursePrice !== 0 ? '% off' : ''} </p>
          </div>

            <div className='flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500'>
              <div className='flex items-center gap-2'>
                <img src={assets.star} alt="star" />
                <p>{calculateRating(courseData)}</p>
              </div>
              <div className='h-4 w-px bg-gray-500/40'></div>

              <div className='flex items-center gap-1'>
                <img src={assets.time_clock_icon} alt="time icon" />
                <p>{calculateCourseDuration(courseData)}</p>
              </div>

              <div className='h-4 w-px bg-gray-500/40'></div>

              <div className='flex items-center gap-1'>
                <img src={assets.lesson_icon} alt="time icon" />
                <p>{calculateNoOfLectures(courseData)} leçons</p>
              </div>

            </div>

            <button onClick={enrollCourse} className='md:mt-6 mt-4 w-full py-3 rounded bg-blue-600 text-white font-medium'>{isAlreadyEnrolled ? 'Déjà inscrit' : "S'inscrire"}</button>

            <div className='pt-6 text-gray-600'>
              <p className='md:text-xl text-lg font-medium text-gray-800'>Que contient le cours ?</p>
              <ul className='ml-4 pt-2 text-sm md:text-default list-disc'>
                <li>Accès à vie avec mises à jour gratuites.</li>
                <li>Guide pratique et étape par étape pour vos projets.</li>
                <li>Ressources et code source téléchargeables.</li>
                <li>Questions pour tester vos connaissances.</li>
                <li>Certificat de réussite.</li>
              </ul>
            </div>
        </div>
      </div>
      </div>
      <Footer/>
    </>
    
  ) : <Loading />
}

export default CourseDetails
