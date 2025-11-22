import ResetPasswordForm from "@/Component/Auth/ResetPasswordForm";

export default async function ResetToken({params}) {
    const {token} = await params;
    return <ResetPasswordForm token={token}/>
}