import React from "react";
import { useRouter } from "next/router";
import {
  Container,
  WelcomeText,
  ArrowImage,
  ButtonWrapper,
  IntroButton,
} from "./introPage.style";

const IntroPage: React.FC = () => {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push("/onboarding/login");
  };

  return (
    <Container>
      <WelcomeText>Welcome to Linear Archive</WelcomeText>
      <ArrowImage src="/icons/main/arrow-1.svg" alt="arrow" />
      <ButtonWrapper>
        <IntroButton onClick={handleLoginClick}>로그인</IntroButton>
        <IntroButton>회원가입</IntroButton>
      </ButtonWrapper>
    </Container>
  );
};

export default IntroPage;
