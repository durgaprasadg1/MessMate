import LoginComponent from "../../../Component/Auth/LoginComponent";
import { redirectIfSignedIn } from "@/lib/server/auth/pageGuards";

const Login = async () => {
  await redirectIfSignedIn();
  return (
    <div>
      <LoginComponent />
    </div>
  );
};

export default Login;
