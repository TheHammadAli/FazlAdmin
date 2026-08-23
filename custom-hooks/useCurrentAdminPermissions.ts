import { useAppSelector } from "@/store/store";
import { useGetUserDetailQuery } from "@/store/services/adminService";

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
    | "wallet";

export type PermissionEntry = { page: AdminPage; actions: AdminAction[] };

type CurrentUserData = {
    roles?: string[];
    permissions?: PermissionEntry[];
};

/** Reads the logged-in admin's roles/permissions and exposes page + action checks.
 *  super_admin always passes every check, matching the backend guard's bypass. */
export function useCurrentAdminPermissions() {
    const userId = useAppSelector((state) => state.authReducer.userId);
    const { data, isLoading } = useGetUserDetailQuery(userId, { skip: !userId });
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
