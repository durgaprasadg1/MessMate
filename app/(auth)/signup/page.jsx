import SignupComponent from "@/Component/Auth/SignupComponent";
import { redirectIfSignedIn } from "@/lib/server/auth/pageGuards";

const SignUp = async () => {
  await redirectIfSignedIn();
  return (
    <div>
      <SignupComponent />
    </div>
  );
};

export default SignUp;
