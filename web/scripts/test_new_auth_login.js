const https = require('https');

const newUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '') : 'kumbtvmjpmjtmoefddux.supabase.co';
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Let's test listing users via admin API and verify their metadata & profiles
async function testAuth() {
  console.log('Testing Admin Users API on new project...');
  
  const options = {
    hostname: newUrl,
    path: '/auth/v1/admin/users?per_page=5',
    method: 'GET',
    headers: {
      'apikey': secret,
      'Authorization': 'Bearer ' + secret
    }
  };

  const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Total users sample received:', parsed.users?.length);
        if (parsed.users && parsed.users.length > 0) {
          for (const u of parsed.users) {
            console.log(`- User: ${u.email} | ID: ${u.id} | Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}`);
          }
        }
      } catch (e) {
        console.error('Parse error:', e, data);
      }
    });
  });

  req.on('error', e => console.error('Req error:', e.message));
  req.end();
}

testAuth();
