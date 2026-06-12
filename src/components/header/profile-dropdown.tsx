import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {useAuth} from "@/contexts/auth-context";
import {LogOut, Settings, User} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {useLocale} from "@/contexts/locale-context";

export function ProfileDropdown() {
    const {logout, isAuthenticated} = useAuth();
    const {toast} = useToast();
    const {t} = useLocale();

    const handleLogout = async () => {
        try {
            await logout();
            toast({
                title: t("common", "success"),
                description: t("auth", "logoutSuccess"),
            });
        } catch (error) {
            toast({
                title: t("common", "error"),
                description: t("auth", "logoutError"),
                variant: "destructive",
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button aria-label="Profile menu" className="relative flex h-8 w-8 items-center justify-center rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt="Profile"/>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            U
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{t("profile", "yourName")}</p>
                        <p className="text-xs leading-none text-muted-foreground"></p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4"/>
                        <span>{t("profile", "myProfile")}</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4"/>
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4"/>
                    <span>{t("auth", "logout")}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
