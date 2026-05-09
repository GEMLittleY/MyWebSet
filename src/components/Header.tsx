import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-[#2a3040] bg-[#0f1419]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold gold-text">⚔️ HearthGuide</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/decks" className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors">
            卡组库
          </Link>
          <Link href="/guides" className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors">
            攻略
          </Link>
          <Link href="/meta" className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors">
            Meta
          </Link>
          <Link href="/recommend" className="text-sm text-gray-400 hover:text-[#f0b232] transition-colors">
            AI推荐
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="?lang=en"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            EN
          </Link>
          <span className="text-gray-600">|</span>
          <Link
            href="?lang=zh"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            中文
          </Link>
        </div>
      </div>
    </header>
  );
}
