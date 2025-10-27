export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Clone & Install',
      description: 'Get the repo, run one command. Dependencies installed in seconds.',
    },
    {
      step: '02',
      title: 'Configure',
      description: 'Add your database URL and Stripe keys. Clear instructions included.',
    },
    {
      step: '03',
      title: 'Customize',
      description: 'Update branding, add your features. Built to be extended easily.',
    },
    {
      step: '04',
      title: 'Deploy',
      description: 'Push to Vercel, Railway, or anywhere. Production-ready from the start.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Launch in Minutes, Not Months
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Simple process to get your SaaS up and running
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl border-4 border-purple-900 shadow-[6px_6px_0px_0px_rgba(109,40,217,0.4)] p-6">
                <div className="text-6xl font-black opacity-20 mb-2">{item.step}</div>
                <h3 className="text-xl font-black mb-2 uppercase">{item.title}</h3>
                <p className="text-purple-100 font-medium">{item.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-purple-300">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
