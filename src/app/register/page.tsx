import { redirect } from 'next/navigation';

// OAuth 방식으로 전환되어 별도 회원가입이 필요 없음
// 로그인 페이지로 리다이렉트
export default function RegisterPage() {
  redirect('/login');
}
