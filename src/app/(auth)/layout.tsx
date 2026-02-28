import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <span className="text-lg font-bold">Tariff Compliance Copilot</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            AI-Powered Import Compliance Intelligence
          </h2>
          <p className="text-primary-foreground/80">
            Classify goods, calculate duties, score risks, and simulate tariff
            scenarios — built for small-to-mid-size importers.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Built with Next.js, Firebase, Claude AI
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
