import React from 'react'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <footer className='bg-gray-900 md:px-36 text-left w-full mt-10'>
      <div className='flex flex-col md:flex-row items-start px-8 md:px-0 justify-center gap-10 md:gap-32 py-10 border-b border-white/30'>
        <div className='flex flex-col md:items-start items-center w-full'>
          <img src={assets.logo_dark} alt="logo" />
          <p className='mt-6 text-center md:text-left text-sm text-white/80'>Ce site rend compte d'une expertise bien acquise, il est conçu pour servir à l'apprentisage et à l'application pour tout public désirant se former dans le domaines informaiques. Profitez donc des merveilles et faites vous votre propre avis !</p>
        </div>
        <div className='flex flex-col md:items-start items-center w-full'>
          <h2 className='font-semibold text-white mb-5'>Liens</h2>
          <ul className='flex md:flex-col w-full justify-between text-sm text-white/80 md:space-y-2'>
            <li><a href="#">Accueil</a></li>
            <li><a href="#">A propos de nous</a></li>
            <li><a href="#">Nous contacter</a></li>
            <li><a href="#">Politique de confidentialité</a></li>
          </ul>
        </div>
        <div className='hidden md:flex flex-col items-start w-full'>
          <h2 className='font-semibold text-white mb-5'>Abonnez-vous à notre newsletter</h2>
          <p className='text-sm text-white/80'>Les dernières nouvelles, articles et ressources, envoyés dans votre boîte de réception chaque semaine.</p>
          <div className='flex items-center gap-2 pt-4'>
            <input className='border border-gray-500/30 bg-gray-800 text-gray-500 placeholder-gray-500 outline-none w-64 h-9 rounded px-2 text-sm' type="email" placeholder='Entrer votre email' />
            <button className='bg-blue-600 w-24 h-9 text-white rounded'>S'abonner</button>
          </div>
        </div>
      </div>
      <p className='py-4 text-center text-xs md:text-sm text-white/60'>Copyright 2025 &copy; , <a className='font-semibold text-blue-500 underline' href="https://portfolio-liart-psi-68.vercel.app">Ben Code</a>. Tout droits réservés.</p>
    </footer>
  )
}

export default Footer
