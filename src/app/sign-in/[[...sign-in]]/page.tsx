import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-[#6C63FF]/15 blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-[#FF6B9D]/10 blur-3xl" />
      </div>
      <SignIn />
    </div>
  );
}
