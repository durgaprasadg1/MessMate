import SignUpComponent from "../../Component/Auth/SignupComponent";
import { redirectIfSignedIn } from "@/lib/server/auth/pageGuards";

const RegisterOwner = async () => {
  await redirectIfSignedIn();
  return (
    <div>
      <SignUpComponent />
    </div>
  );
};

export default RegisterOwner;
