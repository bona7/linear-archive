import { useState, useEffect } from "react";
import {
  signIn,
  signOut,
  getUser,
  getDisplayName,
} from "@/commons/libs/supabase/auth";

export default function AuthPage() {
  return <div className="text-xl p-4">로그인, 회원가입 페이지입니다.</div>;
}
