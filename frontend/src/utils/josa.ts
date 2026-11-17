// 받침에 따라 조사를 고른다. josa('여의도 한바퀴', '을', '를') → '여의도 한바퀴를'
export function josa(word: string, withBatchim: string, withoutBatchim: string) {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return word + withoutBatchim; // 한글이 아니면 받침 없음으로 본다
  return word + (code % 28 > 0 ? withBatchim : withoutBatchim);
}
