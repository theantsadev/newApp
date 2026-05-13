import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "./authStorage";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate to="/backoffice/login" state={{ from: location }} replace />
    );
  }

  return children;
};

export default ProtectedRoute;
