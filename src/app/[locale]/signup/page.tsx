import { AuthForm } from "@/components/AuthForm";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
