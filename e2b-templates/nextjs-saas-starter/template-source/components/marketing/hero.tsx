import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="py-12 sm:py-16 lg:py-28 relative overflow-hidden">
      {/* 90s geometric background patterns */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 border-4 border-purple-600 rotate-45"></div>
        <div className="absolute bottom-40 right-20 w-40 h-40 border-4 border-amber-500 rotate-12"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-200 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          <div className="lg:col-span-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 tracking-tight">
              Build Your SaaS,
              <span className="block mt-2 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent animate-gradient">
                Act Right
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed font-medium">
              Launch faster with authentication, payments, and database included.
              Stop rebuilding the same features. Start shipping your product.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-4 border-purple-900 shadow-[6px_6px_0px_0px_rgba(109,40,217,0.4)] hover:shadow-[3px_3px_0px_0px_rgba(109,40,217,0.4)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-200 font-bold animate-pulse-glow"
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
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl border-4 border-gray-900 hover:border-purple-600 hover:text-purple-700 font-bold"
              >
                <Link href="/sign-up">
                  View Demo
                </Link>
              </Button>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-6">
            <div className="relative">
              {/* 90s starburst background */}
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-200 via-purple-200 to-purple-300 rounded-2xl opacity-20 blur-xl"></div>

              <div className="relative aspect-video bg-gradient-to-br from-purple-100 via-purple-50 to-amber-50 rounded-xl border-4 border-purple-900 shadow-[10px_10px_0px_0px_rgba(109,40,217,0.3)] p-6 sm:p-8 flex items-center justify-center overflow-hidden">
                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(purple 1px, transparent 1px), linear-gradient(90deg, purple 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>

                <div className="text-center relative z-10">
                  <div className="text-5xl sm:text-6xl mb-4">⚡</div>
                  <p className="text-purple-900 font-bold text-sm sm:text-base uppercase tracking-wider">Live Demo Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
