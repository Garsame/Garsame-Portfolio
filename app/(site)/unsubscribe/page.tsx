import type { Metadata } from "next";
import { unsubscribeByToken } from "@/lib/members";
import { UnsubscribeView } from "@/components/site/unsubscribe/UnsubscribeView";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Unsubscribe from GARSAME v3 updates.",
};

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <UnsubscribeView
        token=""
        initialStatus="missing"
      />
    );
  }

  const result = await unsubscribeByToken(token);

  if (!result.success || !result.member) {
    return (
      <UnsubscribeView
        token={token}
        initialStatus="invalid"
      />
    );
  }

  return (
    <UnsubscribeView
      token={token}
      initialStatus="success"
      memberName={result.member.firstName}
      memberEmail={result.member.email}
    />
  );
}
