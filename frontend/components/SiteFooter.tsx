import Link from "next/link";
import BrandLogo from "./BrandLogo";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold"><BrandLogo className="h-7 w-7" /> CoverCraft</div>
          <p className="mt-3 text-sm text-navy-500">Your Academic Documents, Professionally Presented.</p>
        </div>
        <nav aria-label="Product" className="text-sm">
          <p className="font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-navy-500">
            <li><Link href="/create">Create cover page</Link></li>
            <li><Link href="/templates">Templates</Link></li>
            <li><Link href="/feedback">Send feedback</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company" className="text-sm">
          <p className="font-semibold">Company</p>
          <ul className="mt-3 space-y-2 text-navy-500">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/feedback">Contact</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-slate-200 py-4 text-center text-xs text-navy-500">© {new Date().getFullYear()} CoverCraft. Always check your institution&apos;s formatting rules.</p>
    </footer>
  );
}
