import Footer from "@/components/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gradient-to-t from-gray-200 to-gray-100">
      <div className="flex justify-between items-center py-6 px-32">
        <div className="text-3xl font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 64 64">
            <linearGradient id="_FiRJlAbfoITU_oowsL5xa_6aZUcUt6WjzU_gr1" x1="32" x2="32" y1="4.447" y2="59.37" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#1a6dff"></stop><stop offset="1" stop-color="#c822ff"></stop></linearGradient><path fill="url(#_FiRJlAbfoITU_oowsL5xa_6aZUcUt6WjzU_gr1)" d="M59.707,31.283L32.733,4.31c-0.391-0.391-1.023-0.391-1.414,0	c-0.129,0.129-0.241,0.269-0.364,0.402L13.464,22.112l-9.171,9.171c-0.391,0.391-0.391,1.023,0,1.414l8.116,8.116L24.72,53.124	l6.566,6.566c0.195,0.195,0.451,0.293,0.707,0.293s0.512-0.098,0.707-0.293l27.007-26.993C59.895,32.51,60,32.256,60,31.99	C60,31.726,59.895,31.471,59.707,31.283z M13.823,39.399L6.414,31.99l21.235-21.16c-0.268,1.087-0.421,2.21-0.421,3.359	c0,3.383,1.205,6.574,3.394,9.109l-7.986,7.986c-0.391,0.391-0.391,1.023,0,1.414l4.124,4.124c0.001,0.001,0.001,0.002,0.002,0.003	l4.524,4.523c4.429,4.429,4.655,11.494,0.678,16.192l-5.83-5.83L13.823,39.399z M32,39.233l-1.293-1.293c0,0,0-0.001-0.001-0.001	l-5.949-5.949L32,24.747l7.243,7.243L32,39.233z M36.363,53.202c0.273-1.097,0.429-2.231,0.429-3.391	c0-3.392-1.212-6.592-3.413-9.129l7.985-7.985c0.391-0.391,0.391-1.023,0-1.414l-8.631-8.631c-2.261-2.261-3.506-5.267-3.506-8.464	c0-2.862,0.997-5.57,2.828-7.729l25.53,25.53L36.363,53.202z"></path><linearGradient id="_FiRJlAbfoITU_oowsL5xb_6aZUcUt6WjzU_gr2" x1="42.994" x2="42.994" y1="11.085" y2="42.374" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6dc7ff"></stop><stop offset="1" stop-color="#e6abff"></stop></linearGradient><path fill="url(#_FiRJlAbfoITU_oowsL5xb_6aZUcUt6WjzU_gr2)" d="M44.899,31.99l-8.86,8.861c1.46,2.144,2.366,4.601,2.649,7.198l16.068-16.06L32.353,9.585	c-1.952,3.757-1.354,8.505,1.795,11.653L44.899,31.99z"></path><linearGradient id="_FiRJlAbfoITU_oowsL5xc_6aZUcUt6WjzU_gr3" x1="20.994" x2="20.994" y1="14.149" y2="50.112" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6dc7ff"></stop><stop offset="1" stop-color="#e6abff"></stop></linearGradient><path fill="url(#_FiRJlAbfoITU_oowsL5xc_6aZUcUt6WjzU_gr3)" d="M19.089,31.644l8.86-8.861c-1.46-2.144-2.366-4.601-2.649-7.198L9.232,31.645l22.404,22.404	c1.952-3.757,1.354-8.505-1.795-11.653L19.089,31.644z"></path>
          </svg>
        </div>
        <div>
          <Link href="/login"><button className="bg-blue-700 px-3 py-2 rounded-xl text-white">Get Started</button></Link>
        </div>
      </div>
      <div className="flex justify-center items-center p-32">
        <div className="text-center">
          <h1 className="text-8xl font-black mb-10">Track, Prioritize, and Fix Bugs Effortlessly</h1>
          <p className="text-2xl">Stay on top of your software issues with real-time tracking, seamless collaboration, and powerful reporting. Ship better software faster.</p>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
