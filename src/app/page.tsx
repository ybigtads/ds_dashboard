import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          DS Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Kaggle-style Data Science Competition Platform
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/competitions"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Competitions
          </Link>
          <Link
            href="/register"
            className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold mb-2">Compete</h3>
          <p className="text-gray-600">
            Join data science competitions and improve your skills by solving real-world problems.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">Submit</h3>
          <p className="text-gray-600">
            Upload your predictions in CSV format and get instant feedback on your score.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl mb-4">📈</div>
          <h3 className="text-lg font-semibold mb-2">Track</h3>
          <p className="text-gray-600">
            Monitor your progress on the leaderboard and see how you rank against others.
          </p>
        </div>
      </div>
    </div>
  );
}
