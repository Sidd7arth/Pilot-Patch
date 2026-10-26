'use client';

import ProposalDetailPage from '../../../proposals/[id]/page';

export default function AppProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProposalDetailPage params={params} />;
}
