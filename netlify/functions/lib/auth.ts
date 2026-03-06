export function validatePasscode(passcode: string): boolean {
  const expected = process.env.PASSCODE || '1234';
  return passcode === expected;
}

export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ success: false, error: 'INVALID_PASSCODE', message: 'Invalid passcode' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
