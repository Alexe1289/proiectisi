export function getRoleFromToken(token: string): string {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));

    if (decoded.sub) {
      const parts = decoded.sub.split(':');
      return parts[1] || 'guest';
    }
    return 'guest';
  } catch (e) {
    console.error('Eroare decodare JWT', e);
    return 'guest';
  }
}
