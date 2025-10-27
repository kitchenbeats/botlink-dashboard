import { Shield, CreditCard, Database, Zap, Users, Code } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Authentication Built-In',
    description: 'Secure auth with sessions, password hashing, and team management out of the box.',
    color: 'purple',
  },
  {
    icon: CreditCard,
    title: 'Stripe Payments',
    description: 'Accept payments and manage subscriptions with webhooks already configured.',
    color: 'amber',
  },
  {
    icon: Database,
    title: 'Database Ready',
    description: 'PostgreSQL with Drizzle ORM. Migrations and schema management included.',
    color: 'purple',
  },
  {
    icon: Zap,
    title: 'Next.js 16',
    description: 'Latest framework features with App Router, Server Components, and Turbopack.',
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Multi-tenant architecture with role-based access control ready to go.',
    color: 'purple',
  },
  {
    icon: Code,
    title: 'Clean Codebase',
    description: 'TypeScript, ESLint, organized structure. Easy to understand and extend.',
    color: 'amber',
  },
];

export function Features() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Everything You Need to Launch
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Skip months of setup. Start with production-ready features from day one.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colorClasses = feature.color === 'purple'
              ? 'from-purple-600 to-purple-700 border-purple-900 shadow-[3px_3px_0px_0px_rgba(109,40,217,0.4)]'
              : 'from-amber-500 to-amber-600 border-amber-700 shadow-[3px_3px_0px_0px_rgba(217,119,6,0.4)]';

            return (
              <div key={feature.title} className="bg-white p-6 rounded-xl border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                <div className={`flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br ${colorClasses} text-white border-3 mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-600 font-medium">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
