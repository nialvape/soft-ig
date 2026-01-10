export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
            <main className="flex flex-col items-center gap-8 text-center">
                <h1 className="text-4xl font-bold">Soft-IG</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Instagram Alternative - Healthier Content Consumption
                </p>
                <div className="flex flex-col gap-4 text-left">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                        <h2 className="font-semibold mb-2">✅ Phase 1: Foundation Complete</h2>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Next.js 14+ with TypeScript</li>
                            <li>• Prisma ORM with PostgreSQL</li>
                            <li>• Encryption utilities (AES-256-GCM)</li>
                            <li>• Docker Compose (PostgreSQL + Redis)</li>
                            <li>• PWA configuration</li>
                        </ul>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                        <h2 className="font-semibold mb-2">🚀 Next Steps</h2>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Start Docker containers: <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">docker-compose up -d</code></li>
                            <li>• Run database migrations: <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">npx prisma db push</code></li>
                            <li>• Phase 2: Authentication System</li>
                            <li>• Phase 3: Playwright Scraper</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
