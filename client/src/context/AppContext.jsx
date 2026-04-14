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

    const facilityIcons = {
        "Free WiFi": assets.freeWifiIcon,
        "Free Breakfast": assets.freeBreakfastIcon,
        "Room Service": assets.roomServiceIcon,
        "Mountain View": assets.mountainIcon,
        "Pool Access": assets.poolIcon,
    };

    const checkOwnerStatus = useCallback(async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/bookings/hotel', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[AppContext] checkOwnerStatus response', data);

            return Boolean(data?.success);
        } catch (error) {
            console.log('[AppContext] checkOwnerStatus error', error?.response?.data || error.message);
            return false;
        }
    }, [getToken]);

    const refreshOwnerStatus = useCallback(async () => {
        try {
            setIsOwnerLoading(true);
            const token = await getToken();
            const { data } = await axios.get('/api/user', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('[AppContext] refreshOwnerStatus /api/user', data);

            let ownerStatus = data?.role === 'hotelOwner';

            if (!ownerStatus) {
                ownerStatus = await checkOwnerStatus();
            }

            setIsOwner(ownerStatus);
            setSearchedCities(data?.recentSearchedCities || []);

            console.log('[AppContext] refreshOwnerStatus final', { ownerStatus });

            return ownerStatus;
        } catch (error) {
            console.log('[AppContext] refreshOwnerStatus error', error?.response?.data || error.message);
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
                let ownerStatus = data.role === "hotelOwner";

                if (!ownerStatus) {
                    ownerStatus = await checkOwnerStatus();
                }

                setIsOwner(ownerStatus);
                setSearchedCities(data.recentSearchedCities || [])
                console.log('[AppContext] fetchUser resolved', {
                    clerkUserId: user?.id,
                    apiRole: data.role,
                    ownerStatus,
                    recentSearchedCities: data.recentSearchedCities || []
                });
            } else {
                // Retry Fetching User Details after 5 seconds
                // Useful when user creates account using email & password
                setTimeout(() => {
                    fetchUser();
                }, 2000);
            }
        } catch (error) {
            console.log('[AppContext] fetchUser error', error?.response?.data || error.message);
            toast.error(error.message)
        } finally {
            setIsOwnerLoading(false);
        }
    }, [checkOwnerStatus, getToken, user])

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
        fetchUser // Expose fetchUser for use in components
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );

};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);