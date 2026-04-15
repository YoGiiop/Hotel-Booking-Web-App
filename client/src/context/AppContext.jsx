import { useAuth, useUser } from "@clerk/clerk-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from 'react-hot-toast'
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY || "$";
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth()

    const [isOwner, setIsOwner] = useState(false);
    const [isOwnerLoading, setIsOwnerLoading] = useState(true);
    const [showHotelReg, setShowHotelReg] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [searchedCities, setSearchedCities] = useState([]); // max 3 recent searched cities
    const [ownerDashboardRefreshKey, setOwnerDashboardRefreshKey] = useState(0);

    const facilityIcons = {
        "Free WiFi": assets.freeWifiIcon,
        "Free Breakfast": assets.freeBreakfastIcon,
        "Room Service": assets.roomServiceIcon,
        "Mountain View": assets.mountainIcon,
        "Pool Access": assets.poolIcon,
    };

    const checkOwnerFromHotels = useCallback(async () => {
        try {
            if (!user?.id) return false;

            const token = await getToken();
            const { data } = await axios.get('/api/hotels', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ownerStatus = Boolean(data?.hotels?.some((hotel) => hotel.owner === user.id));

            return ownerStatus;
        } catch {
            return false;
        }
    }, [getToken, user]);

    const checkOwnerStatus = useCallback(async () => {
        try {
            const ownerFromHotels = await checkOwnerFromHotels();
            if (ownerFromHotels) {
                return true;
            }

            const token = await getToken();
            const { data } = await axios.get('/api/bookings/hotel', {
                headers: { Authorization: `Bearer ${token}` }
            });

            return Boolean(data?.success);
        } catch {
            return false;
        }
    }, [checkOwnerFromHotels, getToken]);

    const refreshOwnerStatus = useCallback(async () => {
        try {
            setIsOwnerLoading(true);
            const token = await getToken();
            const { data } = await axios.get('/api/user', {
                headers: { Authorization: `Bearer ${token}` }
            });

            let ownerStatus = typeof data?.isOwner === 'boolean'
                ? data.isOwner
                : Boolean(data?.ownedHotelsCount > 0);

            if (!ownerStatus) {
                ownerStatus = await checkOwnerStatus();
            }

            setIsOwner(ownerStatus);
            setSearchedCities(data?.recentSearchedCities || []);

            return ownerStatus;
        } catch {
            setIsOwner(false);
            return false;
        } finally {
            setIsOwnerLoading(false);
        }
    }, [checkOwnerStatus, getToken]);

    const fetchUser = useCallback(async () => {
        try {
            setIsOwnerLoading(true);
            const { data } = await axios.get('/api/user', { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                let ownerStatus = typeof data?.isOwner === 'boolean'
                    ? data.isOwner
                    : Boolean(data?.ownedHotelsCount > 0);

                if (!ownerStatus) {
                    ownerStatus = await checkOwnerStatus();
                }

                setIsOwner(ownerStatus);
                setSearchedCities(data.recentSearchedCities || [])
            } else {
                // Retry Fetching User Details after 5 seconds
                // Useful when user creates account using email & password
                setTimeout(() => {
                    fetchUser();
                }, 2000);
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsOwnerLoading(false);
        }
    }, [checkOwnerStatus, getToken])

    const fetchRooms = async () => {
        try {
            const { data } = await axios.get('/api/rooms')
            if (data.success) {
                setRooms(data.rooms)
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const refreshOwnerDashboard = useCallback(() => {
        setOwnerDashboardRefreshKey((prev) => prev + 1)
    }, [])

    useEffect(() => {
        if (!isLoaded) return;

        if (user) {
            fetchUser();
        } else {
            setIsOwner(false);
            setSearchedCities([]);
            setIsOwnerLoading(false);
        }
    }, [user, isLoaded, fetchUser]);

    useEffect(() => {
        fetchRooms();
    }, []);

    const value = {
        currency, navigate,
        user, getToken,
        isOwner, setIsOwner,
        isOwnerLoading,
        refreshOwnerStatus,
        axios,
        showHotelReg, setShowHotelReg,
        facilityIcons,
        rooms, setRooms,
        searchedCities, setSearchedCities,
        fetchUser,
        fetchRooms,
        ownerDashboardRefreshKey,
        refreshOwnerDashboard
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );

};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);