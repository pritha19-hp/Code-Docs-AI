import { useGetDocStats, useListRecentDocs } from "@workspace/api-client-react";
import { Link } from "wouter";
import { FileText, BookTemplate, Box, FileClock, ArrowRight, BookOpen, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDocStats();
  const { data: recentDocs, isLoading: recentLoading } = useListRecentDocs();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your generated technical documentation.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Docs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total">{statsLoading ? "-" : stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time generated</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-this-week">{statsLoading ? "-" : stats?.thisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">Documents created</p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">Quick Action</CardTitle>
            <BookOpen className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent className="pt-2">
            <Link href="/generate">
              <Button variant="secondary" className="w-full justify-between group" data-testid="btn-quick-generate">
                Generate New Docs
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Documentation</CardTitle>
            <CardDescription>Your latest generated files</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-md"></div>
                ))}
              </div>
            ) : recentDocs && recentDocs.length > 0 ? (
              <div className="space-y-4">
                {recentDocs.map((doc) => (
                  <Link 
                    key={doc.id} 
                    href={`/doc/${doc.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 bg-background hover:bg-accent/50 transition-colors"
                    data-testid={`link-recent-doc-${doc.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{doc.docType} • {doc.sourceType}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                <FileClock className="h-8 w-8 mb-3 opacity-20" />
                <p>No recent documentation found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentation Types</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-40 bg-muted animate-pulse rounded-md"></div>
            ) : (
              <div className="space-y-4 mt-2">
                {Object.entries(stats?.byType || {}).map(([type, count]) => {
                  const percentage = stats?.total ? Math.round(((count as number) / stats.total) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm capitalize">{type}</span>
                      </div>
                      <div className="flex items-center gap-4 w-1/2">
                        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count as number}</span>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(stats?.byType || {}).length === 0 && (
                   <p className="text-sm text-muted-foreground text-center py-4">No data available yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
