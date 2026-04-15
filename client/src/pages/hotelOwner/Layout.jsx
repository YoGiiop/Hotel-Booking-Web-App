import { useEffect } from 'react'
import Navbar from '../../components/hotelOwner/Navbar'
import Sidebar from '../../components/hotelOwner/Sidebar'
import { Outlet } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {

    const { isOwner, isOwnerLoading, navigate, user } = useAppContext()

    useEffect(() => {
        if (!isOwnerLoading && (!user || !isOwner)) {
            navigate('/')
        }
    }, [isOwner, isOwnerLoading, navigate, user])

    if (isOwnerLoading) {
        return <div className='flex items-center justify-center h-screen'>Loading dashboard...</div>
    }

    return (
        <div className='flex min-h-screen flex-col bg-slate-50'>
            <Navbar />
            <div className='flex flex-1 flex-col md:flex-row'>
                <Sidebar />
                <div className='min-w-0 flex-1 overflow-y-auto p-4 pb-10 pt-6 md:px-10 md:pt-10'>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout