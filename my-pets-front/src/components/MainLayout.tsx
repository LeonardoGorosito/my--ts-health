import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-matte transition-colors duration-300">
      <Navbar />
      
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}