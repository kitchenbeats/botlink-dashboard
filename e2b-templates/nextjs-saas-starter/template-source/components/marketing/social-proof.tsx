export function SocialProof() {
  return (
    <section className="py-8 sm:py-12 bg-white border-y-2 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs sm:text-sm font-medium text-gray-500 mb-6 sm:mb-8">
          TRUSTED BY DEVELOPERS BUILDING THE NEXT BIG THING
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-center justify-items-center">
          {['Startup A', 'Company B', 'Product C', 'Team D'].map((name) => (
            <div
              key={name}
              className="w-28 h-14 sm:w-32 sm:h-16 rounded-lg border-3 border-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(109,40,217,0.3)]"
            >
              <span className="text-purple-800 font-black text-sm sm:text-base">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
