import { Button } from '@/components/ui/button';
import { ArrowRight, Github } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 border-y-4 border-purple-900 relative overflow-hidden">
      {/* 90s pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
      }}></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 uppercase tracking-tight">
          Ready to Build Something Fresh?
        </h2>
        <p className="text-lg sm:text-xl text-purple-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
          Join developers who are shipping faster with ReactWrite.
          Start building your SaaS today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-lg bg-white text-purple-700 hover:bg-gray-100 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] transition-all font-bold"
          >
            <Link href="/pricing">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-lg bg-transparent text-white border-2 border-white hover:bg-white/10 font-bold"
          >
            <Link href="https://github.com/i-dream-of-ai/reactwrite-saas-starter" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-5 w-5" />
              View on GitHub
            </Link>
          </Button>
        </div>
        <p className="mt-6 sm:mt-8 text-purple-200 text-xs sm:text-sm">
          Open source • MIT License • No credit card required
        </p>
      </div>
    </section>
  );
}
