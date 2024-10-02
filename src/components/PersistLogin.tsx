import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";
import { RotatingLines } from "react-loader-spinner";

import useRefreshToken from "../hooks/useRefreshToken";

const PersistLogin = () => {
  const refresh = useRefreshToken();
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, setCurrentUser } = useAuth();

  useEffect(() => {
    const handleLogin = async () => {
      try {
        // Attempt to fetch user data using access token (unchanged)
        if (currentUser?.accessToken) {
          const response = await api.get("/users/profile", {
            headers: {
              Authorization: `Bearer ${currentUser.accessToken}`, // Use existing access token
            },
          });
          const { userId,username,firstName,lastName,avatar} = response.data.user;
        setCurrentUser({ userId,username,firstName,lastName, accessToken: currentUser.accessToken, avatar});
          return; // Exit if access token is valid
        }

        // If no access token or fetch fails, refresh token
        const accessToken = await refresh();

        // Re-attempt user data fetch with new access token
        const userDataResponse = await api.get("/users/profile", {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Use new access token
          },
        });

        const { userId,username,firstName,lastName,avatar} = userDataResponse.data.user;
        setCurrentUser({ userId,username,firstName,lastName, accessToken, avatar});
      } catch (err) {
        console.error("Error persisting login:", err);
      } finally {
        setIsLoading(false);
      }
    };

    handleLogin();
  }, []);

  return (
    <>
      {isLoading ? (
        <div className="h-[calc(100svh)] grid place-items-center">
          <div className="border border-neutral-300 rounded-xl p-4 w-fit h-fit flex flex-col gap-2 items-center">
            <p className="text-black text-lg">
              Please wait for the server to load.
            </p>
            <RotatingLines strokeColor="gray" width="24" />
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default PersistLogin;
