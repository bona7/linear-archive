import { useState, useEffect } from "react";
import svgPaths from "@/imports/svg-jicd7esovz";
import supabase_logo from "public/assets/supabase_logo.png";

import { signIn, signUp } from "../commons/libs/supabase/auth";

interface LoginModalProps {
  isOpen: boolean;
  onLogin: () => void;
  initialStep?: "email" | "check_email" | "success" | null;
  onSignUpModeChange?: (isSignUpMode: boolean) => void;
}

type SignUpStep = "email" | "check_email" | "success";

export function LoginModal({
  isOpen,
  onLogin,
  initialStep,
  onSignUpModeChange,
}: LoginModalProps) {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("email");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign up fields
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  //const [emailVerified, setEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // isSignUpMode가 변경될 때마다 부모에게 알림
  useEffect(() => {
    onSignUpModeChange?.(isSignUpMode);
  }, [isSignUpMode, onSignUpModeChange]);

  // Reset to initial login state when modal opens
  useEffect(() => {
    if (isOpen) {
      // initialStep이 있으면 해당 단계로 설정
      if (initialStep) {
        setIsSignUpMode(true);
        setSignUpStep(initialStep);
      } else {
        setIsSignUpMode(false);
        setSignUpStep("email");
      }
      //setEmailVerified(false);
      setLoginEmail("");
      setLoginPassword("");
      setSignUpEmail("");
      setSignUpPassword("");
      setConfirmPassword("");
      setNickname("");
      setErrorMessage(null);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const passwordsMatch =
    signUpPassword === confirmPassword && confirmPassword.length > 0;
  const passwordsDontMatch =
    signUpPassword !== confirmPassword && confirmPassword.length > 0;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim() && loginPassword.trim()) {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const { user, session } = await signIn({
          email: loginEmail,
          password: loginPassword,
        });

        // 로그인 성공 시 onLogin 호출 (nickname은 부모에서 다시 불러옴)
        onLogin();
      } catch (error: any) {
        console.error("Login failed:", error);
        setErrorMessage(error.message || "로그인에 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSignUpEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      signUpEmail.trim() &&
      signUpPassword.trim() &&
      passwordsMatch &&
      nickname.trim()
    ) {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // 이메일 인증 코드 전송을 위해 signUp 호출 (닉네임 포함)
        await signUp({
          email: signUpEmail,
          password: signUpPassword,
          displayName: nickname, // 닉네임 포함
        });
        // 이메일 확인 단계로 이동
        setSignUpStep("check_email");
      } catch (error: any) {
        console.error("Sign up failed:", error);
        setErrorMessage(error.message || "회원가입에 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFinalLogin = () => {
    //onLogin(nickname);
    // 실제 로그인 없이 onLogin 호출하지 않음
    // 인증 메일 확인 후 로그인 화면으로 돌아가도록 처리
    setIsSignUpMode(false);
    setSignUpStep("email");
    setLoginEmail(signUpEmail); // 선택: 이메일 미리 채워주기
    setLoginPassword("");
  };

  const handleToggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setSignUpStep("email");
    //setEmailVerified(false);
    setLoginEmail("");
    setLoginPassword("");
    setSignUpEmail("");
    setSignUpPassword("");
    setConfirmPassword("");
    setNickname("");
  };

  // Sign Up Step 1: Email & Password
  if (isSignUpMode && signUpStep === "email") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#F2F0EB]/70 backdrop-blur-sm" />

        {/* Modal */}
        <div
          className="relative bg-[#F2F0EB] border-2 border-black p-12 z-10"
          style={{ width: "400px" }}
        >
          {/* Title */}
          <div className="mb-8">
            <p
              className="text-center mb-6"
              style={{
                // [수정] 제목 규칙: Space Grotesk
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "20px",
                fontWeight: "bold",
              }}
            >
              회원가입
            </p>
            <div className="w-full h-0.5 bg-black" />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-300 rounded">
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                  color: "#D32F2F",
                }}
              >
                {errorMessage}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignUpEmailSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="signUpEmail"
                className="block mb-2"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                이메일
              </label>
              <input
                id="signUpEmail"
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className="w-full border-2 border-black bg-[#F2F0EB] px-4 py-3 focus:outline-none focus:border-black"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "14px",
                }}
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="signUpPassword"
                className="block mb-2"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                비밀번호
              </label>
              <input
                id="signUpPassword"
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                className="w-full border-2 border-black bg-[#F2F0EB] px-4 py-3 focus:outline-none focus:border-black"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "14px",
                }}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-2"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border-2 border-black bg-[#F2F0EB] px-4 py-3 focus:outline-none focus:border-black"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "14px",
                }}
                placeholder="비밀번호를 재입력하세요"
                required
              />
              {passwordsMatch && (
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "11px",
                    opacity: 0.5,
                    marginTop: "4px",
                  }}
                >
                  ✓ 비밀번호가 일치합니다
                </p>
              )}
              {passwordsDontMatch && (
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "11px",
                    opacity: 0.5,
                    marginTop: "4px",
                  }}
                >
                  ✗ 비밀번호가 일치하지 않습니다
                </p>
              )}
            </div>

            {/* Nickname Field - 새로 추가 */}
            <div>
              <label
                htmlFor="signUpNickname"
                className="block mb-2"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                닉네임
              </label>
              <input
                id="signUpNickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full border-2 border-black bg-[#F2F0EB] px-4 py-3 focus:outline-none focus:border-black"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "14px",
                }}
                placeholder="화면에 표시할 닉네임을 입력하세요"
                required
              />
            </div>

            {/* Buttons */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || !nickname.trim()}
                className="w-full border-2 border-black bg-black text-[#F2F0EB] px-6 py-3 hover:bg-[#F2F0EB] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "15px",
                  fontWeight: "bold",
                }}
              >
                {isLoading ? "처리 중..." : "이메일 인증"}
              </button>

              <button
                type="button"
                onClick={handleToggleMode}
                className="w-full border-2 border-black bg-[#F2F0EB] text-black px-6 py-3 hover:bg-black hover:text-[#F2F0EB] transition-colors"
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "15px",
                }}
              >
                로그인 화면으로
              </button>
            </div>
          </form>

          {/* Decorative corners */}
          <div
            className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black"
            style={{ marginTop: "-2px", marginLeft: "-2px" }}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black"
            style={{ marginTop: "-2px", marginRight: "-2px" }}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black"
            style={{ marginBottom: "-2px", marginLeft: "-2px" }}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black"
            style={{ marginBottom: "-2px", marginRight: "-2px" }}
          />
        </div>
      </div>
    );
  }

  // Sign Up Step 2: Check Email
  if (isSignUpMode && signUpStep === "check_email") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#F2F0EB]/70 backdrop-blur-sm" />

        {/* Modal */}
        <div
          className="relative bg-[#F2F0EB] border-2 border-black p-12 z-10"
          style={{ width: "400px" }}
        >
          {/* Title */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div
                style={{
                  // [수정] 제목 규칙: Space Grotesk (LINEAR ARCHIVE)
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "36px",
                  lineHeight: "40px",
                  fontWeight: "bold",
                }}
              >
                <p style={{ margin: 0 }}>LINEAR</p>
                <p style={{ margin: 0 }}>ARCHIVE</p>
              </div>
            </div>
            <div className="w-full h-0.5 bg-black" />
          </div>

          {/* Check Email Message */}
          <div className="mb-8">
            <p
              className="text-center"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "18px",
                fontWeight: "bold",
                lineHeight: "1.6",
              }}
            >
              이메일 보관함에서
              <br />
              Confirm your mail을 눌러주세요.
            </p>
          </div>

          {/* Decorative corners */}
          <div
            className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black"
            style={{ marginTop: "-2px", marginLeft: "-2px" }}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black"
            style={{ marginTop: "-2px", marginRight: "-2px" }}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black"
            style={{ marginBottom: "-2px", marginLeft: "-2px" }}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black"
            style={{ marginBottom: "-2px", marginRight: "-2px" }}
          />
        </div>
      </div>
    );
  }

  // Sign Up Step 3: Success
  if (isSignUpMode && signUpStep === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#F2F0EB]/70 backdrop-blur-sm" />

        {/* Modal */}
        <div
          className="relative bg-[#F2F0EB] border-2 border-black p-12 z-10"
          style={{ width: "400px" }}
        >
          {/* Title */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <div
                style={{
                  // [수정] 제목 규칙: Space Grotesk
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "36px",
                  lineHeight: "40px",
                  fontWeight: "bold",
                }}
              >
                <p style={{ margin: 0 }}>LINEAR</p>
                <p style={{ margin: 0 }}>ARCHIVE</p>
              </div>
            </div>
            <div className="w-full h-0.5 bg-black" />
          </div>

          {/* Success Message */}
          <div className="mb-8">
            <p
              className="text-center mb-8"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "20px",
                fontWeight: "bold",
                lineHeight: "1.5",
              }}
            >
              회원 가입에 성공하였습니다.
            </p>
            <p
              className="text-center mb-0"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              로그인하여 LINEAR-ARCHIVE <br />
              서비스를 이용해보세요.
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={handleFinalLogin}
            className="w-full border-2 border-black bg-black text-[#F2F0EB] px-6 py-3 hover:bg-[#F2F0EB] hover:text-black transition-colors"
            style={{
              fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            로그인
          </button>

          {/* Decorative corners */}
          <div
            className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black"
            style={{ marginTop: "-2px", marginLeft: "-2px" }}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black"
            style={{ marginTop: "-2px", marginRight: "-2px" }}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black"
            style={{ marginBottom: "-2px", marginLeft: "-2px" }}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black"
            style={{ marginBottom: "-2px", marginRight: "-2px" }}
          />
        </div>
      </div>
    );
  }

  // Login Mode (default)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-48 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#F2F0EB]/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-[#F2F0EB] border-2 border-black p-12 z-10"
        style={{ width: "400px" }}
      >
        {/* Title */}
        <div className="mb-8 text-center">
          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "48px",
              fontWeight: "bold",
            }}
          >
            로그인
          </h2>
          <div className="w-full h-0.5 bg-black mt-4" />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-300 rounded">
            <span
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "12px",
                color: "#D32F2F",
              }}
            >
              {errorMessage}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit}>
          {/* Email Field */}
          <div className="mb-6">
            <label
              htmlFor="loginEmail"
              className="block mb-2"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              이메일
            </label>
            <input
              id="loginEmail"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full border-2 border-black bg-[#F2F0EB] px-4 py-3 focus:outline-none focus:border-black"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "14px",
              }}
              placeholder="이메일 입력"
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-8">
            <label
              htmlFor="loginPassword"
              className="block mb-2"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              비밀번호
            </label>
            <input
              id="loginPassword"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full border-2 border-black bg-[#F2F0EB] px-4 py-3 focus:outline-none focus:border-black"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "14px",
              }}
              placeholder="비밀번호 입력"
              required
            />
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full border-2 border-black bg-black text-[#F2F0EB] px-6 py-3 hover:bg-[#F2F0EB] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>

            <button
              type="button"
              onClick={handleToggleMode}
              className="w-full border-2 border-black bg-[#F2F0EB] text-black px-6 py-3 hover:bg-black hover:text-[#F2F0EB] transition-colors"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "12px",
              }}
            >
              신규 사용자이신가요? 회원가입
            </button>
          </div>
        </form>

        {/* Decorative corners */}
        <div
          className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black"
          style={{ marginTop: "-2px", marginLeft: "-2px" }}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black"
          style={{ marginTop: "-2px", marginRight: "-2px" }}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black"
          style={{ marginBottom: "-2px", marginLeft: "-2px" }}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black"
          style={{ marginBottom: "-2px", marginRight: "-2px" }}
        />
      </div>
    </div>
  );
}
