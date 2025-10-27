import { Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t-4 border-purple-900 relative overflow-hidden">
      {/* 90s geometric pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-20 w-32 h-32 border-4 border-purple-500 rotate-45"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 border-4 border-amber-500 rotate-12"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-black mb-4 uppercase tracking-wide">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-purple-400 transition-colors font-medium">Features</a></li>
              <li><a href="#pricing" className="hover:text-purple-400 transition-colors font-medium">Pricing</a></li>
              <li><a href="#docs" className="hover:text-purple-400 transition-colors font-medium">Documentation</a></li>
              <li><a href="#changelog" className="hover:text-purple-400 transition-colors font-medium">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black mb-4 uppercase tracking-wide">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#blog" className="hover:text-purple-400 transition-colors font-medium">Blog</a></li>
              <li><a href="#guides" className="hover:text-purple-400 transition-colors font-medium">Guides</a></li>
              <li><a href="#examples" className="hover:text-purple-400 transition-colors font-medium">Examples</a></li>
              <li><a href="#community" className="hover:text-purple-400 transition-colors font-medium">Community</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black mb-4 uppercase tracking-wide">Company</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="hover:text-purple-400 transition-colors font-medium">About</a></li>
              <li><a href="#contact" className="hover:text-purple-400 transition-colors font-medium">Contact</a></li>
              <li><a href="#careers" className="hover:text-purple-400 transition-colors font-medium">Careers</a></li>
              <li><a href="#privacy" className="hover:text-purple-400 transition-colors font-medium">Privacy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black mb-4 uppercase tracking-wide">Connect</h3>
            <div className="flex gap-3">
              <a
                href="https://github.com/i-dream-of-ai/reactwrite-saas-starter"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-gray-800 hover:bg-purple-600 flex items-center justify-center transition-all border-3 border-gray-700 hover:border-purple-500 shadow-[2px_2px_0px_0px_rgba(75,85,99,0.5)] hover:shadow-[1px_1px_0px_0px_rgba(75,85,99,0.5)] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-gray-800 hover:bg-purple-600 flex items-center justify-center transition-all border-3 border-gray-700 hover:border-purple-500 shadow-[2px_2px_0px_0px_rgba(75,85,99,0.5)] hover:shadow-[1px_1px_0px_0px_rgba(75,85,99,0.5)] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent uppercase tracking-tight">
              ReactWrite
            </div>
            <p className="text-sm text-gray-400 font-medium">
              © {new Date().getFullYear()} ReactWrite. Open source under MIT License.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
