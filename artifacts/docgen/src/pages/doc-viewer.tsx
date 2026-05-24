import { useGetDoc, getGetDocQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Download, Copy, Calendar, Github, FileCode, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";

export default function DocViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { data: doc, isLoading, isError } = useGetDoc(Number(id), {
    query: {
      enabled: !!id,
      queryKey: getGetDocQueryKey(Number(id))
    }
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (doc) {
      navigator.clipboard.writeText(doc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (doc) {
      const blob = new Blob([doc.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/\s+/g, '-').toLowerCase()}-${doc.docType}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">Document not found</h2>
        <p className="text-muted-foreground mb-6">The documentation you're looking for doesn't exist or has been deleted.</p>
        <Link href="/history">
          <Button>Back to History</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 h-full flex flex-col pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/history">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-none">{doc.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="capitalize text-[10px] py-0 px-2 h-5 bg-primary/10 text-primary border-primary/20">
                {doc.docType}
              </Badge>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(doc.createdAt), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-1">
                {doc.sourceType === 'github' ? <Github className="h-3 w-3" /> : <FileCode className="h-3 w-3" />}
                {doc.sourceType === 'github' ? 'GitHub' : 'Raw Code'}
              </div>
              {doc.language && (
                <div className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] font-mono border border-border">
                  {doc.language}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} data-testid="btn-copy">
            {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button size="sm" onClick={handleDownload} data-testid="btn-download">
            <Download className="h-4 w-4 mr-2" />
            Download MD
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 shrink-0">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-border"></div>
            <div className="w-3 h-3 rounded-full bg-border"></div>
            <div className="w-3 h-3 rounded-full bg-border"></div>
          </div>
          <div className="ml-4 text-xs font-mono text-muted-foreground select-all">
            {doc.title.replace(/\s+/g, '-').toLowerCase()}-{doc.docType}.md
          </div>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto prose prose-invert max-w-none prose-pre:bg-[#1a1b26] prose-pre:border prose-pre:border-border font-sans">
          {/* Simple Markdown Renderer fallback */}
          {doc.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
            if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
            if (line.startsWith('```')) {
              // Just a basic fallback for pre blocks
              return <div key={i} className="text-muted-foreground font-mono text-xs my-2">{line}</div>;
            }
            if (line.trim() === '') return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
          {/* Actually we want a better presentation for standard raw text since we couldn't install react-markdown */}
          <style>{`
            .custom-md-render pre { display: block; padding: 1rem; border-radius: 0.5rem; background: #0f1016 !important; border: 1px solid var(--color-border); overflow-x: auto; color: #e2e8f0; font-family: var(--font-mono); font-size: 0.875rem; margin: 1.5rem 0; }
            .custom-md-render code { font-family: var(--font-mono); font-size: 0.875em; padding: 0.2em 0.4em; background: rgba(255,255,255,0.1); border-radius: 0.25rem; }
            .custom-md-render pre code { padding: 0; background: transparent; border-radius: 0; }
            .custom-md-render p { margin-bottom: 1rem; line-height: 1.6; }
            .custom-md-render h1 { font-size: 2.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; }
            .custom-md-render h2 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; }
            .custom-md-render h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 1rem; }
            .custom-md-render ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
            .custom-md-render li { margin-bottom: 0.25rem; }
            .custom-md-render a { color: var(--color-primary); text-decoration: underline; text-underline-offset: 4px; }
            .custom-md-render blockquote { border-left: 4px solid var(--color-border); padding-left: 1rem; font-style: italic; color: var(--color-muted-foreground); margin: 1.5rem 0; }
          `}</style>
          
          <div 
            className="custom-md-render" 
            dangerouslySetInnerHTML={{ 
              __html: doc.content
                // Super basic markdown to HTML for presentation purposes since we can't use react-markdown
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*)\*/gim, '<em>$1</em>')
                .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
                .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>")
                .replace(/\n$/gim, '<br />')
                .replace(/```([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
            }} 
          />
        </div>
      </div>
    </div>
  );
}
