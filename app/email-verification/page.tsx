import { redirect } from 'next/navigation';

export default function EmailVerificationAliasPage() {
  redirect('/modules/verify-email');
}
