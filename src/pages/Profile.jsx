import { useAuth } from '../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';


export default function Profile() {
    const { user } = useAuth();


    return (
        <Container maxWidth="md">
            <Box py={6} display="grid" gap={3}>
                <Card>
                    <CardContent style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Avatar src={user?.photoURL || ''} sx={{ width: 64, height: 64 }}>
                            {user?.displayName?.[0]?.toUpperCase()}
                        </Avatar>
                        <div>
                            <Typography variant="h6">{user?.displayName || 'Anonymous User'}</Typography>
                            <Typography color="text.secondary">{user?.email}</Typography>
                        </div>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button variant="outlined" onClick={() => signOut(auth)}>Sign out</Button>
                    </CardContent>
                </Card>


                <Card>
                    <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Raw user object</Typography>
                        <Box component="pre" sx={{ m: 0, p: 2, bgcolor: '#f6f8fb', borderRadius: 2, overflow: 'auto' }}>
                            {JSON.stringify({
                                uid: user?.uid,
                                email: user?.email,
                                name: user?.displayName,
                                photo: user?.photoURL,
                                provider: user?.providerData?.[0]?.providerId,
                            }, null, 2)}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}