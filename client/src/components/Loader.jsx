import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Loader = () => {
  const { navigate, axios, getToken } = useAppContext();

  const { nextUrl } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyAndRedirect = async () => {
      if (!nextUrl) return;

      const sessionId = searchParams.get('session_id');

      if (sessionId) {
        try {
          const { data } = await axios.get(`/api/bookings/verify-stripe-payment?sessionId=${encodeURIComponent(sessionId)}`, {
            headers: { Authorization: `Bearer ${await getToken()}` }
          });

          if (!data.success) {
            toast.error(data.message || 'Payment verification failed');
          }
        } catch (error) {
          toast.error(error.message);
        }
      }

      navigate(`/${nextUrl}`);
    };

    verifyAndRedirect();
  }, [axios, getToken, navigate, nextUrl, searchParams]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-24 w-24 border-4 border-gray-300 border-t-primary"></div>
    </div>
  );
};

export default Loader;