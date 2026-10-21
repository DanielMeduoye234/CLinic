import Link from 'next/link';
import { Stethoscope, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
        <Stethoscope className="w-8 h-8" />
      </div>
      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-slate-900">
        404 — Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
        The clinical page or consultation room you are looking for does not exist or has been relocated.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to CLINIC Home</span>
        </Link>
      </div>
    </div>
  );
}
