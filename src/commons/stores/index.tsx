import { atom } from "recoil";

import { recoilPersist } from "recoil-persist";
const { persistAtom } = recoilPersist();

export const accessTokenState = atom<string | null>({
  key: "accessTokenState",
  default: null,
});

export const authCheckedState = atom<boolean>({
  key: "authCheckedState",
  default: false, // 아직 refresh 여부 판단 전
});
