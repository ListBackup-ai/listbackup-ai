import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - ListBackup.ai',
  description: 'Complete API reference for ListBackup.ai backup and synchronization services',
  keywords: ['API', 'documentation', 'ListBackup', 'backup', 'integration', 'REST API'],
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}