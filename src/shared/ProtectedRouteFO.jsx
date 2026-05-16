import { Navigate } from "react-router-dom";
import { isCustomerAuthenticated } from "./customerAuthStorage";

const ProtectedRouteFO = ({ children }) => {
  if (!isCustomerAuthenticated()) {
    return <Navigate to="/frontoffice/login" replace />;
  }
  return children;
};

export default ProtectedRouteFO;
