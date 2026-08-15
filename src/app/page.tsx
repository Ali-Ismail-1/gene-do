import { getCurrentUser } from "@/lib/current-user";

export default function Home() {
  const currentUser = getCurrentUser();

  return (
    <div>
      <h1>Video Editor Client Portal</h1>
      <p>
        This is a prototype for validating the customer-to-editor workflow:
        create a project, provision Dropbox folders, upload source files,
        submit the project, and track status as the editor works.
      </p>
      <p>
        Logged in as:
        <br />
        {currentUser.name}
        <br />
        {currentUser.email}
      </p>
    </div>
  );
}
