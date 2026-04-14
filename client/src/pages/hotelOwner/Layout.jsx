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
        <div className='flex flex-col h-screen'>
            <Navbar />
            <div className='flex h-full'>
                <Sidebar />
                <div className='flex-1 p-4 pt-10 md:px-10 h-full'>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout