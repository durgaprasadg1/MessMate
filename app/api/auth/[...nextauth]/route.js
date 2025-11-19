import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";

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

        const { email, password } = credentials;

        const AdminMod = await import("@/models/admin");
        const Admin = AdminMod.default;

        const admin = await Admin.findOne({ email });
        if (admin) {
          const valid = await bcrypt.compare(password, admin.password);
          if (!valid) throw new Error("Invalid password");

          return {
            id: admin._id.toString(),
            username: admin.name,
            email: admin.email,
            isAdmin: true,
            isOwner: false,
          };
        }

        const OwnerMod = await import("@/models/owner");
        const Owner = OwnerMod.default;

        const owner = await Owner.findOne({ email });
        if (owner) {
          const valid = await bcrypt.compare(password, owner.password);
          if (!valid) throw new Error("Invalid password");

          return {
            id: owner._id.toString(),
            username: owner.name,
            email: owner.email,
            isAdmin: false,
            isOwner: true,
          };
        }

        const ConsumerMod = await import("@/models/consumer");
        const Consumer = ConsumerMod.default;

        const user = await Consumer.findOne({ email });
        if (!user) throw new Error("User not found");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          username: user.name,
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
