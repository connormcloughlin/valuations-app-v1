import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../authConfig";

export const useAuth = () => {
    const { instance } = useMsal();
    const navigate = useNavigate();

    const login = async () => {
        try {
            await instance.loginPopup(loginRequest);
            navigate("/");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const logout = () => {
        instance.logoutPopup();
    };

    const getToken = async () => {
        try {
            const response = await instance.acquireTokenSilent(loginRequest);
            return response.accessToken;
        } catch (error) {
            console.error("Token acquisition failed:", error);
            return null;
        }
    };

    return {
        login,
        logout,
        getToken
    };
}; 