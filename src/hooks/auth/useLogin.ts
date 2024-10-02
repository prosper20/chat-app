import { useMutation } from "@tanstack/react-query";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { AxiosError, AxiosResponse } from "axios";

const login = ({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<AxiosResponse<User>> => {
  return api.post(
    "/auth/login",
    { email: username, password },
    { withCredentials: true }
  );
};

const useLogin = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const { mutate: loginMutation, isLoading: isLoginLoading, error: loginError } = useMutation(login, {
    onSuccess: async (data) => {
      const { accessToken } = data.data; // Access token from login response
      try {
        const res = await api.get("/users/profile", {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include access token in headers
          },
        });
        const { userId,username,firstName,lastName,avatar} = res.data.user;
        setCurrentUser({ userId,username,firstName,lastName, accessToken, avatar});
        navigate("/");
      } catch (err) {
        console.error("Error fetching user data:", err);
        // Handle potential error fetching user data (optional)
      }
    },
    onError: (err: AxiosError<{ message: string }>) => {
      throw err;
    },
  });

  return { loginMutation, isLoginLoading, loginError };
};

export default useLogin;

