import React from 'react'
import { assets, dummyTestimonial } from '../../assets/assets'

const TestimonialsSection = () => {
  return (
    <div className='pb-14 px-8 md:px-8'>
      <h2 className='text-3xl font-semibold text-gray-800'>Ce qu'on dit de nous ?</h2>
      <p className='md:text-base'>Ecoutez nos apprenants qui partagent leurs parcours de transformation et comment notre <br />plateforme a fait une différence dans leur vie.</p>
      <div className='grid grid-cols-auto gap-8 mt-14'>
        {dummyTestimonial.map((testimonial, index)=>(
          <div key={index} className='text-sm text-left border border-gray-500/30 pb-6 rounded-lg bg-white shadow-[0px_3px_5px_0px] shadow-black/50 overflow-hidden'>
            <div className='flex items-center gap-4 px-5 py-4 bg-gray-500/10'>
              <img className='h-12 w-12 rounded-full' src={testimonial.image} alt={testimonial.name}/>
              <div>
                <h1 className='text-lg font-medium text-gray-800'>{testimonial.name}</h1>
                <p className='text-gray-800/80'>{testimonial.role}</p>
              </div>
              
            </div>
            <div className='p-5 pb-7'>
                <div className='flex gap-0.5'>
                  {[...Array(5)].map((_, i)=>(
                    <img className='h-5' key={i} src={i < Math.floor(testimonial.rating) ? assets.star : assets.star_blank} alt="star" />
                  ))}
                </div>
                <p className='text-gray-500 mt-5'>{testimonial.feedback}</p>
              </div>
              <a href="#" className='text-blue-500 underline px-5'>En savoir plus</a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsSection