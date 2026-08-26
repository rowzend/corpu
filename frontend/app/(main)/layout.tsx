import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DevMinioWarning from '@/components/DevMinioWarning';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <DevMinioWarning />
            <Navbar />
            <div className="pt-20">
                {children}
            </div>
            <Footer />
        </>
    );
}
