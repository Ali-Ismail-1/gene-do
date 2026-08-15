import { getCurrentUser } from "@/lib/current-user";

export default function Home() {
  const currentUser = getCurrentUser();

  return (
    <div>
      <h1>Welcome, {currentUser.name}</h1>
      <p>Submit footage, track your projects, and review completed work.</p>
    </div>
  );
}
