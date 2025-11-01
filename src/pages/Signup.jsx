import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import AuthLayout from '../layouts/AuthLayout';
import { Card, CardContent, CardHeader } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import SocialButtons from '../components/SocialButtons';


export default function Signup() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);


    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName) await updateProfile(cred.user, { displayName });
            await setDoc(doc(db, 'users', cred.user.uid), {
                uid: cred.user.uid,
                email: cred.user.email,
                displayName: displayName || cred.user.displayName || '',
                createdAt: serverTimestamp(),
            }, { merge: true });
            window.location.href = '/';
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };


    return (
        <AuthLayout>
            <Card sx={{ width: '100%' }}>
                <CardHeader title="Create account" subheader="It takes less than a minute" />
                <CardContent>
                    <form onSubmit={onSubmit}>
                        <Stack spacing={2}>
                            {error && <Alert severity="error">{error}</Alert>}
                            <TextField label="Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} fullWidth />
                            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
                            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
                            <Button type="submit" variant="contained" disabled={busy}>Sign up</Button>
                            <Divider>or</Divider>
                            <SocialButtons />
                            <Link href="/" underline="hover" sx={{ textAlign: 'center', mt: 1 }}>Already have an account? Log in</Link>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}