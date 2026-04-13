// NextAuth.js配置

import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

// GitHub Profile类型
interface GitHubProfile {
  id: number;
  login: string;
  avatar_url: string;
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
  created_at?: string;
  updated_at?: string;
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn('GitHub OAuth配置缺失，请检查环境变量');
}

export const authConfig: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 初始登录时，将GitHub access token保存到JWT
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      // 将GitHub用户信息保存到JWT
      if (profile) {
        const githubProfile = profile as GitHubProfile;
        token.id = githubProfile.id.toString();
        token.login = githubProfile.login;
        token.avatar_url = githubProfile.avatar_url;
      }

      return token;
    },
    async session({ session, token }) {
      // 将JWT中的信息发送到客户端
      if (session.user) {
        session.user.id = token.id as string;
        session.user.login = token.login as string;
        session.user.avatar_url = token.avatar_url as string;
        session.accessToken = token.accessToken as string;
        session.provider = token.provider as string;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // 登录后重定向到仪表板
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      // 允许相对URL
      else if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24小时
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// 扩展NextAuth类型声明
declare module 'next-auth' {
  interface User {
    login?: string;
    avatar_url?: string;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;
      avatar_url?: string;
    };
    accessToken?: string;
    provider?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    provider?: string;
    id?: string;
    login?: string;
    avatar_url?: string;
  }
}