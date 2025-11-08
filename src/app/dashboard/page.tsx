
'use client';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './loading';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export default function DashboardRedirectPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        // Wait until both user and profile loading is complete
        if (isUserLoading || isProfileLoading) {
            return;
        }

        // If not logged in after loading, redirect to login
        if (!user) {
            router.replace('/login');
            return;
        }

        // Special override for admin user
        if (user.email === 'admin@nexustalent.com') {
            router.replace('/dashboard/admin');
            return;
        }
        
        // Special override for recruiter test user
        if (user.email === 'recruiter@nexustalent.com.br') {
            router.replace('/dashboard/recruiter');
            return;
        }

        // Special override for instructor test user
        if (user.email === 'formador@nexustalent.com.br') {
            router.replace('/dashboard/instructor');
            return;
        }

        // Redirect based on the role from the Firestore profile
        const role = userProfile?.userType;

        if (role) {
            router.replace(`/dashboard/${role}`);
        } else {
            // Fallback to student dashboard if profile/role is somehow missing after loading
            console.warn("User profile or userType not found, defaulting to student dashboard.");
            router.replace('/dashboard/student');
        }

    }, [user, isUserLoading, userProfile, isProfileLoading, router, firestore]);

    // Display a loading screen while authentication and profile fetching are in progress.
    return <Loading />;
}
