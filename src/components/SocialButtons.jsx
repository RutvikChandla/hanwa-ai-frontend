import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import FacebookIcon from '@mui/icons-material/Facebook';
import SvgIcon from '@mui/material/SvgIcon';
import { auth, googleProvider, facebookProvider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


function GoogleIcon(props) {
    // Minimal Google "G" SVG for startIcon
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M21.35 11.1h-9.18v2.96h5.27c-.23 1.36-1.59 3.98-5.27 3.98-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.03.77 3.73 1.43l2.54-2.46C16.8 3.65 14.78 2.7 12.17 2.7 6.97 2.7 2.75 6.92 2.75 12.1s4.22 9.4 9.42 9.4c5.44 0 9.03-3.82 9.03-9.2 0-.62-.07-1.07-.15-1.2z" />
        </SvgIcon>
    );
}


async function upsertProfile(u) {
    if (!u) return;
    await setDoc(doc(db, 'users', u.uid), {
        uid: u.uid, email: u.email || '', displayName: u.displayName || '',
        photoURL: u.photoURL || '', provider: u.providerData?.[0]?.providerId || 'password',
        lastLogin: serverTimestamp(),
    }, { merge: true });
}


export default function SocialButtons() {
    const signInGoogle = async () => {
        const r = await signInWithPopup(auth, googleProvider);
        await upsertProfile(r.user);
        window.location.href = '/';
    };
    const signInFacebook = async () => {
        const r = await signInWithPopup(auth, facebookProvider);
        await upsertProfile(r.user);
        window.location.href = '/';
    };


    return (
        <Stack spacing={1.5}>
            <Button variant="outlined" fullWidth onClick={signInGoogle} startIcon={<GoogleIcon />}>Continue with Google</Button>
            <Button variant="outlined" fullWidth onClick={signInFacebook} startIcon={<FacebookIcon />}>Continue with Facebook</Button>
        </Stack>
    );
}