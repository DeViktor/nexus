import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FirebaseClientProvider>
            <div className="min-h-screen flex flex-col">
                <DashboardHeader />
                <SidebarProvider>
                    <Sidebar>
                        <SidebarHeader>
                            <SidebarTrigger />
                        </SidebarHeader>
                        <SidebarContent>
                            {/* Sidebar content goes here in the future */}
                        </SidebarContent>
                    </Sidebar>
                    <SidebarInset>
                        <main className="flex-grow p-4 sm:p-6 lg:p-8">
                            {children}
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </div>
        </FirebaseClientProvider>
    );
}
