// 숫자·날짜를 화면에 보여 줄 글자로 바꾸는 함수 모음

/** 1km 당 초 → 5'59" */
export function pace(sec: number | null | undefined) {
  if (!sec || !Number.isFinite(sec) || sec <= 0) return `-'--"`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}'${String(s).padStart(2, '0')}"`;
}

/** 초 → 28:41 또는 1:02:05 */
export function duration(sec: number | null | undefined) {
  const total = Math.max(0, Math.round(sec ?? 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return h ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
}

/** 3.2 → "3.2", 3 → "3.0" */
export function km(value: number | null | undefined, digits = 1) {
  return (value ?? 0).toFixed(digits);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 서버 날짜(2026-11-24T19:00:00) → Date. 서버는 한국 시간 기준으로 시간대 없이 보낸다 */
export function parseDate(value: string) {
  return new Date(value.length <= 10 ? `${value}T00:00:00` : value);
}

/** 10월 22일 (목) */
export function dateLabel(value: string) {
  const d = parseDate(value);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

/** 10.27 (화) 오후 7:00 */
export function dateTimeLabel(value: string) {
  const d = parseDate(value);
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${d.getMonth() + 1}.${d.getDate()} (${WEEKDAYS[d.getDay()]}) ${ampm} ${h12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 방금 전 / 3시간 전 / 4일 전 / 2주 전 / 10월 3일 */
export function ago(value: string) {
  const diff = (Date.now() - parseDate(value).getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}주 전`;
  const d = parseDate(value);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 오늘 기준 며칠 남았는지: D-day / D-3 */
export function dday(value: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = parseDate(value);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - start.getTime()) / 86400000);
  return days <= 0 ? 'D-day' : `D-${days}`;
}

/** 서버로 보낼 날짜 글자 (시간대 없이 한국 시간 그대로): 2026-11-24T19:00:00 */
export function toServerDateTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 이름 첫 글자 (아바타용) */
export function initial(name: string | null | undefined) {
  return (name ?? '?').trim().charAt(0) || '?';
}
