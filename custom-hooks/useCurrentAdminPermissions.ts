import { useGetOwnProfileQuery } from "@/store/services/profileService";

export type AdminAction = "view" | "edit" | "delete";
export type AdminPage =
    | "users"
    | "shops"
    | "listings"
    | "services"
    | "categories"
    | "bookings"
    | "broadcasts"
    | "announcements"
    | "feed"
    | "reports"
    | "email-logs"
    | "analytics"
    | "settings"
    | "members"
    | "wallet"
    | "reviews";

export type PermissionEntry = { page: AdminPage; actions: AdminAction[] };

type CurrentUserData = {
    roles?: string[];
    permissions?: PermissionEntry[];
};

/** Reads the logged-in admin's roles/permissions and exposes page + action checks.
 *  super_admin always passes every check, matching the backend guard's bypass.
 *
 *  Sourced from /admins/me. It used to read GET /users/detail/:id, which stopped
 *  resolving when staff moved out of that table — every check then fell back to
 *  an empty permission list, so even a super admin was shown nothing. */
export function useCurrentAdminPermissions() {
    const { data, isLoading } = useGetOwnProfileQuery(undefined);
    const currentUser = (data as { data?: CurrentUserData } | undefined)?.data;

    const roles = currentUser?.roles ?? [];
    const permissions = currentUser?.permissions ?? [];
    const isSuperAdmin = roles.includes("super_admin");

    function has(page: AdminPage): boolean {
        return isSuperAdmin || permissions.some((p) => p.page === page);
    }

    function canEdit(page: AdminPage): boolean {
        if (isSuperAdmin) return true;
        return permissions.find((p) => p.page === page)?.actions.includes("edit") ?? false;
    }

    function canDelete(page: AdminPage): boolean {
        if (isSuperAdmin) return true;
        return permissions.find((p) => p.page === page)?.actions.includes("delete") ?? false;
    }

    return { isLoading, isSuperAdmin, roles, permissions, has, canEdit, canDelete };
}
