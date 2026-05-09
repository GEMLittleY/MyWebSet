import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#2a3040] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold gold-text mb-3">⚔️ HearthGuide</h3>
            <p className="text-sm text-gray-500">
              最全面的炉石传说攻略与卡组数据库
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-3">导航</h4>
            <div className="space-y-2">
              <Link href="/decks" className="block text-sm text-gray-500 hover:text-[#f0b232]">卡组库</Link>
              <Link href="/guides" className="block text-sm text-gray-500 hover:text-[#f0b232]">攻略文章</Link>
              <Link href="/meta" className="block text-sm text-gray-500 hover:text-[#f0b232]">Meta 报告</Link>
              <Link href="/recommend" className="block text-sm text-gray-500 hover:text-[#f0b232]">AI 推荐</Link>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-3">关于</h4>
            <p className="text-sm text-gray-500">
              HearthGuide 是一个免费的炉石传说攻略站，帮助玩家更好地了解当前 Meta 并选择合适的卡组上分。
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#2a3040] text-center text-xs text-gray-600">
          © {new Date().getFullYear()} HearthGuide. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
