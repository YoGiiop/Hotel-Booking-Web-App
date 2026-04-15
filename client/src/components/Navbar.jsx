import { useEffect, useRef, useState } from "react";
import { assets } from "../assets/assets";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useClerk, UserButton } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const BookIcon = () => (
    <svg className="w-4 h-4 text-gray-700" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" >
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13H7a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h12M9 3v14m7 0v4" />
    </svg>
);

const SearchButtonIcon = () => (
    <svg className="h-4 w-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
    </svg>
);

const Navbar = () => {

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Hotels', path: '/rooms' },
        { name: 'Experience', path: '/experience' },
        { name: 'About', path: '/about' },
    ];

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const searchFormRef = useRef(null);
    const searchInputRef = useRef(null);
    const location = useLocation();

    const { openSignIn } = useClerk()
    const { user, setShowHotelReg, isOwner, navigate, refreshOwnerStatus } = useAppContext()

    const handleOwnerClick = async () => {
        if (!user) return;

        const ownerStatus = isOwner ? true : await refreshOwnerStatus();

        if (ownerStatus) {
            navigate('/owner');
        } else {
            setShowHotelReg(true);
        }
    }

    const handleSearchSubmit = (event) => {
        event.preventDefault();

        const trimmedDestination = searchValue.trim();
        if (!trimmedDestination) return;

        navigate(`/rooms?destination=${encodeURIComponent(trimmedDestination)}`);
        setIsSearchOpen(false);
        setIsMenuOpen(false);
        scrollTo(0, 0);
    }

    useEffect(() => {
        if (location.pathname !== "/") {
            setIsScrolled(true);
            return;
        } else {
            setIsScrolled(false);
        }

        setIsScrolled(prev => location.pathname !== "/" ? true : prev);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    useEffect(() => {
        setIsSearchOpen(false);
        setSearchValue("");
    }, [location.pathname]);

    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!isSearchOpen) return;
            if (searchFormRef.current && !searchFormRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isSearchOpen]);

    return (
        <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 z-50 ${isScrolled ? "bg-white/80 shadow-md text-gray-700 backdrop-blur-lg py-3 md:py-4" : "py-4 md:py-6"}`}>
            <Link to="/">
                <img src={assets.logo} alt="logo" className={`h-9 ${isScrolled && "invert opacity-80"}`} />
            </Link>

            <div className="hidden md:flex items-center gap-4 lg:gap-8">
                {navLinks.map((navLink, index) => (
                    <NavLink key={index} to={navLink.path} className={`group flex flex-col gap-0.5 ${isScrolled ? "text-gray-700" : "text-white"}`} onClick={() => scrollTo(0, 0)}>
                        {navLink.name}
                        <div className={`${isScrolled ? "bg-gray-700" : "bg-white"} h-0.5 w-0 group-hover:w-full transition-all duration-300`} ></div>
                    </NavLink>
                ))}
                {
                    user && (
                        <button className={`border px-4 py-1 text-sm font-light rounded-full cursor-pointer ${isScrolled ? 'text-black' : 'text-white'} transition-all`} onClick={handleOwnerClick}>
                            {isOwner ? 'Dashboard' : 'List Your Hotel'}
                        </button>
                    )
                }
            </div>

            <div className="hidden md:flex items-center gap-4">
                <form
                    ref={searchFormRef}
                    onSubmit={handleSearchSubmit}
                    className={`flex items-center overflow-hidden rounded-full transition-all duration-500 ease-out ${isSearchOpen ? 'w-72 border border-gray-200 bg-white px-2.5 py-2 shadow-lg' : 'w-8 border border-transparent bg-transparent px-0 py-0 shadow-none'}`}
                >
                    <button
                        type="button"
                        onClick={() => setIsSearchOpen(true)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center cursor-pointer"
                    >
                        <img src={assets.searchIcon} alt="search" className={`${isScrolled && !isSearchOpen ? "invert" : ""} h-6 transition-all duration-500`} />
                    </button>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search destination"
                        className={`bg-transparent text-sm text-gray-700 outline-none transition-all duration-300 ${isSearchOpen ? 'ml-0.5 w-full opacity-100' : 'ml-0 w-0 opacity-0'}`}
                    />
                    <button
                        type="submit"
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-black cursor-pointer transition-all duration-300 ${isSearchOpen ? 'ml-1.5 opacity-100' : 'ml-0 w-0 overflow-hidden opacity-0'}`}
                    >
                        <SearchButtonIcon />
                    </button>
                </form>
                {user ? (
                    <UserButton >
                        <UserButton.MenuItems>
                            <UserButton.Action label="My Bookings" labelIcon={<BookIcon />} onClick={() => navigate('/my-bookings')} />
                        </UserButton.MenuItems>
                    </UserButton>
                ) : (
                    <button onClick={openSignIn} className="bg-black text-white px-8 py-2.5 rounded-full ml-4 transition-all duration-500 cursor-pointer">
                        Login
                    </button>
                )}
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center gap-3 md:hidden">
                <UserButton />
                <img onClick={() => setIsMenuOpen(!isMenuOpen)} src={assets.menuIcon} alt="" className={`${isScrolled && "invert"} h-4`} />
            </div>

            <div className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)} >
                    <img src={assets.closeMenu} alt="close-menu" className="h-6.5" />
                </button>

                {navLinks.map((navLink) => (
                    <NavLink key={navLink.name} to={navLink.path} onClick={() => setIsMenuOpen(false)}>
                        {navLink.name}
                    </NavLink>
                ))}

                <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xs items-center gap-2 rounded-full border border-gray-300 px-4 py-2">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search destination"
                        className="w-full text-sm outline-none"
                    />
                    <button type="submit" className="text-sm text-black cursor-pointer">
                        Search
                    </button>
                </form>

                {user && (
                    <>
                        <NavLink to="/my-bookings" onClick={() => setIsMenuOpen(false)}>
                            My Bookings
                        </NavLink>
                        <button className="border px-4 py-1 text-sm font-light rounded-full cursor-pointer transition-all" onClick={handleOwnerClick}>
                            {isOwner ? 'Dashboard' : 'List Your Hotel'}
                        </button>
                    </>
                )}

                {!user && (
                    <button onClick={openSignIn} className="bg-black text-white px-8 py-2.5 rounded-full ml-4 transition-all duration-500" >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;