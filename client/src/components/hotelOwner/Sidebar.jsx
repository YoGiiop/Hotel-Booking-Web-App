import { assets } from '../../assets/assets';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {

    const sidebarLinks = [
        { name: "Dashboard", path: "/owner", icon: assets.dashboardIcon },
        { name: "Add Room", path: "/owner/add-room", icon: assets.addIcon },
        { name: "List Room", path: "/owner/list-room", icon: assets.listIcon },
    ];

    return (
        <div className="w-full border-b border-gray-300 bg-white md:h-full md:w-64 md:border-b-0 md:border-r md:pt-4">
            <div className="flex overflow-x-auto px-2 py-2 md:flex-col md:overflow-visible md:px-0 md:py-0">
            {sidebarLinks.map((item, index) => (
                <NavLink to={item.path} key={index} end='/owner' className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 md:rounded-none md:px-8 ${isActive ? "bg-blue-600/10 text-blue-600 md:border-r-[6px] md:border-blue-600" : "text-gray-700 hover:bg-gray-100/90"}`}>
                    <img className="min-h-6 min-w-6" src={item.icon} alt={item.name} />
                    <p className="text-center md:block">{item.name}</p>
                </NavLink>
            ))}
            </div>
        </div>
    );
}

export default Sidebar