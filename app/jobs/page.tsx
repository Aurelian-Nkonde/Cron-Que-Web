"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HANGFIRE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/hangfire`;

function JobsContent() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Background jobs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Item scheduling runs on Hangfire. Live queues, scheduled jobs, and job
            history are on the dashboard below (opens the API&apos;s own UI).
          </p>
          <a
            href={HANGFIRE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Open Hangfire dashboard →
          </a>
          <iframe
            src={HANGFIRE_URL}
            title="Hangfire dashboard"
            className="h-[600px] w-full rounded-md border"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobsPage() {
  return (
    <AuthGuard>
      <JobsContent />
    </AuthGuard>
  );
}
