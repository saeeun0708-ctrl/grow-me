// 한글 조사 선택 유틸 — 단어의 마지막 글자 받침 유무로 조사를 고른다.
// 한글 음절(가~힣)이 아니면(영문·숫자 등으로 끝나면) 받침 없는 것으로 간주한다(휴리스틱).

export function hasBatchim(word) {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절 영역 밖
  return (code - 0xac00) % 28 !== 0; // 종성 인덱스가 0이 아니면 받침 있음
}

// 받침 있으면 withB, 없으면 withoutB. 예: josa(name, "을", "를")
export function josa(word, withB, withoutB) {
  return hasBatchim(word) ? withB : withoutB;
}
