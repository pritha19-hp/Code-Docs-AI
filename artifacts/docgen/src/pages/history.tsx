import { useListDocs, useDeleteDoc, getListDocsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, ExternalLink, Github, FileCode, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";

export default function HistoryPage() {
  const { data: docs, isLoading } = useListDocs();
  const deleteDoc = useDeleteDoc();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDoc.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDocsQueryKey() });
          }
        }
      );
    }
  };

  const filteredDocs = docs?.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.docType.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">History</h1>
          <p className="text-muted-foreground">Manage your generated documentation.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search docs..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 bg-muted rounded w-48 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-5 bg-muted rounded w-20 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-5 bg-muted rounded w-24 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-5 bg-muted rounded w-24 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 bg-muted rounded w-20 animate-pulse ml-auto"></div></TableCell>
                  </TableRow>
                ))
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="group hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize bg-background">
                        {doc.docType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {doc.sourceType === 'github' ? (
                          <Github className="h-3.5 w-3.5" />
                        ) : (
                          <FileCode className="h-3.5 w-3.5" />
                        )}
                        <span className="truncate max-w-[150px]">
                          {doc.sourceType === 'github' ? 'GitHub' : 'Raw Code'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/doc/${doc.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2" data-testid={`btn-view-${doc.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(doc.id)}
                          data-testid={`btn-delete-${doc.id}`}
                          disabled={deleteDoc.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No documentation found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
