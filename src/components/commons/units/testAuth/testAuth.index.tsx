import { useState, useEffect } from "react";
import {
  signUp,
  signIn,
  signOut,
  getUser,
  getDisplayName,
} from "../../../../commons/libs/supabase/auth";
import { Container, Form, Button, Info, Error } from "./testAuth.style";

export default function TestAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [displayNameValue, setDisplayNameValue] = useState<string | null>(null);

  // 현재 사용자 정보 가져오기
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp({ email, password, displayName });
        alert("회원가입 성공!");
      } else {
        await signIn({ email, password });
        alert("로그인 성공!");
      }
      await checkUser();
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut();
      setUser(null);
      setDisplayNameValue(null);
      alert("로그아웃 성공!");
    } catch (err: any) {
      setError(err.message || "로그아웃 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1>인증 테스트</h1>

      {user ? (
        <Info>
          <h2>로그인 상태</h2>
          <p>이메일: {user.email}</p>
          <p>사용자 ID: {user.id}</p>
          <p>Display Name: {displayNameValue || "없음"}</p>
          <Button onClick={handleSignOut} disabled={loading}>
            로그아웃
          </Button>
        </Info>
      ) : (
        <Form onSubmit={handleSubmit}>
          <h2>{isSignUp ? "회원가입" : "로그인"}</h2>

          {isSignUp && (
            <div>
              <label>Display Name:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="이름을 입력하세요"
              />
            </div>
          )}

          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호"
            />
          </div>

          {error && <Error>{error}</Error>}

          <Button type="submit" disabled={loading}>
            {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
          </Button>

          <Button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            style={{ marginTop: "10px", backgroundColor: "#666" }}
          >
            {isSignUp ? "로그인으로 전환" : "회원가입으로 전환"}
          </Button>
        </Form>
      )}

      <div style={{ marginTop: "30px" }}>
        <Button onClick={checkUser} style={{ backgroundColor: "#2196F3" }}>
          사용자 정보 새로고침
        </Button>
      </div>
    </Container>
  );
}
