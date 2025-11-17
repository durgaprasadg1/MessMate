import ResetPasswordForm from "@/Component/Auth/ResetPasswordForm";

export default async function ResetToken({params}) {
    const {token} = await params;
    console.log("Token : ", token)
    return <ResetPasswordForm token={token}/>
}