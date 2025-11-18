import React from "react";
import { useRouter } from "next/router";
import {
  Container,
  WelcomeText,
  LoginForm,
  Input,
  LoginButton,
} from "./loginPage.style";

const LoginPage: React.FC = () => {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Add login logic here
    router.push("/main");
  };

  return (
    <Container>
      <WelcomeText>Welcome to Linear Archive</WelcomeText>
      <LoginForm onSubmit={handleLogin}>
        <Input placeholder="email" type="email" />
        <Input placeholder="password" type="password" />
        <LoginButton type="submit">로그인</LoginButton>
      </LoginForm>
    </Container>
  );
};

export default LoginPage;
