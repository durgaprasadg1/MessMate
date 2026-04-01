import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import supabase from "@/lib/supabaseClient";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const { email, password } = credentials;

        const adminRes = await supabase
          .from("admin")
          .select("*")
          .eq("email", email)
          .single();
        if (!adminRes.error && adminRes.data) {
          const admin = adminRes.data;
          const valid = await bcrypt.compare(password, admin.password);
          if (!valid) throw new Error("Invalid password");
          return {
            id: admin.id,
            username: admin.name,
            email: admin.email,
            isAdmin: true,
            isOwner: false,
          };
        }

        const ownerRes = await supabase
          .from("owner")
          .select("*")
          .eq("email", email)
          .single();
        if (!ownerRes.error && ownerRes.data) {
          const owner = ownerRes.data;
          const valid = await bcrypt.compare(password, owner.password);
          if (!valid) throw new Error("Invalid password");
          return {
            id: owner.id,
            username: owner.name,
            email: owner.email,
            isAdmin: false,
            isOwner: true,
          };
        }

        const userRes = await supabase
          .from("consumer")
          .select("*")
          .eq("email", email)
          .single();
        if (userRes.error || !userRes.data) throw new Error("User not found");
        const user = userRes.data;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Invalid password");

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: false,
          isOwner: false,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.isAdmin = user.isAdmin || false;
        token.isOwner = user.isOwner || false;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.isAdmin = token.isAdmin;
      session.user.isOwner = token.isOwner;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
