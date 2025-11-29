import React from "react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  signIn,
  signOut,
  getUser,
  getDisplayName,
} from "../../../../commons/libs/supabase/auth";
import {
  Container,
  WelcomeText,
  LoginForm,
  Input,
  LoginButton,
} from "./loginPage.style";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [displayNameValue, setDisplayNameValue] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
      const name = await getDisplayName();
      setDisplayNameValue(name);
    } catch (err) {
      setUser(null);
      setDisplayNameValue(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn({ email, password });
      alert("로그인 성공!");
      await checkUser();
      setEmail("");
      setPassword("");
      router.push("/main");
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <WelcomeText>Welcome to Linear Archive</WelcomeText>
      <LoginForm onSubmit={handleLogin}>
        <Input
          placeholder="email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <LoginButton type="submit">로그인</LoginButton>
      </LoginForm>
    </Container>
  );
};

export default LoginPage;
