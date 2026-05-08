export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Built with{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Next.js
          </span>{" "}
          ·{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Supabase
          </span>{" "}
          ·{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Vercel
          </span>{" "}
          ·{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Cloudflare
          </span>
        </p>
        <p className="mt-2 text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} MyWebSet. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
