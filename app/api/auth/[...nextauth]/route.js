import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "../../../../lib/mongodb";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        await connectDB();

        // ADMIN CHECK
        const Admin_mod = await import("../../../../models/admin.js");
        const Admin = Admin_mod.default || Admin_mod;
        const admin = await Admin.findOne({ email: credentials.email });

        if (admin) {
          const isValid = await bcrypt.compare(
            credentials.password,
            admin.password
          );
          if (!isValid) throw new Error("Invalid password");

          return {
            id: admin._id.toString(),
            username: admin.name,
            email: admin.email,
            isAdmin: true,
          };
        }

        // CONSUMER CHECK
        const mod = await import("../../../../models/consumer");
        const UserModel = mod.default || mod;

        const user = await UserModel.findOne({ email: credentials.email });
        if (!user) throw new Error("User not found");
        if (!user.password) throw new Error("User has no password set");

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) throw new Error("Invalid Credential, check again");

        return {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          isAdmin: false,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.isAdmin = user.isAdmin; // IMPORTANT
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
