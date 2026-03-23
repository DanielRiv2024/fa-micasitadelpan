import Sidebar from "@/components/sideBar";

export default function LeadingPage() {
    return (
        <div className="flex h-screen bg-white">
            <Sidebar />
            <main className="flex-1 p-8 overflow-auto">
                <p>this is leading</p>
            </main>
        </div>
    );
}