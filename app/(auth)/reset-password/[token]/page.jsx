import ResetPasswordForm from "../../../../Component/ResetPasswordForm";

export default async function ResetToken({params}) {
    const {token} = await params;
    console.log("Token : ", token)
    return <ResetPasswordForm token={token}/>
}