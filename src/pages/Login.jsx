import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import AuthLayout from '../layouts/AuthLayout';
import SocialButtons from '../components/SocialButtons';
import { Card, CardContent, CardHeader } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);


    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = '/';
            console.log(e);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };


    return (
        <AuthLayout>
            <Card sx={{ width: '100%' }}>
                <CardHeader title="Welcome back" subheader="Log in to your account" />
                <CardContent>
                    <form onSubmit={onSubmit}>
                        <Stack spacing={2}>
                            {error && <Alert severity="error">{error}</Alert>}
                            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
                            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
                            <Button type="submit" variant="contained" disabled={busy}>Log in</Button>
                            <Divider>or</Divider>
                            <SocialButtons />
                            <Link href="/signup" underline="hover" sx={{ textAlign: 'center', mt: 1 }}>No account? Create one</Link>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}