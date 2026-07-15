import { redirect } from "next/navigation";

function AdminPage() {
  redirect("/admin/users");
}

export default AdminPage;
