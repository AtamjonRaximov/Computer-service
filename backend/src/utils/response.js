export function sendJson(res, statusCode, data, token) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    const maxAge = 30 * 24 * 60 * 60;
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict; Secure`;
    headers['Set-Cookie'] = cookie;
  }

  res.writeHead(statusCode, headers);

  if (data.token) delete data.token;

  res.end(JSON.stringify(data));
}
