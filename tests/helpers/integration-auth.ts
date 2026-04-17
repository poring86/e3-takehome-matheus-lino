export const integrationEnv = {
  appBaseUrl:
    process.env.TEST_APP_BASE_URL?.trim() ||
    `http://localhost:${process.env.APP_PORT || "3000"}`,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "",
  testEmail: process.env.TEST_EMAIL?.trim() || "",
  testPassword: process.env.TEST_PASSWORD?.trim() || "",
  testOrgId: process.env.TEST_ORG_ID?.trim() || "",
};

export const missingIntegrationEnv = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: integrationEnv.supabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: integrationEnv.supabaseAnonKey,
  TEST_EMAIL: integrationEnv.testEmail,
  TEST_PASSWORD: integrationEnv.testPassword,
  TEST_ORG_ID: integrationEnv.testOrgId,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);

export async function getAccessToken(): Promise<string> {
  const response = await fetch(
    `${integrationEnv.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: integrationEnv.supabaseAnonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: integrationEnv.testEmail,
        password: integrationEnv.testPassword,
      }),
    },
  );

  const payload = await response.json().catch(() => null);
  const token = payload?.access_token;

  if (!response.ok || !token) {
    throw new Error(
      `Could not obtain test access token (status ${response.status}).`,
    );
  }

  return token;
}
